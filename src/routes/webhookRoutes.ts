import { Hono } from "hono";
import { Variables } from "@typings/hono";
import WebhookController from "@controllers/webhookController";
import { verifyQStashSignature } from "@middleware/qstashMiddleware";

export default function createWebhookRoutes(
  webhookController: WebhookController
): Hono<{ Variables: Variables }> {
  const app = new Hono<{ Variables: Variables }>();

  // POST /webhooks/qstash/analyze - QStash webhook handler (no auth, uses signature verification)
  app.post(
    "/webhooks/qstash/analyze",
    verifyQStashSignature,
    ...webhookController.handleAnalyzeWebhook
  );

  return app;
}
