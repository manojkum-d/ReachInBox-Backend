import { Queue } from "bullmq";
import { Redis } from "ioredis";
// Ensure this path is correct

// Initialize Redis connection
const connection = new Redis({
  host: "localhost", // Adjust if Redis is not on localhost
  port: 6379, // Adjust the port if different
  //   maxRetriesPerRequest: null,
});

// Initialize the queue
const queue = new Queue("emailQueue", { connection });

async function clearQueue() {
  try {
    // Obliterate the queue, removing all jobs and the queue itself from Redis
    await queue.obliterate({ force: true });

    console.log("Queue obliterated successfully.");
  } catch (error) {
    console.error("Error obliterating queue:", error);
  } finally {
    await connection.quit();
  }
}

clearQueue();
