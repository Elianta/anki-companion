import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';

import { ApiError } from './api';
import { showRequestError } from './notifications';

vi.mock('sonner');

describe('showRequestError', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows request limits as warnings with the server wait time', () => {
    const message = showRequestError(new ApiError('Rate limit', 429, 120), 'Search failed');
    expect(toast.warning).toHaveBeenCalledWith(message);
    expect(message).toContain('2 minutes');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows a warning when no wait time is available', () => {
    const message = showRequestError(new ApiError('Rate limit', 429), 'Search failed');
    expect(toast.warning).toHaveBeenCalledWith(message);
    expect(message).toContain('slow down');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows ordinary failures as errors using the operation message', () => {
    expect(showRequestError(new Error('Connection lost'), 'Search failed')).toBe('Search failed');
    expect(toast.error).toHaveBeenCalledWith('Search failed');
    expect(toast.warning).not.toHaveBeenCalled();
  });
});
