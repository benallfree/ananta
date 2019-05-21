module.exports = {
  env: {
    es6: true,
    node: true,
    'jest/globals': true
  },
  plugins: ['jest'],
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    'no-console': 0,
    'react/react-in-jsx-scope': 0
  }
}
