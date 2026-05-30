export const localStorageAdapter = {
  get: (key: string) => (typeof window === "undefined" ? null : window.localStorage.getItem(key)),
  set: (key: string, value: string) => {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
  remove: (key: string) => {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  },
};
