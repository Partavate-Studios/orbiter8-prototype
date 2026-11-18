// Where a bot plays, and as whom. By default the local chain (`npm run local`), with its unlocked
// accounts; with TESTNET=1, Polkadot Hub TestNet: the deployment in contracts/deployments/420420417.json,
// and a throwaway key per bot derived from the spike key (~/.config/orbiter8/paseo-spike.json, or
// ORBITER_TESTNET_KEY), topped up from it to a few PAS. No key is printed or written anywhere.
import { JsonRpcProvider, Wallet, keccak256, toUtf8Bytes, parseEther, formatEther } from 'ethers'
import { readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
export const TESTNET = process.env.TESTNET === '1'
const TESTNET_RPC = 'https://eth-rpc-testnet.polkadot.io/'
/** A bot's PAS before it starts: plenty for a few hundred moves (about 0.01-0.04 PAS each). */
const TOP_UP = parseEther('5')

export const deployment = TESTNET
  ? { rpc: TESTNET_RPC, contracts: read('../../../contracts/deployments/420420417.json') }
  : read(`../local-deployment${process.env.LOCAL_FILE ?? ''}.json`)

export const provider = new JsonRpcProvider(deployment.rpc, undefined, { pollingInterval: TESTNET ? 2000 : 250 })

function spikeKey() {
  const file = process.env.ORBITER_TESTNET_KEY || path.join(os.homedir(), '.config/orbiter8/paseo-spike.json')
  const json = JSON.parse(readFileSync(file, 'utf8'))
  return (Array.isArray(json.data) ? json.data[0] : json).private_key
}

/** The deployment's admin (the deployer): local account 0, or on the testnet the spike key. */
export async function adminSigner() {
  return TESTNET ? new Wallet(spikeKey(), provider) : provider.getSigner(0)
}

/** The bot's signer: a local unlocked account, or on the testnet its own funded throwaway key. */
export async function signerFor(account) {
  if (!TESTNET) return provider.getSigner(Number(account))
  const spike = new Wallet(spikeKey(), provider)
  const bot = new Wallet(keccak256(toUtf8Bytes(`${spike.privateKey}:orbiter8-bot:${account}`)), provider)
  const balance = await provider.getBalance(bot.address)
  if (balance < TOP_UP / 2n) {
    await (await spike.sendTransaction({ to: bot.address, value: TOP_UP - balance })).wait()
    console.log(JSON.stringify({ action: 'funded', bot: bot.address, pas: formatEther(TOP_UP) }))
  }
  return bot
}

/**
 * Sends a move and measures it: its gas, and what it cost its payer in the chain's coin (PAS on the
 * testnet), read as the payer's balance before and after, less any value sent along. On Polkadot Hub
 * that includes storage deposits, which the gas figure alone doesn't show.
 */
export async function measured(payer, send, value = 0n) {
  const address = await payer.getAddress()
  const before = await provider.getBalance(address)
  const receipt = await (await send()).wait()
  const after = await provider.getBalance(address, receipt.blockNumber)
  const spent = before - after - value
  return { receipt, gas: Number(receipt.gasUsed), pas: Number(formatEther(spent)), fee: Number(formatEther(receipt.fee)) }
}
