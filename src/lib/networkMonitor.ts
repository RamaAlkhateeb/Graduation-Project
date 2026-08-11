import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
}

// Tells the custom cursor to show the loading state while any request is in flight.
export const useLoadingStore = create<LoadingState>(() => ({ isLoading: false }));

let installed = false;
let activeRequests = 0;
let showTimer: number | undefined;

// Show the loading cursor only after a request has been active this long,
// so quick background requests don't make the cursor flicker.
const SHOW_DELAY = 200;

const refresh = () => {
  if (activeRequests > 0) {
    if (showTimer === undefined) {
      showTimer = window.setTimeout(() => {
        showTimer = undefined;
        useLoadingStore.setState({ isLoading: true });
      }, SHOW_DELAY);
    }
  } else {
    if (showTimer !== undefined) {
      window.clearTimeout(showTimer);
      showTimer = undefined;
    }
    useLoadingStore.setState({ isLoading: false });
  }
};

// The app mixes raw fetch, axios (which uses XMLHttpRequest in the browser) and
// ad-hoc axios instances, so we track both transports globally.
const trackFetch = () => {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (...args: Parameters<typeof fetch>) => {
    activeRequests += 1;
    refresh();
    return originalFetch(...args).finally(() => {
      activeRequests -= 1;
      refresh();
    });
  };
};

const trackXhr = () => {
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    activeRequests += 1;
    refresh();
    const onLoadEnd = () => {
      activeRequests -= 1;
      refresh();
      this.removeEventListener('loadend', onLoadEnd);
    };
    this.addEventListener('loadend', onLoadEnd);
    return originalSend.call(this, body);
  };
};

export const installNetworkMonitor = () => {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  trackFetch();
  trackXhr();
};
