import astro from 'eslint-plugin-astro'
import a11y from 'eslint-plugin-jsx-a11y-x'
import ts from 'typescript-eslint'

export default [
  { ignores: ['dist/**', '.astro/**', 'artifacts/**', 'node_modules/**'] },
  ...astro.configs['jsx-a11y-recommended'],
  {
    files: ['src/**/*.astro'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
  {
    ...a11y.configs.recommended,
    files: ['src/**/*.{jsx,tsx}'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...a11y.configs.recommended.rules,
      'jsx-a11y-x/label-has-associated-control': [
        'error',
        { controlComponents: ['Radio'], depth: 3 },
      ],
    },
  },
]
