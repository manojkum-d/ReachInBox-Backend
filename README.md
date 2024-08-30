# Email Automation Tool

## Overview

This TypeScript-based tool automates the processing of emails in Gmail and Outlook. It parses incoming emails, understands their context using AI, assigns labels, and sends automated replies. The tool utilizes BullMQ for task scheduling, Redis for job management, and OpenAI for generating intelligent responses.

## Features

- **OAuth Integration**: Secure OAuth2 setup for Gmail and Outlook.
- **Email Parsing & Labeling**: Automatically labels emails as `Interested`, `Not Interested`, or `More Information` based on content.
- **Automated Replies**: Uses OpenAI to generate and send context-aware replies.
- **Task Scheduling**: BullMQ and Redis manage job queues for scalable processing.

## Technologies Used

- **TypeScript**: For building a type-safe and scalable application.
- **Google Cloud Pub/Sub**: For real-time email notifications.
- **Gmail & Microsoft Graph API**: For email access and management.
- **BullMQ**: For managing job queues and scheduling tasks.
- **Redis**: For storing job states and task management.
- **OpenAI**: For generating intelligent, context-based email responses.
- **Prisma**: For interacting with the database.

## Setup

### Prerequisites

- **Node.js** (>=14.x)
- **Redis Server**
- **OAuth Credentials** from Google and Microsoft.

### Installation

1. **Clone the repository:**

   ```bash
   git clone [https://github.com/manojkum-d/ReachInBox-Backend](https://github.com/manojkum-d/ReachInBox-Backend)
   cd ReachInBox-Backend
   
2.**Install dependencies**:

    ```bash
    git clone [https://github.com/manojkum-d/ReachInBox-Backend](https://github.com/manojkum-d/ReachInBox-Backend)
    cd ReachInBox-Backend

3.**Configure environment variables**:

    GOOGLE_CLIENT_ID=your-google-client-id
    GOOGLE_CLIENT_SECRET=your-google-client-secret
    GOOGLE_REDIRECT_URI=your-google-redirect-uri
    OUTLOOK_CLIENT_ID=your-outlook-client-id
    OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
    OUTLOOK_REDIRECT_URI=your-outlook-redirect-uri
    REDIS_HOST=localhost
    REDIS_PORT=6379
    GEMINI_API_KEY=your-gemini-api-key

    
4.**Run the application**:

Compile TypeScript to JavaScript
Make sure your TypeScript files are compiled into JavaScript. If you're using a common setup, you might have a command in your package.json for building the project:

    npm run build
    
This will compile your TypeScript files into JavaScript files in the dist/ directory.


4.**Run the Worker Script**

Once the files are compiled, you can run the worker script using Node.js:

    node dist/src/workers/email.worker.js


5.**Run the Project**
Once the files are compiled, you can run the project:

    npm run dev







   
   


  
