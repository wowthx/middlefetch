import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'

export default tseslint.config(
  [
    eslint.configs.recommended,
    stylistic.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          project: './tsconfig.eslint.json',
          tsconfigRootDir: import.meta.dirname,
        },
      },
    },
    {
      ignores: ['lib/**/*'],
    },
    {
      files: ['tests/**/*.{js,ts,jsx,tsx}'],
      rules: {
        '@typescript-eslint/await-thenable': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-magic-numbers': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
      },
    },
  ],
)
