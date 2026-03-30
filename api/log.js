import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const logs = await redis.lrange('logs', 0, -1);
  res.status(200).json(logs);
}
