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

const OPERATORS = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
  div: (a, b) => a / b,
};

const OP_SYMBOLS = { add: '+', sub: '-', mul: '×', div: '÷' };

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const a = url.searchParams.get('a');
    const b = url.searchParams.get('b');
    const op = url.searchParams.get('op') || 'add';

    if (!OPERATORS[op]) {
      return res.status(400).json({ error: '잘못된 연산자입니다.' });
    }

    // searchParams.get()은 값이 없으면 null을 반환합니다.
    // Number(null)은 0이 되므로, 명시적인 isNaN 체크를 위해 undefined처럼 처리하거나 별도 체크합니다.
    const numA = (a === null || a === '') ? NaN : Number(a);
    const numB = (b === null || b === '') ? NaN : Number(b);

    if (isNaN(numA) || isNaN(numB)) {
      return res.status(400).json({ error: '유효한 숫자를 입력해 주세요.' });
    }

    if (op === 'div' && numB === 0) {
      return res.status(400).json({ error: '0으로 나눌 수 없습니다.' });
    }

    const result = OPERATORS[op](numA, numB);

    // Redis 로그 저장은 실패해도 계산 결과는 반환해야 함
    const redis = getRedis();
    if (redis) {
      try {
        await redis.lpush('logs', JSON.stringify({
          a: numA,
          b: numB,
          op: OP_SYMBOLS[op],
          result,
          time: new Date().toISOString(),
        }));
        console.log('Redis 로그 저장 성공');
      } catch (err) {
        console.error('Redis 로그 저장 실패:', err.message);
      }
    } else {
      console.warn('Redis 클라이언트가 초기화되지 않아 로그를 저장할 수 없습니다. Vercel 환경 변수 설정을 확인하고 재배포해 주세요.');
    }

    res.status(200).json({ result });
  } catch (error) {
    console.error('서버 오류:', error);
    res.status(500).json({ error: '서버에서 오류가 발생했습니다.' });
  }
}
