import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1); // Exit the process with an error code
  }
}

export default prisma;
