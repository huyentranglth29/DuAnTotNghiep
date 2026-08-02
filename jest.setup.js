const mockAsyncStorage = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(key => Promise.resolve(mockAsyncStorage.get(key) ?? null)),
  setItem: jest.fn((key, value) => {
    mockAsyncStorage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn(key => {
    mockAsyncStorage.delete(key);
    return Promise.resolve();
  }),
  removeMany: jest.fn(keys => {
    keys.forEach(key => mockAsyncStorage.delete(key));
    return Promise.resolve();
  }),
  multiRemove: jest.fn(keys => {
    keys.forEach(key => mockAsyncStorage.delete(key));
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    mockAsyncStorage.clear();
    return Promise.resolve();
  }),
}));
