export function sanitizeInput(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Executes function with a maximum rate of delay. */
export function debounceInIntervals(callback, delay) {
  let timeout;
  return function (args = null) {
    if (timeout) {
      return;
    }
    callback(args);
    const callbackInIntervals = () => {
      timeout = null;
    };
    timeout = setTimeout(callbackInIntervals, delay);
  };
}

/** Executes a function once at the end of an update cycle lasting delay. */
export function debounce(callback, delay) {
  let timeout;
  return function (args = null) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => callback(args), delay);
  };
}
