// Gas limits with a margin over the node's estimate (no imports: Node tools use it too).

/** Gas limits are the node's estimate plus this share: a move pays for the gas it uses, not its limit. */
export const GAS_MARGIN_PERCENT = 30n

/**
 * Makes a signer ask for more gas than the node estimates. Polkadot Hub TestNet's estimates can come out
 * short: on 2026-11-18 a Citadel's build was sent with the estimate's 5,466 and ran out of gas, where
 * it needed 6,452 (the estimate taken just after the previous move into the same contract). Providers,
 * which only read, are left alone; a signer is patched once.
 */
export function withGasMargin(runner) {
  if (!runner?.sendTransaction || typeof runner.estimateGas !== 'function' || runner.__o8GasMargin) return runner
  const estimate = runner.estimateGas.bind(runner)
  runner.estimateGas = async (tx) => ((await estimate(tx)) * (100n + GAS_MARGIN_PERCENT)) / 100n
  runner.__o8GasMargin = true
  return runner
}
