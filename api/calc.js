import { Redis } from '@upstash/redis';

// 환경 변수 오류 방지를 위해 에러 처리
let redis;
try {
  redis = Redis.fromEnv();
} catch (e) {
  console.error('Redis 초기화 실패:', e);
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
    const { a, b, op = 'add' } = req.query;

    if (!OPERATORS[op]) {
      return res.status(400).json({ error: '잘못된 연산자입니다.' });
    }

    const numA = Number(a);
    const numB = Number(b);

    if (isNaN(numA) || isNaN(numB)) {
      return res.status(400).json({ error: '유효한 숫자를 입력해 주세요.' });
    }

    if (op === 'div' && numB === 0) {
      return res.status(400).json({ error: '0으로 나눌 수 없습니다.' });
    }

    const result = OPERATORS[op](numA, numB);

    // Redis 로그 저장은 실패해도 계산 결과는 반환해야 함
    if (redis) {
      try {
        await redis.lpush('logs', JSON.stringify({
          a: numA,
          b: numB,
          op: OP_SYMBOLS[op],
          result,
          time: new Date().toISOString(),
        }));
      } catch (err) {
        console.error('Redis 로그 저장 실패:', err);
      }
    }

    res.status(200).json({ result });
  } catch (error) {
    console.error('서버 오류:', error);
    res.status(500).json({ error: '서버에서 오류가 발생했습니다.' });
  }
}
