const storage = {

  get(key) {
    const value = window.localStorage.getItem(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  },
  set(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    window.localStorage.removeItem(key);
  },
  clear() {
    window.localStorage.clear();
  }
};

export default storage;