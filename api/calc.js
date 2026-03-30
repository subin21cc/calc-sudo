import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const OPERATORS = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
  div: (a, b) => a / b,
};

const OP_SYMBOLS = { add: '+', sub: '-', mul: '×', div: '÷' };

export default async function handler(req, res) {
  const { a, b, op = 'add' } = req.query;

  if (!OPERATORS[op]) {
    return res.status(400).json({ error: '잘못된 연산자입니다.' });
  }

  const numA = Number(a || 0);
  const numB = Number(b || 0);

  if (op === 'div' && numB === 0) {
    return res.status(400).json({ error: '0으로 나눌 수 없습니다.' });
  }

  const result = OPERATORS[op](numA, numB);

  await redis.lpush('logs', JSON.stringify({
    a: numA,
    b: numB,
    op: OP_SYMBOLS[op],
    result,
    time: new Date().toISOString(),
  }));

  res.status(200).json({ result });
}
