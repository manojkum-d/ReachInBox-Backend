import express from "express";
import cors from "cors";
import { setupSwagger } from "./config/swagger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import oauthRouter from "./routes/oauth.routes.js";
import outlookOAuthRouter from "./routes/outlookOAuth.routes.js";
import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter.js";
import { emailQueue } from "./queues/email.queue.js"; // Assuming this is your queue setup
// import emailRouter from "./routes/email.routes.js";

const app = express();

// Setup Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({
  queues: [new BullAdapter(emailQueue)],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

app.use(cors());
app.use(express.json());

setupSwagger(app);

app.use("/api/oauth", oauthRouter);
app.use("/api/oauth", outlookOAuthRouter);
// app.use("/api/emails", emailRouter);

app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy!");
});

app.use(errorHandler);

export default app;
