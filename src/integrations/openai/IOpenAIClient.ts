import { AnalysisInput } from "@typings/analyze";

/**
 * OpenAI client interface (port)
 * Defines the contract for OpenAI domain operations
 */
export interface IOpenAIClient {
  /**
   * Generate a short personality summary based on user input
   */
  generatePersonalitySummary(input: AnalysisInput): Promise<string>;
}
