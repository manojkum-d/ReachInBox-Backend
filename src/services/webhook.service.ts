/* eslint-disable @typescript-eslint/no-explicit-any */
import { Message, PubSub } from "@google-cloud/pubsub";
import { google, gmail_v1 } from "googleapis";
import { config } from "../config/config.js";
import prisma from "../config/prisma.js";
import { emailQueue } from "../queues/email.queue.js";
// import { Redis } from "ioredis";

const pubsubClient = new PubSub({ projectId: config.projectId });
// const connection = new Redis({
//   host: "localhost",
//   port: 6379,
//   maxRetriesPerRequest: null,
// });

async function handlePubSubMessage(message: Message) {
  try {
    const decodedMessageData = atob(message.data.toString("base64"));
    const data = JSON.parse(decodedMessageData);

    const emailAddress = data.emailAddress;
    const historyId = data.historyId;

    if (!emailAddress || !historyId) {
      console.error(
        "Email address or historyId missing in the Pub/Sub message data."
      );
      throw new Error(
        "Invalid message structure: Email address or historyId is missing."
      );
    }

    console.log(
      `Processing history for email: ${emailAddress}, historyId: ${historyId}`
    );

    const user = await prisma.user.findUnique({
      where: { email: emailAddress },
    });

    if (!user || !user.oauthAccessToken || !user.oauthRefreshToken) {
      console.error(`No OAuth tokens found for user: ${emailAddress}`);
      throw new Error(`User with email ${emailAddress} is not authenticated.`);
    }

    const oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.oauthRedirectUri
    );

    oauth2Client.setCredentials({
      access_token: user.oauthAccessToken,
      refresh_token: user.oauthRefreshToken,
    });

    const currentTime = new Date().getTime();
    const tokenExpiryTime = new Date(user.accessTokenExpiry as Date).getTime();

    if (currentTime >= tokenExpiryTime) {
      console.log("Access token expired, refreshing...");

      const newTokens = await oauth2Client.refreshAccessToken();
      const newAccessToken = newTokens.credentials.access_token;
      const newExpiryDate = newTokens.credentials.expiry_date;

      if (newAccessToken) {
        await prisma.user.update({
          where: { email: emailAddress },
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
    }

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    let historyResponse = await gmail.users.history.list({
      userId: "me",
      startHistoryId: historyId,
      historyTypes: ["messageAdded"],
    });

    console.log(
      "History Response:",
      JSON.stringify(historyResponse.data, null, 2)
    );

    let histories = historyResponse.data.history;

    if (!histories || histories.length === 0) {
      console.log(
        "No new messages found in the history. Trying older historyId or fallback to latest messages."
      );

      const olderHistoryId = String(Number(historyId) - 100);
      historyResponse = await gmail.users.history.list({
        userId: "me",
        startHistoryId: olderHistoryId,
        historyTypes: ["messageAdded"],
      });

      console.log(
        "Older History Response:",
        JSON.stringify(historyResponse.data, null, 2)
      );

      histories = historyResponse.data.history;

      if (!histories || histories.length === 0) {
        console.log(
          "No messages in older history. Fetching latest messages directly."
        );

        const latestMessages = await gmail.users.messages.list({
          userId: "me",
          maxResults: 5,
        });

        if (latestMessages.data.messages) {
          for (const msg of latestMessages.data.messages) {
            const messageId = msg.id;
            if (messageId) {
              console.log(`Fallback - Found message with ID: ${messageId}`);
              await processEmail(gmail, messageId);
            }
          }
        }

        message.ack();
        return;
      }
    }

    for (const history of histories) {
      if (history.messagesAdded) {
        for (const msg of history.messagesAdded) {
          const messageId = msg.message?.id;
          if (messageId) {
            console.log(`Found new message with ID: ${messageId}`);
            await processEmail(gmail, messageId);
          }
        }
      }
    }

    message.ack();
  } catch (error) {
    console.error("Error processing Pub/Sub message:", error);
    message.nack();
  }
}

async function processEmail(gmail: gmail_v1.Gmail, messageId: string) {
  const emailResponse = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
  });

  const emailData = emailResponse.data;

  if (emailData) {
    console.log("Email received:", emailData.snippet ?? "No snippet available");

    const subject = getHeader(emailData.payload?.headers, "Subject");
    console.log(`Subject: ${subject}`);
    console.log(`Snippet: ${emailData.snippet}`);

    // Use a deduplication key based on the messageId
    const jobId = `process:${messageId}`;

    // Check if a job with the same ID is already in the queue
    const existingJob = await emailQueue.getJob(jobId);

    if (!existingJob) {
      await emailQueue.add(
        "processEmail",
        { emailData },
        {
          jobId, // Ensure the job ID is unique per messageId
          removeOnComplete: true, // Clean up completed jobs
          removeOnFail: true, // Clean up failed jobs
        }
      );
    } else {
      console.log(`Job with ID ${jobId} already exists in the queue.`);
    }
  }
}

export function startListeningToPubSub() {
  const subscription = pubsubClient.subscription(
    config.subscriptionName as string
  );
  console.log(`Listening to Pub/Sub subscription: ${config.subscriptionName}`);

  subscription.on("message", handlePubSubMessage);
  subscription.on("error", (error) => {
    console.error("Error in Pub/Sub subscription:", error);
  });
}

function getHeader(headers: any, name: string): string | undefined {
  const header = headers?.find(
    (h: any) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value;
}
