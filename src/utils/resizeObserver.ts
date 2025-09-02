/**
 * Utility to handle ResizeObserver errors gracefully
 * Prevents "ResizeObserver loop completed with undelivered notifications" errors
 */

let resizeObserverErrorLogged = false;

export const handleResizeObserverError = (error: Error) => {
  // Only log the first occurrence to avoid spam
  if (!resizeObserverErrorLogged && error.message.includes('ResizeObserver')) {
    console.warn('ResizeObserver error handled:', error.message);
    resizeObserverErrorLogged = true;
  }
};

/**
 * Creates a debounced ResizeObserver to prevent loop errors
 */
export const createDebouncedResizeObserver = (
  callback: ResizeObserverCallback,
  delay: number = 16 // ~60fps
): ResizeObserver => {
  let timeoutId: NodeJS.Timeout;
  
  return new ResizeObserver((entries, observer) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        callback(entries, observer);
      } catch (error) {
        handleResizeObserverError(error as Error);
      }
    }, delay);
  });
};

/**
 * Global error handler for ResizeObserver errors
 * Add this to your main App component
 */
export const setupResizeObserverErrorHandler = () => {
  const originalHandler = window.onerror;
  
  window.onerror = (message, source, lineno, colno, error) => {
    if (error && error.message.includes('ResizeObserver')) {
      handleResizeObserverError(error);
      return true; // Prevent default error handling
    }
    
    // Call original handler for other errors
    if (originalHandler) {
      return originalHandler(message, source, lineno, colno, error);
    }
    
    return false;
  };
};