import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  { ignores: ['dist/', 'src/contract-artifacts/'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser }
    },
    rules: {
      // Single-word component names (Hud, Grid, Planet…) are this project's convention.
      'vue/multi-word-component-names': 'off',
      // Layout is Prettier's job (npm run format); these rules would fight it.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off'
    }
  },
  {
    files: ['dev/**', 'vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } }
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } }
  }
]
