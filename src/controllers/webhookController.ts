import { createFactory } from "hono/factory";
import { Variables } from "@typings/hono";
import AnalyzeService from "@services/analyzeService";
import { qstashWebhookSchema } from "@validators/analyzeValidator";
import logger from "@utilities/logger";

const factory = createFactory<{ Variables: Variables }>();

class WebhookController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  /**
   * Handle QStash webhook for analysis processing
   * POST /webhooks/qstash/analyze
   * Must always return 200 OK
   */
  public handleAnalyzeWebhook = factory.createHandlers(async (c) => {
    try {
      // Parse payload from raw body (already verified by middleware)
      const rawBody = c.get("rawBody") as string;
      const payload = JSON.parse(rawBody);

      // Validate payload using Zod
      const validationResult = qstashWebhookSchema.safeParse(payload);

      if (!validationResult.success) {
        logger.error("Invalid QStash webhook payload", {
          errors: validationResult.error.errors,
        });

        return c.json({ success: false, error: "Invalid payload" }, 200);
      }

      const { requestId } = validationResult.data;

      // Process analysis (idempotent)
      await this.analyzeService.processAnalysis(requestId);

      // Always return 200 OK
      return c.json({ success: true }, 200);
    } catch (error) {
      // Log error but still return 200 OK
      logger.error("Error processing QStash webhook", { error });

      // Always return 200 OK even on error
      return c.json({ success: false, error: "Internal error" }, 200);
    }
  });
}

export default WebhookController;
