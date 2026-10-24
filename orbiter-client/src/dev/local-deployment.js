// Dev builds only: point chain 1337 at the contracts deployed by `npm run local`.
// Production builds drop this branch entirely, so the file never ships.
const loaders = import.meta.env.DEV
  ? import.meta.glob('/dev/local-deployment.json', { import: 'default' })
  : {}

/** Returns a copy of a Truffle artifact whose chain-1337 entry points at the local deployment, if there is one. */
export async function withLocalDeployment (artifact) {
  const load = Object.values(loaders)[0]
  if (!load) return artifact
  const local = await load()
  const address = local.contracts[artifact.contractName]
  if (!address) return artifact
  return {
    ...artifact,
    networks: { ...artifact.networks, [local.chainId]: { address, events: {}, links: {} } }
  }
}
