import { Redis } from '@upstash/redis';

// Redis 클라이언트 초기화 (지연 초기화 및 싱글톤 패턴)
let redisInstance = null;
function getRedis() {
  if (redisInstance) return redisInstance;
  try {
    redisInstance = Redis.fromEnv();
    return redisInstance;
  } catch (e) {
    console.error('Redis 초기화 실패: UPSTASH_REDIS_REST_URL 또는 UPSTASH_REDIS_REST_TOKEN 환경 변수가 설정되지 않았거나 잘못되었습니다.', e.message);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const redis = getRedis();
    if (!redis) {
      console.warn('Redis 클라이언트 초기화 실패 (환경 변수 확인 필요)');
      return res.status(200).json([]);
    }
    const logs = await redis.lrange('logs', 0, -1);
    console.log(`로그 조회 완료: ${logs ? logs.length : 0}개의 기록`);
    res.status(200).json(logs || []);
  } catch (error) {
    console.error('로그 조회 실패:', error.message);
    res.status(200).json([]); // 에러 시 빈 배열 반환
  }
}
