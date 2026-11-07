# Orbiter 8: Demo 4 contracts

The rewrite described in [`docs/demo4-plan.md`](../docs/demo4-plan.md): Solidity 0.8.38, Foundry,
OpenZeppelin's upgradeable contracts (UUPS proxies, ERC-7201 namespaced storage).

- **Setup:** `./setup.sh` fetches the libraries into `lib/` at pinned tags. Foundry v1.9.0 (`forge`, `anvil`, `cast`).
- **Test:** `forge test`.
- **EVM target:** Prague, so the contracts run on L2s that haven't adopted Osaka yet as well as on Polkadot Hub's REVM.
