const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const apiPath = (path: string) => `${API_BASE_URL}${path}`;

export class ApiError extends Error {
  status: number;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const parseRetryAfterSeconds = (response: Response): number | undefined => {
  const retryAfter = response.headers?.get?.('retry-after');
  const parsed = retryAfter ? Number(retryAfter) : undefined;
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const formatRateLimitMessage = (retryAfterSeconds?: number) => {
  if (typeof retryAfterSeconds === 'number' && Number.isFinite(retryAfterSeconds)) {
    const seconds = Math.max(1, Math.round(retryAfterSeconds));
    if (seconds >= 60) {
      const minutes = Math.ceil(seconds / 60);
      return `Too many requests. Please wait about ${minutes} minute${minutes > 1 ? 's' : ''} and try again.`;
    }
    return `Too many requests. Please wait ${seconds} seconds and try again.`;
  }

  return 'Too many requests. Please slow down and try again.';
};

export const isRateLimitError = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.status === 429;

export const extractErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();
    if (payload?.error) {
      return String(payload.error);
    }
    if (Object.keys(payload ?? {}).length > 0) {
      return JSON.stringify(payload);
    }
  } catch {
    // ignore JSON parsing errors and fall back to text
  }

  try {
    const text = await response.text();
    if (text.trim()) {
      return text;
    }
  } catch {
    // ignore text parsing errors
  }

  return response.statusText || 'Unknown error';
};

export const buildApiError = async (response: Response, context: string) => {
  const message = await extractErrorMessage(response);
  const retryAfterSeconds = parseRetryAfterSeconds(response);

  if (response.status === 429) {
    throw new ApiError(message || 'Too many requests. Please wait before trying again.', 429, retryAfterSeconds);
  }

  throw new ApiError(`${context}: ${response.status} ${message}`, response.status, retryAfterSeconds);
};

export const parseJsonOrThrow = async <T>(response: Response, errorMessage: string) => {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(errorMessage);
  }
};
