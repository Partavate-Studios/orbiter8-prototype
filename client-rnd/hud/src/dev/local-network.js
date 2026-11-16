// Dev builds (and `npm run build:local`) only: registers the chain started by `npm run local` with
// the SDK, from dev/local-deployment.json (or -<port>.json for a second copy, dev/local.js CHAIN_PORT).
// Lazy (not eager) so production builds drop the file along with this branch. boot.js loads this
// before the app, so the network list is complete before anything reads it.
import { addLocalNetwork } from '@orbiter8/sdk/chain/networks'

const includeLocal = import.meta.env.DEV || import.meta.env.VITE_LOCAL_NETWORK === '1'
const loaders = includeLocal ? import.meta.glob('/dev/local-deployment*.json', { import: 'default' }) : {}
const load = loaders[`/dev/local-deployment${import.meta.env.VITE_LOCAL_FILE ?? ''}.json`]
addLocalNetwork(await load?.())
