import Replicate, { type Prediction } from 'replicate';

const MIN_CREATE_INTERVAL_MS = 11_000;
const MAX_CREATE_ATTEMPTS = 5;
const MAX_RETRY_DELAY_MS = 12_000;

type PredictionCreateOptions = {
  input: object;
} & (
  | { version: string }
  | { model: string }
);

type ReplicateQueue = {
  nextAvailableAt: number;
  tail: Promise<void>;
};

const globalForReplicate = globalThis as typeof globalThis & {
  __profileAiReplicateQueue?: ReplicateQueue;
};

function getQueue(): ReplicateQueue {
  if (!globalForReplicate.__profileAiReplicateQueue) {
    globalForReplicate.__profileAiReplicateQueue = {
      nextAvailableAt: 0,
      tail: Promise.resolve(),
    };
  }

  return globalForReplicate.__profileAiReplicateQueue;
}

export function safeMsg(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try { return JSON.stringify(error); } catch { return '알 수 없는 오류'; }
}

export function isRateLimitError(error: unknown, message = safeMsg(error)): boolean {
  if (message.includes('429') || /rate limit|throttled/i.test(message)) return true;
  if (!error || typeof error !== 'object') return false;

  const record = error as Record<string, unknown>;
  const response = record.response as { status?: number } | undefined;
  return record.status === 429 || record.statusCode === 429 || response?.status === 429;
}

function getRetryDelayMs(error: unknown, message: string): number {
  const retryAfter = error && typeof error === 'object'
    ? Number((error as Record<string, unknown>).retry_after)
    : NaN;
  const parsedSeconds = Number.isFinite(retryAfter)
    ? retryAfter
    : Number(
        message.match(/retry[_-]?after["':\s]+(\d+)/i)?.[1]
        ?? message.match(/resets in ~?(\d+)s/i)?.[1]
        ?? message.match(/~?(\d+)s/i)?.[1]
      );

  const delaySeconds = Number.isFinite(parsedSeconds) ? parsedSeconds + 2 : 8;
  return Math.min(delaySeconds * 1000, MAX_RETRY_DELAY_MS);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCreateSlot() {
  const queue = getQueue();
  const waitMs = queue.nextAvailableAt - Date.now();

  if (waitMs > 0) {
    await sleep(waitMs);
  }
}

async function enqueuePredictionCreate<T>(task: () => Promise<T>): Promise<T> {
  const queue = getQueue();
  const previous = queue.tail.catch(() => undefined);

  let release!: () => void;
  queue.tail = previous.then(() => new Promise<void>((resolve) => {
    release = resolve;
  }));

  await previous;
  try {
    await waitForCreateSlot();
    return await task();
  } finally {
    queue.nextAvailableAt = Date.now() + MIN_CREATE_INTERVAL_MS;
    release();
  }
}

export async function createPredictionWithRateLimit(
  replicate: Replicate,
  options: PredictionCreateOptions
): Promise<Prediction> {
  return enqueuePredictionCreate(async () => {
    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
      try {
        return await replicate.predictions.create(options);
      } catch (error: unknown) {
        const message = safeMsg(error);
        if (isRateLimitError(error, message) && attempt < MAX_CREATE_ATTEMPTS - 1) {
          await sleep(getRetryDelayMs(error, message));
          continue;
        }

        throw error;
      }
    }

    throw new Error('예측 생성 실패');
  });
}
