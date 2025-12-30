import { QStashPayload } from "@typings/analyze";

/**
 * QStash client interface (port)
 * Defines the contract for QStash domain operations
 */
export interface IQStashClient {
  /**
   * Publish a delayed job to QStash
   * @param url - The webhook URL to call
   * @param payload - The payload to send
   * @param delaySeconds - Delay in seconds before executing
   */
  publishDelayedJob(
    url: string,
    payload: QStashPayload,
    delaySeconds?: number
  ): Promise<void>;
}
