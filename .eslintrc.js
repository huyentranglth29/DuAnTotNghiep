module.exports = {
  root: true,
  ignorePatterns: ['backend/**', 'featuresAdmin/**'],
  env: {
    browser: true,
    es2022: true,
    jest: true,
    node: true,
  },
  extends: '@react-native',
};
