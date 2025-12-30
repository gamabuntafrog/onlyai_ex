import { Hono } from "hono";
import { Variables } from "@typings/hono";
import AnalyzeController from "@controllers/analyzeController";
import { authenticate } from "@middleware/authMiddleware";

export default function createAnalyzeRoutes(
  analyzeController: AnalyzeController
): Hono<{ Variables: Variables }> {
  const app = new Hono<{ Variables: Variables }>();

  // POST /analyze - Create new analysis request (requires auth)
  app.post("/analyze", authenticate, ...analyzeController.createAnalysis);

  // GET /analyze/:requestId - Get analysis state (requires auth)
  app.get(
    "/analyze/:requestId",
    authenticate,
    ...analyzeController.getAnalysis
  );

  return app;
}
