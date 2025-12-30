import { Client } from "@upstash/qstash";
import config from "@config";
import { QStashPayload } from "@typings/analyze";
import logger from "@utilities/logger";
import { IQStashClient } from "./IQStashClient";

class QStashClient implements IQStashClient {
  private readonly client: Client;

  constructor() {
    this.client = new Client({
      token: config.QSTASH_TOKEN,
    });
  }

  /**
   * Publish a delayed job to QStash
   * @param url - The webhook URL to call
   * @param payload - The payload to send
   * @param delaySeconds - Delay in seconds before executing
   */
  public async publishDelayedJob(
    url: string,
    payload: QStashPayload,
    delaySeconds: number = 60
  ): Promise<void> {
    try {
      console.log("payload", payload);
      await this.client.publishJSON({
        url,
        body: payload,
        delay: delaySeconds,
      });

      logger.info("Published delayed job to QStash", {
        url,
        delaySeconds,
        requestId: payload.requestId,
      });
    } catch (error) {
      logger.error("Failed to publish delayed job to QStash", {
        error,
        url,
        payload,
      });

      throw error;
    }
  }
}

export default new QStashClient();
