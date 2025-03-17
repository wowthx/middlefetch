import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import love from 'eslint-config-love'
import stylistic from '@stylistic/eslint-plugin'

export default [
  { ignores: ['lib/**/*'] },
  { ...love, files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  stylistic.configs.recommended,
  {
    rules: {
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['tests/**/*.{js,ts,jsx,tsx}'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
]
