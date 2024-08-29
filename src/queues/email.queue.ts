import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { config } from "../config/config.js";

// Initialize Redis connection
const connection = new Redis(config.redisUrl);

// Create a new BullMQ queue for processing emails
export const emailQueue = new Queue("emailQueue", { connection });
