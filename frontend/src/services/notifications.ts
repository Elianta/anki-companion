import { toast } from 'sonner';
import { formatRateLimitMessage, isRateLimitError } from './api';

export function showRequestError(error: unknown, fallback: string): string {
  if (isRateLimitError(error)) {
    const message = formatRateLimitMessage(error.retryAfterSeconds);
    toast.warning(message);
    return message;
  }

  toast.error(fallback);
  return fallback;
}
