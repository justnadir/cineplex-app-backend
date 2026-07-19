import { redisClient } from "../../config/redis";
export const bullConnection = redisClient.duplicate({
  maxRetriesPerRequest: null,
});
