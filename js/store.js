// Keeps answers in this browser between visits. Storage can be missing or
// blocked, so every call is guarded and the test works without it.

export function createStore(key, enabled = true) {
  return {
    read() {
      if (!enabled) return null;
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch (error) {
        return null;
      }
    },
    write(value) {
      if (!enabled) return;
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        /* private mode or a full quota: carry on without saving */
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        /* nothing to clear */
      }
    },
  };
}
