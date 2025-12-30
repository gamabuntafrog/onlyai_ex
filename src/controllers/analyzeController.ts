import { createFactory } from "hono/factory";
import { Variables } from "@typings/hono";
import AnalyzeService from "@services/analyzeService";
import mapper from "@mappers/mapper";
import {
  analyzeRequestSchema,
  getAnalysisSchema,
} from "@validators/analyzeValidator";
import { NotFoundError } from "@errors/AppError";
import { ERROR_CODES } from "@constants/errorCodes";

const factory = createFactory<{ Variables: Variables }>();

class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  /**
   * Create a new analysis request
   * POST /analyze
   */
  public createAnalysis = factory.createHandlers(async (c) => {
    // Get userId from context (set by auth middleware)
    const user = c.get("user")!;

    const input = await mapper.toDTO(c, analyzeRequestSchema);
    const result = await this.analyzeService.createAnalysis(user.id, input);

    return c.json(result, 201);
  });

  /**
   * Get analysis state by request ID
   * GET /analyze/:requestId
   */
  public getAnalysis = factory.createHandlers(async (c) => {
    const { requestId } = await mapper.toDTO(c, getAnalysisSchema);
    const state = await this.analyzeService.getAnalysis(requestId);

    if (!state) {
      throw new NotFoundError("Analysis not found", ERROR_CODES.NOT_FOUND);
    }

    return c.json(state);
  });
}

export default AnalyzeController;
