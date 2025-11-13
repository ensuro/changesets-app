// src/safe-api.js
import SafeApiKit from "@safe-global/api-kit";
import Safe from "@safe-global/protocol-kit";
import { ethers } from "ethers";

import { CHANGESET_URL_PREFIX, ADDRESSBOOK_URL, SAFE_API_KEY } from "./config";

export const KEY_TRANSACTIONS = "transactions";
export const KEY_DELEGATES = "delegates";
export const KEY_TRANSACTION_DETAILS = "transaction-details";
export const KEY_ADDRESS_BOOK = "address-book";

const RPC_BY_CHAIN = {
  137: import.meta.env.VITE_RPC_POLYGON || "https://polygon-rpc.com",
  1: import.meta.env.VITE_RPC_ETHEREUM || "https://ethereum-rpc.publicnode.com",
  42161: import.meta.env.VITE_RPC_ARBITRUM || "https://arbitrum-one-rpc.publicnode.com",
};

const apiByChain = new Map();
function getApi(chainId) {
  const key = String(chainId);
  if (apiByChain.has(key)) return apiByChain.get(key);

  const opts = { chainId: BigInt(chainId) };
  if (SAFE_API_KEY) opts.apiKey = SAFE_API_KEY;

  const api = new SafeApiKit(opts);
  apiByChain.set(key, api);
  return api;
}

export async function getTransactions(safe) {
  const apiKit = getApi(safe.chainId);
  const txs = await apiKit.getPendingTransactions(safe.safeAddress);
  return txs.results.sort((a, b) => a.nonce - b.nonce);
}

export async function getTransactionsHistoryPage(safe, { limit = 5, offset = 0 } = {}) {
  const apiKit = getApi(safe.chainId);
  const res = await apiKit.getAllTransactions(safe.safeAddress, { limit, offset, executed: true });
  const items = res.results.slice().sort((a, b) => a.nonce - b.nonce);
  const hasMore = items.length === limit;
  return { items, hasMore, nextOffset: offset + items.length };
}

export async function getDelegates(safe) {
  const apiKit = getApi(safe.chainId);
  const response = await apiKit.getSafeDelegates({ safeAddress: safe.safeAddress });
  return response.results;
}

export async function addDelegate(safe, delegate, signer) {
  const apiKit = getApi(safe.chainId);
  return apiKit.addSafeDelegate({
    safeAddress: safe.safeAddress,
    delegateAddress: delegate.address,
    delegatorAddress: signer.address,
    signer,
    label: delegate.name,
  });
}

export async function getTransactionDetails(safeTxHash) {
  const response = await fetch(`${CHANGESET_URL_PREFIX}/${safeTxHash}.json`);
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    error.url = response.url;
    throw error;
  }
  return response.json();
}

export async function getAddressBook() {
  const response = await fetch(ADDRESSBOOK_URL);
  return response.json();
}

export async function postConfirmation(safe, safeTxHash, signer) {
  const protocolKit = await Safe.init({
    provider: window.ethereum,
    safeAddress: safe.safeAddress,
    signer,
  });
  const signature = await protocolKit.signHash(safeTxHash);

  const apiKit = getApi(safe.chainId);
  return apiKit.confirmTransaction(safeTxHash, signature.data);
}

export async function resolveSafeTxHashFromTxHash(safe, txHash) {
  const chainId = Number(safe?.chainId);
  const rpc = RPC_BY_CHAIN[chainId];

  const provider = new ethers.JsonRpcProvider(rpc, chainId);
  const receipt = await provider.getTransactionReceipt(txHash);

  const expectedSafe = String(safe.safeAddress || "").toLowerCase();
  const toAddr = String(receipt.to || "").toLowerCase();
  const allLogs = Array.isArray(receipt.logs) ? receipt.logs : [];

  let candidateLogs = allLogs;
  if (expectedSafe && expectedSafe === toAddr) {
    candidateLogs = allLogs.filter((l) => String(l.address).toLowerCase() === expectedSafe);
  } else if (toAddr) {
    candidateLogs = allLogs.filter((l) => String(l.address).toLowerCase() === toAddr);
  }

  const seen = new Set(candidateLogs.map((l) => l.logIndex));
  const orderedLogs = candidateLogs.concat(allLogs.filter((l) => !seen.has(l.logIndex)));

  const iface = new ethers.Interface([
    "event ExecutionSuccess(bytes32 txHash, uint256 payment)",
    "event ExecutionFailure(bytes32 txHash, uint256 payment)",
  ]);

  for (const log of orderedLogs) {
    const parsed = iface.parseLog({ topics: log.topics, data: log.data });
    if (parsed && (parsed.name === "ExecutionSuccess" || parsed.name === "ExecutionFailure")) {
      return ethers.hexlify(parsed.args.txHash);
    }
  }

  const err = new Error("No Safe multisig execution found for this transaction on-chain (no safeTxHash).");
  err.status = 404;
  throw err;
}

export async function getTransactionDetailsByKey(safe, { type, key }) {
  if (type === "txHash") {
    const safeTxHash = await resolveSafeTxHashFromTxHash(safe, key);
    return getTransactionDetails(safeTxHash);
  }
  return getTransactionDetails(key);
}
