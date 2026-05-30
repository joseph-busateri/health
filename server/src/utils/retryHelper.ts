export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDurationMs: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH'],
  onRetry: () => {},
};

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const calculateDelay = (attempt: number, options: Required<RetryOptions>): number => {
  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelayMs);
};

const isRetryableError = (error: Error, retryableErrors: string[]): boolean => {
  const errorCode = (error as any).code;
  const errorMessage = error.message.toLowerCase();
  
  if (errorCode && retryableErrors.includes(errorCode)) {
    return true;
  }
  
  const retryablePatterns = [
    'timeout',
    'connection',
    'network',
    'unavailable',
    'temporary',
    'econnrefused',
    'etimedout',
  ];
  
  return retryablePatterns.some(pattern => errorMessage.includes(pattern));
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      return {
        success: true,
        result,
        attempts: attempt,
        totalDurationMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error as Error;
      
      const isLastAttempt = attempt === opts.maxAttempts;
      const shouldRetry = isRetryableError(lastError, opts.retryableErrors);
      
      if (isLastAttempt || !shouldRetry) {
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalDurationMs: Date.now() - startTime,
        };
      }
      
      const delay = calculateDelay(attempt, opts);
      opts.onRetry(attempt, lastError);
      
      console.warn(
        `Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms delay. Error: ${lastError.message}`
      );
      
      await sleep(delay);
    }
  }
  
  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    attempts: opts.maxAttempts,
    totalDurationMs: Date.now() - startTime,
  };
}

export async function retryBatch<T>(
  operations: Array<{ name: string; operation: () => Promise<T> }>,
  options: RetryOptions = {}
): Promise<Array<{ name: string; result: RetryResult<T> }>> {
  const results = await Promise.all(
    operations.map(async ({ name, operation }) => {
      const result = await withRetry(operation, options);
      return { name, result };
    })
  );
  
  return results;
}

export class RetryableError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableError';
  }
}
