import app from "./src/app.js";
import { connectToDatabase } from "./src/config/prisma.js";
import { config } from "./src/config/config.js";
import { startListeningToPubSub } from "./src/services/webhook.service.js"; // Adjust the path as necessary

async function startServer() {
  try {
    await connectToDatabase();
    startListeningToPubSub(); // Start the Pub/Sub listener
    app.listen(config.port, () => {
      console.log(`Server is running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
}

startServer();
