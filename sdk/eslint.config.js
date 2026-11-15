// The SDK uses orbiter-client's lint rules (and its installed plugins), for code that runs in the
// browser and in Node scripts alike. Run from orbiter-client: npm run lint (it lints ../sdk too).
import globals from '../orbiter-client/node_modules/globals/index.js'
import client from '../orbiter-client/eslint.config.js'

export default [...client, { languageOptions: { globals: { ...globals.browser, ...globals.node } } }]
