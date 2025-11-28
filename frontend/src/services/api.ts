const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const apiPath = (path: string) => `${API_BASE_URL}${path}`;

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

export const parseJsonOrThrow = async <T>(response: Response, errorMessage: string) => {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(errorMessage);
  }
};
