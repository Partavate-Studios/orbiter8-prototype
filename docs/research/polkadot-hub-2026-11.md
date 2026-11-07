# Polkadot Hub for Orbiter 8: where things stand (researched 2026-11-06)

This page is for the Demo 4 network decision: an Ethereum L2 (Base, Arbitrum) or Polkadot Hub. It is written for a Solidity developer who doesn't know Polkadot internals.

## Summary (as of 2026-11-06)

- **Smart contracts have been live on Polkadot Hub mainnet since 2026-01-27.** Polkadot Hub is the chain that used to be called Asset Hub. Contracts run in `pallet-revive`, which has two engines: **REVM**, which runs normal EVM bytecode, and **PVM**, a RISC-V engine. Parity tells most developers to use REVM. The docs call PVM's Ethereum-compatible mode "early-stage". ([launch post](https://forum.polkadot.network/t/release-of-smart-contracts-on-polkadot/16848), [Dual VM docs](https://docs.polkadot.com/smart-contracts/for-eth-devs/dual-vm-stack/))
- **The mainnet runtime is 2.5.2 (spec 2005002), running `pallet-revive` 0.19.1.** I queried the live node to confirm this. Runtime 2.5.3 was released today but is not enacted yet. ([fellowship changelog](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md), [v2.5.2 Cargo.toml](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/Cargo.toml))
- **UUPS proxies work under REVM, and there is concrete evidence of it.** OpenZeppelin v5 `UUPSUpgradeable` implementations sit behind `ERC1967Proxy` contracts on mainnet and are in use. A mainnet ERC-1967 proxy (Hyperbridge's `IntentGatewayV2`) has been upgraded 5 times through `upgradeToAndCall` executed by delegatecall. I did **not** find a plain OpenZeppelin `UUPSUpgradeable.upgradeToAndCall` upgrade on mainnet, so the team should run one on testnet. There is no evidence either way for PVM. See [section 3](#3-upgradeable-contracts-priority-question).
- **Randomness is the biggest problem.** `BLOCKHASH` works for the last 256 blocks, about 8.5 minutes. But the hash it returns is a hash of a *synthetic* Ethereum header: the "state root" is just the transaction root, and only Ethereum-style transactions go into it. `PREVRANDAO` is the constant 2500000000000000. On a quiet chain (I measured about 84 EVM transactions a day), **a player can compute the hash of the block their jump lands in, and of the empty blocks after it, before sending.** They can then grind for a good result. The "later block hash" plan is not safe on Polkadot Hub as it stands. A verified **drand** beacon (BN254, checkable with the pairing precompile that works on mainnet) is a better option for either network. See [section 4](#4-randomness-and-block-hashes).
- **`block.timestamp` only changes every 24 seconds.** Blocks come about every 2 s, but up to 12 blocks in a row share one timestamp. I measured this on mainnet. It follows from the 24 s Aura slots enacted in runtime 2.3.0 (June 2026).
- **`tx.origin == msg.sender` doesn't mean "an ordinary wallet" here.** Polkadot-native multisigs, proxy accounts and `utility.batch_all` can all pass that check. `batch_all` can also revert several contract calls together. EIP-7702 is in `polkadot-sdk` master but rejected by the live runtime.
- **Fees are cheap in absolute terms. Storage deposits are the cost to watch.** Recent mainnet contract calls cost 0.0046–0.032 DOT, about $0.004–$0.03 at DOT ≈ $0.93 (measured on Blockscout). Each *new* storage slot also locks about 0.0026 DOT (computed from runtime constants), roughly $0.0025. That is refundable only if the slot is cleared later.
- **Reading the chain without a provider works but is immature.** Smoldot and PAPI are solid. The Ethereum-RPC layer on top (Pine-RPC) is one person's project (1 star, 6 commits) and only queries the latest finalized state. The official public eth-rpc endpoint returns 429 errors under modest load, and no commercial provider offers `eth_*` on Polkadot Hub. ([forum thread, Sep 2026](https://forum.polkadot.network/t/production-evm-rpc-infrastructure-on-asset-hub-pallet-revive-reliability-bottlenecks-alternative-endpoints-and-best-practices/18575))
- **The ecosystem is thin.** The Blockscout explorer shows about 2,600 EVM transactions in the last 31 days and 2,236 addresses ever. DefiLlama doesn't track Polkadot Hub TVL. DOT is about $0.93, down from a 2026 high of about $2.33. Moonbeam, Polkadot's main EVM parachain, shut down on 2026-08-01, and its token moved to Base.
- **Bottom line:** Polkadot Hub can run Orbiter 8's Solidity contracts, including UUPS proxies, at low per-move cost. Moving there means owning several risks yourself: weak native randomness, a thin RPC and tooling layer, tiny user activity, and a runtime that changes contract-visible behavior every few weeks. Keep Demo 4 network-neutral and test the items in [the final section](#what-to-test-on-testnet-before-deciding) before choosing.

## How this was researched

- **Primary sources:** docs.polkadot.com, the Polkadot forum, the `polkadot-sdk` and `polkadot-fellows/runtimes` repos, and the exact `pallet-revive` crate versions running on mainnet (0.19.1) and coming next (0.21.1), read on [docs.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/).
- **Measured:** I read public mainnet endpoints directly on 2026-11-06 (around 03:00–04:00 UTC on 11-07):
  - the Substrate RPC `wss://polkadot-asset-hub-rpc.polkadot.io` (runtime version, finality lag);
  - the Ethereum RPC `https://eth-rpc.polkadot.io` (1,500 recent blocks, `eth_call` probes of `BLOCKHASH`, `PREVRANDAO` and `TIMESTAMP`, `eth_getCode`);
  - the [Blockscout API](https://blockscout.polkadot.io/) (verified proxies, fees, activity).
- **Labels:** "Measured" means I observed it on the live chain. "Computed" means I worked it out from runtime constants. "Not confirmed" means I couldn't find a primary source.

---

## 1. Status and maturity

### Timeline

| Date | Event | Source |
|---|---|---|
| 2025-12-18 | Kusama Hub runtime with REVM backend released; Kusama goes first | [changelog 2.0.4](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md), [status update](https://forum.polkadot.network/t/revive-smart-contracts-status-update/16366) |
| 2026-01-27 | `pallet-revive` and elastic scaling enacted on Polkadot Hub (ref. 1828); slipped from Jan 20 | [launch post](https://forum.polkadot.network/t/release-of-smart-contracts-on-polkadot/16848), [status thread](https://forum.polkadot.network/t/revive-smart-contracts-status-update/16366) |
| 2026-04-10 | ERC-20 precompiles for foreign (bridged) assets | [changelog 2.2.0](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md) |
| 2026-04-16 | Storage-slot deposit (`DepositPerChildTrieItem`) cut 10× | [changelog 2.2.1](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md) |
| 2026-06-04 | Auto account mapping on; asset-conversion and vesting precompiles; real benchmarked weights; ERC-20 precompile `permit()` renamed `use_permit()`; 24 s Aura slots | [changelog 2.3.0](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md) |
| 2026-09-01 | `pallet-revive` 0.19.1 (`originIsRoot` precompile method); Individuality (proof-of-personhood) pallets and PGAS added to Polkadot Hub | [changelog 2.5.0](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md) |
| 2026-10-27 | Runtime 2.5.2, the version **live now** (spec 2005002, measured) | [changelog 2.5.2](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md) |
| 2026-11-06 | Runtime 2.5.3 released: `polkadot-sdk` stable2606-5, `pallet-revive` 0.21.1. Not enacted yet | [changelog 2.5.3](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md), [v2.5.3 Cargo.toml](https://github.com/polkadot-fellows/runtimes/blob/v2.5.3/Cargo.toml) |

A fellowship release is not live until an OpenGov referendum enacts it. To see what's actually running, check the live `specVersion`.

### Networks

| Network | Chain ID | Eth RPC | Explorer |
|---|---|---|---|
| Polkadot Hub (mainnet) | 420420419 | `https://eth-rpc.polkadot.io/` | blockscout.polkadot.io |
| Kusama Hub | 420420418 | `https://eth-rpc-kusama.polkadot.io/` | blockscout-kusama.polkadot.io |
| Polkadot Hub TestNet (Paseo) | 420420417 | `https://eth-rpc-testnet.polkadot.io/` | blockscout-testnet.polkadot.io, polkadot.testnet.routescan.io |

Source: [Connect to Polkadot](https://docs.polkadot.com/smart-contracts/connect/) (updated 2026-11-02). Paseo Asset Hub was on spec 2005006 when I checked (measured). The docs no longer list Westend for contracts. I didn't check whether Westend still runs them (not confirmed).

### Known limitations and recent breaking changes

- **Launch-day DX problems, raised by Polytope Labs:**
  - legacy transactions with hard-coded gas price and limit fail, because the gas model is different;
  - eth-rpc is a separate sidecar binary;
  - receipts disappear on misconfigured RPCs;
  - Foundry verification on Routescan fails.

  Parity answered each point. ([thread](https://forum.polkadot.network/t/release-of-smart-contracts-on-polkadot/16848))
- **Gas estimates can be off.** The docs say estimates "may show significant differences" from actual use, and recommend a 10–20% buffer on both gas limit and gas price. ([gas model](https://docs.polkadot.com/smart-contracts/for-eth-devs/gas-model/), [deployment](https://docs.polkadot.com/smart-contracts/for-eth-devs/contract-deployment/))
- **Breaking changes in the next release** (`polkadot-stable2606-4/5`, in runtime 2.5.3):
  - a cap on receipt size (`ReceiptTooLarge`);
  - `terminate` semantics changed, and its deposit is no longer refunded;
  - a fix for storage deposits being double-counted on reentrancy.

  ([polkadot-sdk releases](https://github.com/paritytech/polkadot-sdk/releases))
- **The runtime changes often.** Over 2026, the parts contracts can see changed every few weeks: deposits, account mapping, a precompile function name, timestamp granularity, and terminate semantics. On an L2, EVM semantics rarely change under you.

### Roadmap (what Parity has said)

- **2026 plans** ([What is Polkadot Hub?](https://www.parity.io/blog/what-is-polkadot-hub), 2026-02-17):
  - a JIT compiler for PolkaVM;
  - gas payments in any asset;
  - synchronous staking and governance precompiles;
  - proof-of-personhood integration ("free transactions for proven persons");
  - published reliability metrics.
- **500 ms blocks:** Parity said these would reach the Hub in 2026 ([Polkadot Roundup 2025](https://www.parity.io/blog/polkadot-roundup-2025)). As of today, mainnet blocks are about 2 s (measured), and I found no 2026 announcement that 500 ms blocks are live (not confirmed).
- **EIP-7702** is merged in `polkadot-sdk` master ([PR #12229](https://github.com/paritytech/polkadot-sdk/pull/12229)). It is not in stable2606 or stable2609 ([#13615](https://github.com/paritytech/polkadot-sdk/pull/13615), [#13616](https://github.com/paritytech/polkadot-sdk/pull/13616)), so expect it in a later release.
- I found no dated Q4 2026 roadmap for `pallet-revive` (not confirmed).

---

## 2. Solidity compatibility (REVM)

REVM runs standard EVM bytecode, so standard solc output deploys unchanged ([EVM vs PVM](https://docs.polkadot.com/smart-contracts/for-eth-devs/evm-vs-pvm/)). The opcode table in `pallet-revive` 0.19.1 includes `PUSH0`, `MCOPY`, `TLOAD`/`TSTORE` and `CLZ`, the Osaka opcode ([source](https://docs.rs/crate/pallet-revive/0.19.1/source/src/vm/evm/instructions/mod.rs)). So current 0.8.x Solidity should work. Mainnet contracts verified with 0.8.29 and 0.8.30 exist (measured on Blockscout). I didn't test the very latest solc release (not confirmed).

| Item | Behavior on Polkadot Hub (REVM, live 0.19.1) | Source |
|---|---|---|
| Contract size | 24 KiB runtime / 48 KiB initcode, same as Ethereum. PVM allows 1 MiB | [vm/evm.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/vm/evm.rs), [limits.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/limits.rs) |
| Gas | Gas is a projection of three resources: `ref_time`, `proof_size` and storage deposit. "Gas" numbers are scaled (`GasScale = 80_000`) and not comparable to Ethereum gas | [gas model](https://docs.polkadot.com/smart-contracts/for-eth-devs/gas-model/), [runtime config](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs) |
| Storage deposits | New storage locks DOT from the signer; refunded when freed (see [section 6](#6-fees-and-costs)) | [gas model](https://docs.polkadot.com/smart-contracts/for-eth-devs/gas-model/) |
| `BLOCKHASH` | Last 256 blocks, else 0. Returns the synthetic Ethereum header hash (see [section 4](#4-randomness-and-block-hashes)) | [exec.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/exec.rs), measured |
| `PREVRANDAO` / `DIFFICULTY` | Constant `2500000000000000` | [vm/evm.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/vm/evm.rs), measured (`mixHash` 0x8e1bc9bf04000) |
| `block.timestamp` | Seconds; changes every 24 s, so about 12 blocks share a value | measured; [24 s slots PR](https://github.com/polkadot-fellows/runtimes/pull/1174) |
| `block.number` | Same as the Substrate block number (~22.8 M) | measured |
| `block.gaslimit` | Reports `u64::MAX` | measured (`gasLimit 0xffff…`) |
| `tx.origin` | The signer's mapped H160; traps for Root (governance) origin | [tx_info.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/vm/evm/instructions/tx_info.rs) |
| `SELFDESTRUCT` | EIP-6780 style: deletes only if created in the same transaction | [host.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/vm/evm/instructions/host.rs) |
| `CALLCODE` | Rejected (`InvalidInstruction`) | [contract.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/vm/evm/instructions/contract.rs) |
| `CREATE` / `CREATE2` / `DELEGATECALL` | Supported. Call gas limits are honored, with a 2300-stipend heuristic | [contract.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/vm/evm/instructions/contract.rs) |
| Call depth | 25 (docs say 5 for PVM; the code says 25) | [limits.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/limits.rs) |
| Precompiles | Ethereum set (ecrecover, sha256, ripemd, identity, modexp, bn128 add/mul/pairing, blake2f, point-eval, P-256), plus System (0x900), Storage, ERC-20 for assets, XCM (0xa0000), asset conversion, vesting, personhood. **No EIP-2537 BLS12-381** | [builtin precompiles](https://github.com/paritytech/polkadot-sdk/tree/master/substrate/frame/revive/src/precompiles/builtin), [runtime config](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs) |
| Existential deposit | Accounts below 0.01 DOT are deleted (computed: `SYSTEM_PARA_EXISTENTIAL_DEPOSIT / 10`) | [runtime config](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs), [EVM vs PVM](https://docs.polkadot.com/smart-contracts/for-eth-devs/evm-vs-pvm/) |
| Missing infra | **Multicall3 is not at its canonical address** on mainnet or testnet. ERC-4337 EntryPoint v0.7 is on testnet only. The Arachnid CREATE2 deployer exists | measured (`eth_getCode`) |

PVM has more differences: no `EXTCODECOPY` or `SELFDESTRUCT`, code must be uploaded before it can be instantiated, factories need adjusting, and contracts are compiled via-IR only. The PVM limits table in the docs (event data 416 bytes, code about 100 KB, call depth 5) is older than the code, which says 64 KiB events, 1 MiB code and depth 25. ([EVM vs PVM](https://docs.polkadot.com/smart-contracts/for-eth-devs/evm-vs-pvm/), [limits.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/limits.rs))

---

## 3. Upgradeable contracts (priority question)

### Answer

| Pattern | REVM | PVM |
|---|---|---|
| OZ UUPS (`ERC1967Proxy` + `UUPSUpgradeable`, `proxiableUUID`, `upgradeToAndCall`) | **Works: deployed and used on mainnet.** I found no plain OZ UUPS *upgrade* yet; test one | Not confirmed |
| ERC-1967 upgrade via `upgradeToAndCall` under delegatecall | **Confirmed on mainnet (5 upgrades)** | Not confirmed |
| ERC-7201 namespaced storage | **Works.** OZ v5 upgradeable contracts use it internally, and those are live (above) | Not confirmed |
| Transparent proxy | Expected to work (same delegatecall and `CREATE` mechanics); no verified example found | Not confirmed (ProxyAdmin is created with `new`, which needs pre-uploaded code on PVM) |
| Diamond (EIP-2535) | Expected to work; only testnet experiments found | Not confirmed |

### Evidence

1. **OpenZeppelin v5 UUPS implementations are live behind `ERC1967Proxy` on mainnet.** Several proxies verified on 2026-05-11 point to implementations whose ABI has `upgradeToAndCall`, `proxiableUUID` and `UPGRADE_INTERFACE_VERSION`, which marks OZ v5 `UUPSUpgradeable`. Examples: `MetadataRegistry` behind [0xd967…21E5](https://blockscout.polkadot.io/address/0xd967872F1EE5E233cfE1a2dED4Ec4a3c922B21E5) (26 transactions through the proxy), `CreatorFeeVault` behind [0xEf75…A251](https://blockscout.polkadot.io/address/0xEf75274C4fE529b5a9EdB73e471AAC148E89A251), and `GraduationManager` behind [0xAb14…dCce](https://blockscout.polkadot.io/address/0xAb14f149EF37911d6ff6ab82bE9d973Bf444dCce). Calls through them succeed, so delegatecall forwarding, the `initialize` flow and ERC-7201 storage all work. (Measured via the Blockscout API.)
2. **A mainnet ERC-1967 proxy has been upgraded five times.** Hyperbridge's `IntentGatewayV2` proxy [0xAe04…9716](https://blockscout.polkadot.io/address/0xAe041F7B0CB581876832830baeB6a2Aa2a3C9716) emitted `Upgraded` five times between blocks 17,451,844 and 21,656,375. In the latest upgrade ([tx 0x0f34…ab67](https://blockscout.polkadot.io/tx/0x0f34e9113c8ed0bcecc704bbe1309faed6fb3306fb1dc864453e158a6572ab67), 2026-10-10):
   - the proxy delegatecalls the old implementation;
   - that delegatecalls an `ExtrinsicModule` contract whose ABI has `upgradeToAndCall`;
   - then the new implementation is delegatecalled to initialize.

   That is the UUPS flow, run in-place through delegatecall. It isn't the stock OZ contract, so it proves the mechanism, not OZ's exact code. (Measured.)
3. **The code agrees.** REVM's `DELEGATECALL` is the standard instruction ([contract.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/vm/evm/instructions/contract.rs)). Storage keys are arbitrary 32-byte words, so ERC-1967 and ERC-7201 slots behave normally. Code-size limits match Ethereum.
4. **Parity's compiler test suite includes a delegatecall proxy.** `resolc-compiler-tests` has a USDC-style proxy workload ([repo](https://github.com/paritytech/resolc-compiler-tests), `fixtures/solidity/workloads/ethereum/usdc/usdc_proxy.sol`).
5. **The PVM evidence is thin and conflicting.** In 2025, a Parity engineer said the compiler (`resolc`) "compiles all contracts featured in the wizard with all features enabled (including upgradable contracts)" against OZ v5.0.0 ([forum, 2025-02-24](https://forum.polkadot.network/t/openzeppelin-support-for-polkadot-hub-and-polkadot-cloud-in-2025/11854)). A hackathon project reports `resolc` failing on OZ v5 imports ([orthonode/dotlend](https://github.com/orthonode/dotlend)). OpenZeppelin later refocused its Polkadot work on "EVM-first deliverables" (forum topic dated 2025-11-04; content not read, not confirmed).

### Upgrade-specific notes

- **Deploying a new implementation locks a code deposit** (computed): `DepositPerByte × (code length + ~100) + 2 × DepositPerItem`. For a full 24 KiB contract, that is about 0.25 + 0.4 = **~0.65 DOT** (about $0.60). There is also a 30% code-hash lockup when a contract instance references the code ([calculate_code_deposit](https://docs.rs/crate/pallet-revive/0.19.1/source/src/vm/mod.rs), [runtime config](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs)).
- **Repointing the proxy is cheap.** It rewrites an existing slot, so there is no new item deposit. Old implementations keep their deposit locked: `SELFDESTRUCT` only works in the creating transaction, and from runtime 2.5.3 `terminate` no longer refunds deposits ([stable2606-5 notes](https://github.com/paritytech/polkadot-sdk/releases)).
- **Tooling caveat.** The OpenZeppelin Upgrades plugins aren't mentioned in the Polkadot Hardhat or Foundry docs. Their storage-layout checks run locally, so they should work against any RPC, but I didn't confirm this. The Hardhat docs pin Hardhat 2.x for the EVM path ([Hardhat docs](https://docs.polkadot.com/smart-contracts/dev-environments/hardhat/)).
- **Polkadot-specific mechanism.** None for contracts. Runtime upgrades through governance change the chain itself, not your contracts. Governance can call contracts with Root origin, and a contract can detect that with `originIsRoot()` on the System precompile ([ISystem.sol](https://github.com/paritytech/polkadot-sdk/blob/master/substrate/frame/revive/uapi/sol/ISystem.sol)).

---

## 4. Randomness and block hashes

### What contracts can read

| Source | Available? | Notes |
|---|---|---|
| `BLOCKHASH(n)` | Yes, last **256 blocks** (~8.5 min at 2 s) | Measured: `BLOCKHASH(N-256)` non-zero, `BLOCKHASH(N-257)` = 0. It matched `eth_getBlockByNumber` hashes ([exec.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/exec.rs), [block_storage.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/evm/block_storage.rs)) |
| EIP-2935 history contract | No | Not in `pallet-revive` source, master searched 2026-11-06 |
| `PREVRANDAO` | Constant | `2500000000000000` ([vm/evm.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/vm/evm.rs); [PR #10186](https://newreleases.io/project/github/paritytech/polkadot-sdk/release/polkadot-stable2512)) |
| Randomness precompile / BABE VRF | No | No randomness precompile in the System interface or the runtime precompile list ([ISystem.sol](https://github.com/paritytech/polkadot-sdk/blob/master/substrate/frame/revive/uapi/sol/ISystem.sol), [runtime](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs)). BABE VRF randomness lives on the relay chain ([docs](https://docs.polkadot.com/reference/parachains/randomness/)) |
| Oracle VRF (Chainlink, Pyth Entropy and others) | Not found | No source confirms one on Polkadot Hub (not confirmed) |

A third-party blog says `PREVRANDAO` maps to "Polkadot VRF" ([OpenGuild](https://openguild.wtf/blog/polkadot/polkavm-missing-opcodes-and-workarounds)). The code and the [official docs](https://docs.polkadot.com/smart-contracts/for-eth-devs/evm-vs-pvm/) say it's a constant, and I measured the constant on mainnet.

### Why the block hash is weak on Polkadot Hub

`BLOCKHASH` returns the hash of a header that `pallet-revive` builds at the end of each block ([block_builder.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/evm/block_hash/block_builder.rs)). That header contains:

- the parent hash, number and timestamp;
- the author (`miner`);
- the base fee and gas limit/used;
- the logs bloom, the transaction and receipt roots of **Ethereum transactions only**;
- `stateRoot = transactionsRoot`. This is visible in live blocks, where all three roots are equal.

There is no real state root and no VRF output. So:

- **An empty block's hash is a pure function of public, predictable values.** Those are the previous hash, the slot timestamp (24 s steps), the Aura author (deterministic rotation; 9 authors seen in 1,500 blocks) and a flat base fee. In 1,500 consecutive mainnet blocks (50.8 minutes), **only 9 contained any EVM transaction** (measured).
- **A player can predict the hash of the block their jump lands in, before sending.** If the jump is the only Ethereum transaction in block N, the player knows every input: the parent hash, the slot, the author, their own signed transaction, and its receipt from simulation. They also know the hashes of the empty blocks after it. Changing any transaction field (gas price, gas limit) changes `hash(N)`. So **they can grind offline for a good outcome, and then send** — or simply wait a block for a fresh roll. Reverting isn't needed.
- **Collators can also bias results.** They choose which transactions go in, and can skip slots.

**So the "outcome from a later block's hash" plan works mechanically, but it is not unpredictable on Polkadot Hub today.** The jump records N, a view call reads `BLOCKHASH(N+k)`, and a later transaction stores the result. That only becomes unpredictable when other users' Ethereum transactions are mixed in. The same reasoning applies to any quiet chain, so check the L2 candidate's block-hash inputs too (not researched here). If you use block hashes anyway, keep the 256-block window in mind: unresolved jumps need a fallback after about 8.5 minutes, or about 2 minutes once 500 ms blocks arrive.

### Better option: a verified public beacon (works on either network)

- **drand `evmnet`** publishes a threshold BLS signature every 3 s on the BN254 curve, designed to be verified with the EVM's BN254 pairing precompile. It has about 100-bit security, versus 128 for drand's main networks. ([drand](https://drand.love/about/), [randa-mu/bls-solidity](https://github.com/randa-mu/bls-solidity), [Robinhood-OSS/OpenVRF](https://github.com/Robinhood-OSS/OpenVRF), which binds a request to a future round)
- **The pairing precompile works on Polkadot Hub mainnet.** The Hyperbridge upgrade transaction above makes successful static calls to precompiles 0x06, 0x07 and 0x08 (measured). Its weight cost there is unknown; measure it.
- **How it would work for Orbiter 8:**
  1. The jump stores a target round `R`, the first round after the jump time plus a safety margin. On Polkadot Hub, the margin must exceed 24 s because `block.timestamp` lags real time.
  2. The client fetches round R's signature from drand's public HTTP relays.
  3. A view function verifies it and returns the outcome.
  4. Any later transaction writes it.

  No one can predict R, and reverting doesn't change it. Note that hash-to-curve for BN254 has no audited Solidity implementation ([note in rsk-vrf](https://github.com/mangekyou-labs/rsk-vrf/issues/12)).
- **Cost:** you depend on drand's network and relays, similar to depending on an RPC.

---

## 5. Restricting callers to ordinary wallets

- **`tx.origin` is the signer's mapped H160**, as on Ethereum for Ethereum-signed transactions ([tx_info.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/vm/evm/instructions/tx_info.rs)). The System precompile also offers `callerIsOrigin()` ([ISystem.sol](https://github.com/paritytech/polkadot-sdk/blob/master/substrate/frame/revive/uapi/sol/ISystem.sol)).
- **The check doesn't prove a single-key wallet.** Polkadot-native accounts can call contracts through Substrate extrinsics, wrapped in:
  - `pallet_multisig` (a multisig account),
  - `pallet_proxy` (a proxy acting for a pure-proxy or other account), or
  - `pallet_utility` (`batch_all`).

  In every case the dispatch origin is a signed account, so `tx.origin == msg.sender` holds. All three pallets are in the runtime ([runtime config](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs)). **`batch_all` lets a user make a move and then call a checker that reverts the whole batch on a bad result.** Any same-transaction randomness can be re-rolled this way, even with the `tx.origin` check. (Inferred from the runtime config; not tested.)
- **EIP-7702:** the live 0.19.1 and the next 0.21.1 both reject type-4 transactions ("EIP-7702 transactions are not supported", [runtime.rs](https://docs.rs/crate/pallet-revive/0.21.1/source/src/evm/runtime.rs)). Support is merged in master ([PR #12229](https://github.com/paritytech/polkadot-sdk/pull/12229)), so expect `tx.origin` checks to weaken here the same way they did on Ethereum.
- **Personhood check:** a personhood precompile is in the live runtime. It lets a contract ask whether an account belongs to a verified unique human, without learning who it is ([runtime config](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs), [interface](https://docs.polkadotcommunity.foundation/architecture/identity/)). It could be a strong anti-bot tool. But the user-facing personhood apps are testnet-only so far ("`polkadot` and `kusama` presets are not live yet", [networks](https://docs.polkadot.com/apps/concepts/networks/)).

---

## 6. Fees and costs

### How a contract call is priced

- **Fee = weight fee (the larger of `ref_time` and `proof_size` after coefficients) + length fee, times a fee multiplier** that rises when blocks are full. The wallet sees a single gas number and price ([gas model](https://docs.polkadot.com/smart-contracts/for-eth-devs/gas-model/)).
- **Storage deposits are separate.** They are locked balance, refunded when storage is freed. `eth_estimateGas` includes them, so to MetaMask they look like part of the gas ([gas model](https://docs.polkadot.com/smart-contracts/for-eth-devs/gas-model/)).
- **Block limit for one call:** a single Ethereum transaction can use at most 50% of block weight (`MaxEthExtrinsicWeight`, [changelog 2.1.0](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md)).

### Measured fees (Blockscout, 2026-11-06)

| Call | Fee | ≈ USD at $0.93/DOT |
|---|---|---|
| Small contract call (6,232 "gas") | 0.0050 DOT | $0.0046 |
| Medium call (25–29 k "gas") | 0.021–0.023 DOT | $0.02 |
| Heavier call (40 k "gas") | 0.032 DOT | $0.03 |
| Proxy upgrade (`batchCall`, 48,721 "gas") | 0.039 DOT | $0.036 |

Gas price sat at the 800 Gwei-equivalent floor, with blocks nearly empty. ([Blockscout API](https://blockscout.polkadot.io/api/v2/transactions), [DOT price](https://www.coindesk.com/price/polkadot)) These calls weren't Orbiter's, so treat them as a rough range. `docs/cost-estimates.md` estimated $0.008 for a trade, which is in the same ballpark.

### Storage deposits (computed from the live runtime)

| Item | Deposit | ≈ USD |
|---|---|---|
| New 32-byte storage slot (0.002 DOT per item + 0.00001 DOT/byte × 64 bytes of key and value) | ~0.0026 DOT | ~$0.0025 |
| Full-size (24 KiB) contract code | ~0.65 DOT | ~$0.60 |
| Account existential deposit | 0.01 DOT | ~$0.01 |

Sources: [runtime constants](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs), [deposit formula](https://github.com/polkadot-fellows/runtimes/blob/main/relay/polkadot/constants/src/lib.rs), [storage.rs](https://docs.rs/crate/pallet-revive/0.19.1/source/src/storage.rs).

The signer pays storage deposits. A move that writes many new slots, such as a jump into an unexplored star, pays roughly 0.0026 DOT per slot on top of the fee. For a sense of scale, a new slot on Base costs about $0.0003 in gas at 0.005 gwei and $2,300 ETH, so Polkadot Hub's deposit is several times higher per slot (computed). These numbers are worth measuring with the real contracts.

### Paying in other assets, sponsored transactions, session keys

- **Other assets:**
  - Substrate-format transactions can pay fees in USDT and other assets via an automatic swap ([docs](https://docs.polkadot.com/chain-interactions/send-transactions/pay-fees-with-different-tokens/)).
  - **Ethereum-format transactions (MetaMask) pay in DOT only.** The runtime builds them with `ChargeAssetTxPayment::from(tip, None)` ([runtime config](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs)).
  - "Gas in any asset" is a 2026 roadmap item ([Parity](https://www.parity.io/blog/what-is-polkadot-hub)).
- **Feeless for verified humans (PGAS):** live in the runtime since 2.5.0. Verified persons can claim PGAS and pay fees with it, and contract storage deposits can be paid in PGAS with a native fallback (only 10% refunded) ([PR #1233](https://github.com/polkadot-fellows/runtimes/pull/1233), [runtime config](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs)). It needs Substrate-style signing (the `AsPgas` extension), not MetaMask, and the personhood apps aren't on mainnet yet ([networks](https://docs.polkadot.com/apps/concepts/networks/)). Not usable for a MetaMask game today.
- **Sponsorship for ordinary users:** I found no native sponsorship for Ethereum transactions. ERC-4337 EntryPoint v0.7 exists on testnet but not on mainnet (measured). Meta-transactions (ERC-2771 relayer) work as on any EVM chain, but need a relayer.
- **Session keys:** none built in for contracts. Polkadot proxies can't be scoped to contract calls: the `NonTransfer` type doesn't include `Revive`, and `Any` can drain the account ([runtime config](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs)). So build session keys into the game contract, the same as on an L2. The new Polkadot App "product accounts" ask for phone approval on each write ([product SDK contracts](https://docs.polkadot.com/apps/product-sdk/contracts/), [accounts](https://docs.polkadot.com/apps/concepts/accounts/)).

---

## 7. Accounts and wallets

- **Ethereum keys work as-is.** A MetaMask (secp256k1) address is Ethereum-compatible from the start. Its 32-byte Polkadot account is the H160 followed by twelve `0xEE` bytes ([accounts](https://docs.polkadot.com/smart-contracts/for-eth-devs/accounts/)).
- **Polkadot-native accounts (sr25519/ed25519)** get a hashed H160. The docs say they must call `map_account` first. **The docs and runtime disagree:** auto-mapping has been on since runtime 2.3.0 (2026-06-04), which disables `map_account` and maps accounts when they're created ([changelog](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md), [AutoMap docs in code](https://docs.rs/crate/pallet-revive/0.19.1/source/src/lib.rs)).
- **DOT shows 18 decimals in Ethereum tooling** (native is 10 decimals, ratio 10^8) ([runtime config](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs)).
- **Wallets:** MetaMask works by adding a custom network, and Talisman supports it natively ([wallets](https://docs.polkadot.com/smart-contracts/integrations/wallets/)). SubWallet advertises Hub support ([SubWallet on X](https://x.com/i/status/2019436231868993811)).
- **Funding new players:** players need DOT on Polkadot Hub specifically. I didn't research on-ramps and bridges into Hub.

---

## 8. Reading the chain without RPC providers

| Option | State | Source |
|---|---|---|
| smoldot (light client in a Web Worker) + PAPI | Mature, the official path. Talks to the network's nodes over P2P and checks proofs. Uses Substrate JSON-RPC (`chainHead_v1_*`), not `eth_*` | [smoldot](https://github.com/paritytech/smoldot), [PAPI providers](https://papi.how/providers/sm/), [light clients](https://docs.polkadot.com/reference/tools/light-clients/) |
| Contract reads via smoldot | Possible through the `ReviveApi` runtime API (a dry-run call), each needing proofs from a peer | [Pine-RPC README](https://github.com/baronvonbonbon/pine-rpc), [product SDK `query`](https://docs.polkadot.com/apps/product-sdk/contracts/) |
| Pine-RPC (eth-RPC on smoldot) | Community project, July 2026; 1 star, 6 commits | [forum](https://forum.polkadot.network/t/pine-rpc-eth-rpc-compatability-layer-on-smoldot/18113), [repo](https://github.com/baronvonbonbon/pine-rpc) |

**Pine-RPC limits** (from its README):

- it only queries the latest finalized state, about 30 s behind the tip (measured lag: 15–17 blocks);
- logs only cover a rolling window from when it connected;
- receipts only cover transactions sent through that instance;
- `eth_getCode` usually fails;
- startup takes 10–60 s;
- it is documented for Node.js, not the browser.

**How practical is this for a map that loads many regions?**

- **Each contract read is a network round trip to a peer plus local Wasm execution.** No throughput benchmarks exist (not confirmed). The game already makes about 125–140 reads per reload (`docs/cost-estimates.md`), so batching becomes essential. Multicall3 isn't deployed on Polkadot Hub, so deploy your own aggregator or add batch view functions to the contracts.
- **Light-client connections to Asset Hub have been flaky in the past.** A metadata-fetch timeout was reported with smoldot 2.0.40 ([polkadot-cli #98](https://github.com/paritytech/polkadot-cli/issues/98)).
- **The official eth-rpc is weak.** One test got 115 of 180 OK, with 40 HTTP 429s and 25 404s. No commercial provider serves `eth_*` for Polkadot Hub. Community endpoints such as `services.polkadothub-rpc.com` did better. Self-hosting an archive node plus eth-rpc was estimated at more than $600 a month. ([forum, Sep 2026](https://forum.polkadot.network/t/production-evm-rpc-infrastructure-on-asset-hub-pallet-revive-reliability-bottlenecks-alternative-endpoints-and-best-practices/18575))

Verdict: provider-free reads are a real Polkadot advantage in principle, but for a read-heavy browser game it is a prototype, not a solution yet. Test it with Orbiter's real read pattern.

---

## 9. Tooling

| Tool | State | Source |
|---|---|---|
| Foundry | Use the **nightly** build (built-in `--chain polkadot`). `forge test` runs on plain Anvil semantics: no existential deposit, different gas, precompiles and block data | [Foundry docs](https://docs.polkadot.com/smart-contracts/dev-environments/foundry/) (2026-11-02) |
| Hardhat | Stock Hardhat 2.x for EVM; `@parity/hardhat-polkadot` only for PVM. `time.increase()` and `loadFixture` may not work | [Hardhat docs](https://docs.polkadot.com/smart-contracts/dev-environments/hardhat/) (2026-11-02) |
| Local node | `revive-dev-node` + `eth-rpc` built from `polkadot-sdk` (~30 min build); exposes a subset of the JSON-RPC API | [local dev node](https://docs.polkadot.com/smart-contracts/dev-environments/local-dev-node/) |
| Remix | Supported | [Remix docs](https://docs.polkadot.com/smart-contracts/dev-environments/remix/) |
| Explorers | Blockscout (Parity-hosted, verification without an API key), Subscan; Routescan on testnet | [explorers](https://docs.polkadot.com/smart-contracts/explorers/) |
| Faucet | faucet.polkadot.io, PAS on Polkadot Hub TestNet; amounts not published | [faucet](https://docs.polkadot.com/smart-contracts/faucet/) |
| Indexing | No confirmed Polkadot Hub support from The Graph, Envio or Ponder. SubQuery and Subsquid cover Polkadot generally. RPC-based indexers should work in principle | [Envio comparison](https://docs.envio.dev/blog/best-blockchain-indexers-2026) (not confirmed) |
| OpenZeppelin | Contracts Wizard has a Polkadot mode | [OpenZeppelin on X](https://x.com/OpenZeppelin/status/2023813045190086704), [overview](https://docs.polkadot.com/smart-contracts/overview/) |

---

## 10. Block time and finality

- **Block time is about 2.03 s on mainnet** (measured over 1,500 blocks; Paseo testnet about 2.06 s). Elastic scaling arrived with the January runtime ([changelog 2.0.5](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md)).
- **Aura slots are 24 s**, so one collator writes about 12 blocks in a row and **the timestamp only moves every 24 s** (measured: 1,372 zero gaps and 127 gaps of 24 s) ([PR #1174](https://github.com/polkadot-fellows/runtimes/pull/1174)). Measure cooldowns in timestamps, as `design-ideas.md` already suggests, but expect 24 s granularity.
- **Finality: the finalized head trails the best block by 15–17 blocks, about 30–34 s** (measured via `chain_getFinalizedHead`).
- **500 ms blocks are planned for 2026, not shipped** ([Parity roundup](https://www.parity.io/blog/polkadot-roundup-2025), [elastic scaling docs](https://docs.polkadot.com/reference/parachains/consensus/elastic-scaling/)). When they ship, the 256-block `BLOCKHASH` window shrinks to about 2 minutes.

---

## 11. Game-relevant things L2s don't offer

- **XCM from contracts.** A precompile at `0x…0a0000` offers `execute`, `send` and `weighMessage`. It is "barebones" and needs SCALE-encoded messages ([XCM precompile](https://docs.polkadot.com/smart-contracts/precompiles/xcm/)). It could matter for portals or cross-chain universes. It is also extra complexity.
- **Native assets as ERC-20s.** USDT, USDC and other Asset Hub assets appear at precompile addresses with the `0x120` prefix; foreign assets use `0x220` ([status thread](https://forum.polkadot.network/t/revive-smart-contracts-status-update/16366), [runtime](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs)). The game could issue an in-game token as a native asset with its own ERC-20 address.
- **Native NFTs (`pallet-nfts`) exist on Asset Hub, but there is no NFT precompile** in the runtime's list, so contracts can't touch them ([runtime](https://github.com/polkadot-fellows/runtimes/blob/v2.5.2/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs)). The marketplace scene is thin: KodaDot wound down in September 2025, and the successor "Chaotic" is reported only by a third-party guide ([KodaDot](https://kodadot.js.org/), [guide](https://polkadotecosystem.com/dapps/nft-marketplaces/)).
- **On-chain governance.** OpenGov runs on Asset Hub, which has its own tracks ([changelog 2.5.0](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md)). Governance can call contracts as Root (`originIsRoot()`). Staking and governance precompiles for contracts are roadmap items ([Parity](https://www.parity.io/blog/what-is-polkadot-hub)).
- **Proof of personhood and PGAS.** These are the most distinctive features for a game: one-human-one-account checks and free transactions for humans. They aren't usable for MetaMask users on mainnet yet ([section 5](#5-restricting-callers-to-ordinary-wallets), [section 6](#6-fees-and-costs)).
- **Grants.** The Web3 Foundation's general Grants Program is discontinued ([w3f/Grants-Program](https://github.com/w3f/Grants-Program)). The main source is now the OpenGov Treasury, through a public proposal and referendum ([Polkadot Handbook](https://polkadothandbook.com/funding)). There was a DotPlay gaming bounty, but its 2026 status is unconfirmed ([games.gg](https://games.gg/news/dot-play-grant-polkadot/)).

---

## 12. Ecosystem health

| Signal | Value | Source |
|---|---|---|
| EVM transactions on Polkadot Hub, last 31 days | 2,598 (avg 84/day, max 181) | measured, [Blockscout charts API](https://blockscout.polkadot.io/api/v2/stats/charts/transactions) |
| Addresses ever / EVM transactions total | 2,236 / 11,303 | measured, [Blockscout stats](https://blockscout.polkadot.io/api/v2/stats) |
| Blocks with any EVM transaction | 9 of 1,500 (50 min) | measured |
| First week after launch | 19 contracts deployed | [DL News](https://www.dlnews.com/articles/defi/polkadot-adds-smart-contracts-to-entice-ethereum-developers/) |
| Polkadot Hub TVL | Not tracked by DefiLlama (checked API) | [DefiLlama](https://defillama.com/chains) |
| For comparison | Base ~$5.8 B, Arbitrum ~$1.4 B, Hydration (largest Polkadot parachain) ~$47 M TVL | [DefiLlama API](https://api.llama.fi/v2/chains), measured |
| DOT price | ~$0.93 (2026-11-03); 2026 range $0.73–$2.33; ~$1.87 at contract launch | [CoinDesk](https://www.coindesk.com/price/polkadot), [CoinPaprika](https://coinpaprika.com/coin/dot-polkadot), [AMBCrypto](https://ambcrypto.com/polkadots-smart-contracts-hub-is-live-but-dot-remains-stuck-why/) |
| Notable apps on Hub | Hyperbridge (IntentGateway, live and upgraded on mainnet), a set of UUPS DeFi contracts (May 2026), dotUSD stablecoin migration (runtime 2.5.2) | measured; [Hyperbridge](https://blog.hyperbridge.network/hyperbridge-february-2026-roundup/); [changelog](https://github.com/polkadot-fellows/runtimes/blob/main/CHANGELOG.md) |
| Moonbeam | Parachain shut down: migration closed 2026-07-31; maintenance mode (no transactions) from 2026-08-01; GLMR moved to Base | [KuCoin](https://www.kucoin.com/news/flash/moonbeam-to-shut-down-on-july-31-2026-users-urged-to-withdraw-assets), [cryptonews](https://cryptonews.net/news/altcoins/33235260/) |
| RPC providers | Some are leaving; none offer `eth_*` for Hub | [Pine thread](https://forum.polkadot.network/t/pine-rpc-eth-rpc-compatability-layer-on-smoldot/18113), [RPC thread](https://forum.polkadot.network/t/production-evm-rpc-infrastructure-on-asset-hub-pallet-revive-reliability-bottlenecks-alternative-endpoints-and-best-practices/18575) |

Reading: the Hub is technically live and improving, but there are very few users and little liquidity. Moonbeam leaving for Base is a strong signal about where EVM projects in the Polkadot ecosystem see their users.

---

## Should Orbiter 8 consider Polkadot Hub?

### Strongest reasons for

1. **The contracts would port as they are.** REVM runs unmodified Solidity with Ethereum code-size limits, and UUPS/ERC-1967 proxies are live on mainnet. A network-neutral Demo 4 can target both.
2. **Cheap moves.** Typical calls cost under $0.01–$0.03 at today's DOT price, comparable to Arbitrum and a bit above Base.
3. **Provider-free reads in principle.** smoldot in the browser is a real light client with no RPC provider, which fits the no-servers principle better than Helios on Ethereum.
4. **Unique features with game potential.** Personhood checks (anti-bot, one human one account), PGAS free transactions for humans, native assets as ERC-20s, and XCM for portals to other chains.
5. **Being early.** A quiet chain makes it easier to stand out, and governance can fund projects through the treasury.

### Strongest reasons against

1. **Randomness.** Block hashes are predictable on a quiet chain, `PREVRANDAO` is constant, and contracts have no VRF. The planned exploration mechanic needs a different design (drand), which also helps on L2s.
2. **The read path is fragile.** The official eth-rpc throttles, no commercial `eth_*` providers exist, Pine-RPC is a one-person prototype limited to finalized state, Multicall3 is missing, and there are no light-client throughput numbers. Orbiter makes about 130 reads per reload.
3. **Very few users and little liquidity.** About 84 EVM transactions a day, DOT down about 60% from its 2026 high, and Moonbeam's exit to Base. Players would need DOT on the Hub specifically.
4. **The platform keeps moving.** Contract-visible behavior changes every few weeks through runtime upgrades (deposits, timestamps, account mapping, terminate, precompile names). The docs lag the code in several places (account mapping, PVM limits).
5. **Storage deposits.** A new slot costs several times more than on Base, which matters for a game that writes whole star systems on exploration.
6. **The headline features aren't ready for MetaMask users.** PGAS and personhood need Substrate-style signing and apps that are still testnet-only. "Gas in any asset" and 500 ms blocks are roadmap items.

### What to test on testnet before deciding

1. **UUPS end to end on Polkadot Hub TestNet (REVM).** Deploy `ERC1967Proxy` with an OZ v5 `UUPSUpgradeable` implementation that uses ERC-7201 storage, call `upgradeToAndCall` to a V2 that adds a namespaced field, and check that storage is preserved. Record the deposits and fees for deploy and upgrade.
2. **The play bot with real contracts.** As `cost-estimates.md` already proposes, measure fees and storage deposits per move, especially sign-up and the jump into an unexplored star.
3. **Randomness.**
   - (a) Confirm the block-hash prediction: from a script, predict `hash(N)` for a lone transaction and compare it with the result.
   - (b) Prototype drand `evmnet` verification and measure the BN254 pairing cost.
   - (c) Check that the 24 s timestamp steps don't break round selection or cooldowns.
4. **The read path.** Load a map region through
   - (a) the official eth-rpc and a community endpoint,
   - (b) PAPI + smoldot in a browser Web Worker calling `ReviveApi`, and
   - (c) Pine-RPC.

   Measure the startup time and latency for 130 batched reads. Deploy your own Multicall3 or batch view.
5. **The caller checks.** Confirm that `utility.batch_all` and a proxied Substrate account pass `tx.origin == msg.sender`, and decide whether that matters once randomness doesn't depend on the same transaction.
6. **Wallet onboarding.** Go from a fresh MetaMask to a first move with DOT on the Hub. Note the existential deposit and the gas-buffer advice.
7. **Re-check before committing.** Look at the live `specVersion` and changelog for EIP-7702, the 500 ms block status, and `pallet-revive` breaking changes since this note.

---

## Couldn't confirm / sources disagree

- **No plain OpenZeppelin `UUPSUpgradeable.upgradeToAndCall` upgrade found on mainnet.** UUPS proxies are deployed and used, and a custom ERC-1967 `upgradeToAndCall` upgrade happened five times. Test 1 above closes this gap.
- **No evidence either way for proxies on PVM.** Parity (2025) and a hackathon project disagree on whether OZ v5 compiles with `resolc`.
- **Transparent proxies and Diamonds:** no verified mainnet example. Diamond facets appear only on testnet.
- **The docs are older than the code** on account mapping (the docs say `map_account` is required; auto-mapping has been on since June 2026) and on PVM limits (call depth 5 vs 25, code ~100 KB vs 1 MiB, events 416 B vs 64 KiB). I trusted the code in both cases.
- **`PREVRANDAO`:** one blog says it maps to a VRF; the code, docs and mainnet show a constant.
- **No published docs on the 24 s timestamp granularity.** It is my measurement, consistent with the 24 s Aura slot change.
- **No light-client throughput benchmarks** for many contract reads.
- **No confirmed randomness oracle (Chainlink, Pyth and others) on Polkadot Hub.** No confirmed indexer support (The Graph, Envio, Ponder).
- **The 500 ms block timing, a Q4 2026 `pallet-revive` roadmap, and the status of Polkadot gaming grants** are unconfirmed.
- **Blockscout totals:** Blockscout's block count (11.4 M) is lower than the chain height (22.8 M), so its "total" figures may not cover the whole history. The 31-day daily chart is the more reliable activity measure.
