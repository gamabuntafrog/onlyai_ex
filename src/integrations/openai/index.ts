import OpenAI from "openai";
import config from "@config";
import { IOpenAIClient } from "./IOpenAIClient";
import { AnalysisInput } from "@typings/analyze";
import logger from "@utilities/logger";

/**
 * OpenAI client implementation wrapping OpenAI SDK
 * Encapsulates OpenAI library and provides domain-specific methods
 */
class OpenAIClient implements IOpenAIClient {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  /**
   * Generate a short personality summary based on user input
   */
  public async generatePersonalitySummary(
    input: AnalysisInput
  ): Promise<string> {
    try {
      const prompt = `Based on the following information, generate a short personality summary (2-3 sentences):

Name: ${input.name}
Age: ${input.age}
Description: ${input.description}

Provide a concise, insightful personality summary:`;

      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const summary =
        response.choices[0]?.message?.content?.trim() ||
        "Unable to generate personality summary.";

      return summary;
    } catch (error) {
      logger.error("Failed to generate personality summary from OpenAI", {
        error,
        input,
      });
      throw error;
    }
  }
}

export default OpenAIClient;
