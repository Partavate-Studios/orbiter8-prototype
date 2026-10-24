import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  { ignores: ['dist/', 'src/contract-artifacts/'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/vue2-essential'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser }
    },
    rules: {
      // Single-word component names (Hud, Grid, Planet…) are this project's convention.
      'vue/multi-word-component-names': 'off'
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
