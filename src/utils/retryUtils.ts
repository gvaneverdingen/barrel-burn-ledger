/**
 * Utility functions for handling retries with exponential backoff
 */

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBase?: number;
}

export class RetryError extends Error {
  constructor(message: string, public attempts: number, public lastError: Error) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * Retry a function with exponential backoff
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    exponentialBase = 2
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(exponentialBase, attempt - 1),
        maxDelay
      );
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      await sleep(delay);
    }
  }
  
  throw new RetryError(
    `Failed after ${maxAttempts} attempts`,
    maxAttempts,
    lastError!
  );
};

/**
 * Sleep utility
 */
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry with specific conditions
 */
export const retryWithCondition = async <T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error, attempt: number) => boolean,
  options: RetryOptions = {}
): Promise<T> => {
  const { maxAttempts = 3, baseDelay = 1000 } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
        break;
      }
      
      const delay = baseDelay * attempt;
      await sleep(delay);
    }
  }
  
  throw lastError!;
};