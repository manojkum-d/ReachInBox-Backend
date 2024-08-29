/* eslint-disable @typescript-eslint/no-explicit-any */
import { Worker, Job } from "bullmq";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config/config.js";
import prisma from "../config/prisma.js";
import { Redis } from "ioredis";
import { GoogleGenerativeAI } from "@google/generative-ai";
// import { emailQueue } from "../queues/email.queue.js";

// Initialize Redis connection
const connection = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(`${config.geminiApi}`);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Function to extract headers from the email data
function getHeader(headers: any[], name: string): string | undefined {
  const header = headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header ? header.value : undefined;
}

// Improved function to extract a clean email address from a potentially messy "From" or "To" header
function extractEmailAddress(emailHeader: string): string {
  // First, try to match an email address within angle brackets
  const matchAngleBrackets = emailHeader.match(/<([^>]+)>/);
  if (matchAngleBrackets) {
    return matchAngleBrackets[1].trim();
  }

  // If no angle brackets, try to match a simple email address
  const matchSimpleEmail = emailHeader.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (matchSimpleEmail) {
    return matchSimpleEmail[0].trim();
  }

  // If no valid email found, return the original string trimmed
  return emailHeader.trim();
}

// Function to reply to the email using Gmail API
async function replyToEmail(
  userEmail: string,
  recipientEmail: string,
  subject: string,
  message: string,
  threadId: string,
  messageId: string
) {
  // Extract the clean email address
  const recipient = extractEmailAddress(recipientEmail);

  console.log(`Extracted recipient email: ${recipient}`);

  if (!recipient || !recipient.includes("@")) {
    console.error(`Invalid recipient email address: ${recipientEmail}`);
    throw new Error("Invalid recipient email address");
  }

  if (recipient.toLowerCase().includes("noreply")) {
    console.warn(
      `Attempting to send to a noreply address: ${recipient}. Skipping.`
    );
    return; // Exit the function without sending the email
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error(`User with email ${userEmail} not found`);
  }

  const oauth2Client = new OAuth2Client(
    config.googleClientId,
    config.googleClientSecret,
    config.oauthRedirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: user.oauthRefreshToken,
    expiry_date: user.accessTokenExpiry
      ? user.accessTokenExpiry.getTime()
      : null,
  });

  // Refresh token if needed
  if (
    user.accessTokenExpiry &&
    Date.now() >= user.accessTokenExpiry.getTime()
  ) {
    console.log("Access token expired, refreshing...");
    try {
      const newTokens = await oauth2Client.refreshAccessToken();
      const newAccessToken = newTokens.credentials.access_token;
      const newExpiryDate = newTokens.credentials.expiry_date;

      if (newAccessToken) {
        await prisma.user.update({
          where: { email: userEmail },
          data: {
            oauthAccessToken: newAccessToken,
            accessTokenExpiry: newExpiryDate
              ? new Date(newExpiryDate)
              : undefined,
          },
        });

        oauth2Client.setCredentials({
          access_token: newAccessToken,
        });
      }
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new Error("Failed to refresh access token");
    }
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    const rawMessage = `
From: ${userEmail}
To: ${recipient}
Subject: Re: ${subject}
In-Reply-To: ${messageId}
References: ${messageId}

${message}
    `.trim();

    console.log("Raw message:", rawMessage);

    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        threadId: threadId,
      },
    });

    console.log(`Email replied successfully. Message ID: ${response.data.id}`);
  } catch (error: any) {
    console.error(`Failed to reply to email ${recipient}:`, error);
    if (error.response) {
      console.error("Error response:", error.response.data);
    }
    throw error;
  }
}

