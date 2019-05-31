module.exports = {
  env: {
    es6: true,
    node: true,
    'jest/globals': true
  },
  parser: 'babel-eslint',
  plugins: ['jest', 'babel'],
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
    'react/react-in-jsx-scope': 0,
    'babel/semi': 1,
    'no-unused-vars': 1,
    'react/prop-types': 1
  }
}
