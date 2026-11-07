# Orbiter 8: Demo 4 contracts

The rewrite described in [`docs/demo4-plan.md`](../docs/demo4-plan.md): Solidity 0.8.38, Foundry,
OpenZeppelin's upgradeable contracts (UUPS proxies, ERC-7201 namespaced storage).

- **Setup:** `./setup.sh` fetches the libraries into `lib/` at pinned tags. Foundry v1.9.0 (`forge`, `anvil`, `cast`).
- **Test:** `forge test`.
- **Size check:** `forge build --sizes` fails if any contract is over the 24,576-byte limit. Galaxy stays
  under it by calling the heavy libraries (Drand, Spiral, ScanRules) as separately deployed, linked
  libraries; the deploy script deploys them first.
- **Lint:** `forge lint` (off during builds).
- **Local game:** `npm run local4` in `orbiter-client/` starts anvil, deploys, and serves the client at `/#/galaxy`.
- **EVM target:** Prague, so the contracts run on L2s that haven't adopted Osaka yet as well as on Polkadot Hub's REVM.
