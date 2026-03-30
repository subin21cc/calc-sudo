import { Redis } from '@upstash/redis';

// 환경 변수 오류 방지를 위해 에러 처리
let redis;
try {
  redis = Redis.fromEnv();
} catch (e) {
  console.error('Redis 초기화 실패:', e);
}

export default async function handler(req, res) {
  try {
    if (!redis) {
      return res.status(200).json([]);
    }
    const logs = await redis.lrange('logs', 0, -1);
    res.status(200).json(logs || []);
  } catch (error) {
    console.error('로그 조회 실패:', error);
    res.status(200).json([]); // 에러 시 빈 배열 반환
  }
}
