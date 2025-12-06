import globals from 'globals'
import eslint from '@eslint/js'
import tsEslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import pluginAstro from 'eslint-plugin-astro'
import pluginReact from 'eslint-plugin-react'

const stylisticConfig = [
  stylistic.configs.customize({
    semi: false,
  }),
  {
    rules: {
      '@stylistic/function-call-spacing': 'error',
      '@stylistic/brace-style': [
        'error',
        '1tbs',
        { allowSingleLine: true },
      ],
      '@stylistic/jsx-one-expression-per-line': 'off',
      '@stylistic/object-curly-newline': [
        'error',
        {
          multiline: true,
          consistent: true,
          minProperties: 5,
        },
      ],
      '@stylistic/array-element-newline': [
        'error',
        {
          ArrayExpression: 'consistent',
          ArrayPattern: { minItems: 3 },
        },
      ],
      '@stylistic/jsx-quotes': ['error', 'prefer-single'],
      '@stylistic/space-before-function-paren': ['error', 'always'],
    },
  },
]

const tsConfig = [
  ...tsEslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  ...stylisticConfig,
]

const reactConfig = [{
  files: ['src/**/*.{js,jsx,tsx}'],
  plugins: { react: pluginReact },
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...globals.browser,
    },
  },
}]

const astroConfig = [
  ...pluginAstro.configs.recommended,
  {
    files: [
      'astro.config.mjs',
      'src/**/*.astro',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  ...stylisticConfig,
]

export default [
  eslint.configs.recommended,
  ...tsConfig,
  ...reactConfig,
  ...astroConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    ignores: ['dist/**'],
  },
]