// Function to generate AI response and send it via Gmail
async function processEmailJob(job: Job<any, any, string>) {
  const { emailData } = job.data;

  // Extract email snippet, subject, sender's email, threadId, and messageId
  const emailSnippet = emailData.snippet || "No snippet available";
  const emailSubject =
    getHeader(emailData.payload.headers, "Subject") || "No Subject";
  const senderEmail = getHeader(emailData.payload.headers, "From");
  const userEmail = getHeader(emailData.payload.headers, "Delivered-To");
  const threadId = emailData.threadId;
  const messageId = getHeader(emailData.payload.headers, "Message-ID");

  if (!userEmail) {
    console.error("User email not found in email data");
    throw new Error("User email not found in email data");
  }

  if (!senderEmail) {
    console.error("Sender email not found in email data");
    throw new Error("Sender email not found in email data");
  }

  if (!threadId || !messageId) {
    console.error("Thread ID or Message ID not found in email data");
    throw new Error("Thread ID or Message ID not found in email data");
  }

  console.log(`Processing email with subject: ${emailSubject}`);
  console.log(`Sender email: ${senderEmail}`);
  console.log(`Recipient email: ${userEmail}`);

  try {
    // Check if this email has already been processed by looking up a unique identifier in Redis
    const emailKey = `processed:${messageId}`;
    const alreadyProcessed = await connection.get(emailKey);

    if (alreadyProcessed) {
      console.log(`Email with ID ${messageId} has already been processed.`);
      return;
    }

    // Improved prompt for better AI-generated responses
    const prompt = `
      You are an AI assistant handling customer inquiries via email. Analyze the following email response based on the context and generate a reply. The reply should be natural, context-aware, and directly address the sender's intent.

      Instructions:
      - If the sender expresses interest in learning more, suggest a time for a demo call by proposing a couple of options.
      - If the sender explicitly mentions they are not interested, acknowledge their decision, thank them for their time, and close the conversation politely.
      - If the sender asks vague or general questions (e.g., "How are you?"), try to engage them by offering relevant information or asking how you can assist them further.
      - If the email is a forward or lacks clear intent or context, respond by thanking them for the information and asking how you can assist them with your product or service.

      Subject: ${emailSubject}
      Content: ${emailSnippet}
    `;

    const result = await model.generateContent(prompt);
    let response = result.response.text();

    // Customize the response to be more general and remove unnecessary labels
    response = response
      .replace(/\*\*Therefore.*?\*\*\n\n/g, "")
      .replace(/\*\*Suggested response:\*\*\n\n/g, "");

    console.log(`Attempting to reply to email: ${senderEmail}`);

    try {
      await replyToEmail(
        userEmail,
        senderEmail,
        emailSubject,
        response,
        threadId,
        messageId
      );
      console.log("Email replied successfully or skipped if noreply.");

      // Mark the email as processed in Redis with an expiry of 24 hours
      await connection.set(emailKey, "true", "EX", 86400);
    } catch (sendError) {
      console.error("Error in replyToEmail:", sendError);
      // Handle errors and potentially retry sending the email
    }

    return response; // Return the response as the job result
  } catch (error: any) {
    console.error(`Error processing job ${job.id}: ${error.message}`);
    throw error; // Re-throw the error to be handled by the worker
  }
}

// Create a worker to process the email queue
const emailWorker = new Worker(
  "emailQueue",
  async (job: Job<any, any, string>) => {
    try {
      console.log(`Starting job ${job.id}`);
      const result = await processEmailJob(job);
      return result; // Return the result to mark the job as completed
    } catch (err) {
      console.error(`Failed to process job ${job.id}:`, err);
      throw err; // Re-throw the error to mark the job as failed
    }
  },
  {
    connection,
    lockDuration: 600000, // 10 minutes
    concurrency: 1,
  }
);

// Event listeners for worker
emailWorker.on("completed", (job: Job<any, any, string>) => {
  console.log(`Job with id ${job.id} has been completed.`);
});

emailWorker.on(
  "failed",
  (job: Job<any, any, string> | undefined, err: Error) => {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `Job with id ${job?.id} has failed with error ${errorMessage}`
    );
  }
);

emailWorker.on("active", (job: Job<any, any, string>) => {
  console.log(`Job with id ${job.id} is now active.`);
});

emailWorker.on("stalled", (jobId: string) => {
  console.warn(`Job with id ${jobId} has stalled.`);
});

console.log("Worker is running and processing jobs...");

export default emailWorker;
