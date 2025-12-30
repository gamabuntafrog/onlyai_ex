export type AnalysisStatus = "queued" | "processing" | "done" | "error";

export interface AnalysisInput {
  name: string;
  age: number;
  description: string;
}

export interface AnalysisState {
  requestId: string;
  userId: string;
  status: AnalysisStatus;
  input: AnalysisInput;
  result?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QStashPayload {
  requestId: string;
}
