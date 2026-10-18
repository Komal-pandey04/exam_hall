import { useCallback, useRef, useState } from 'react';
import { api } from '../services/api.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retries only network failures (the server is idempotent, so retrying is safe). */
async function submitWithRetry(payload, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await api.submitResult(payload);
    } catch (error) {
      lastError = error;
      if (!error.isNetwork) throw error;
      await wait(800 * (i + 1));
    }
  }
  throw lastError;
}

/**
 * Guarded submission: a ref blocks double-clicks and the timer racing a manual submit,
 * so the request is only ever in flight once.
 */
export function useSubmit(onSuccess) {
  const inFlight = useRef(false);
  const [state, setState] = useState({ status: 'idle', message: '' });

  const submit = useCallback(
    async (payload) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setState({ status: 'submitting', message: '' });
      try {
        const { result } = await submitWithRetry(payload);
        onSuccess(result);
      } catch (error) {
        inFlight.current = false;
        setState({
          status: 'error',
          message: error.isNetwork
            ? 'Unable to submit your test. Please check your internet connection and try again.'
            : error.message || 'Unable to submit your test. Please try again.',
        });
      }
    },
    [onSuccess]
  );

  const reset = useCallback(() => {
    inFlight.current = false;
    setState({ status: 'idle', message: '' });
  }, []);

  return { submit, reset, ...state };
}
