import { Queue } from "bullmq";
import { bullConnection } from "../../shared/queue/bullmq-connection";

export interface EmailJobData {
  to: string;
  subject: string;
  template: "welcome" | "order-confirmation";
  context: Record<string, unknown>;
}

export const emailQueue = new Queue<EmailJobData>("email", {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
