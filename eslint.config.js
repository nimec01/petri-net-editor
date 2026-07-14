import antfu from '@antfu/eslint-config';

export default antfu({
  vue: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: true,
  },
  ignores: ['.nuxt', '.turbo', '.output', 'node_modules'],

  rules: {
    'style/brace-style': ['error', '1tbs'],
    'node/prefer-global/process': 'off',
  },
});
