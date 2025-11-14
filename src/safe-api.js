import SafeApiKit from "@safe-global/api-kit";
import Safe from "@safe-global/protocol-kit";

import { CHANGESET_URL_PREFIX, ADDRESSBOOK_URL, SAFE_API_KEY } from "./config";

export const KEY_TRANSACTIONS = "transactions";
export const KEY_DELEGATES = "delegates";
export const KEY_TRANSACTION_DETAILS = "transaction-details";
export const KEY_ADDRESS_BOOK = "address-book";

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
  const params = {
    executed: true,
    ordering: "-executionDate",
    limit,
    offset,
  };
  const res = await apiKit.getMultisigTransactions(safe.safeAddress, params);
  const items = res.results.slice();
  const hasMore = Boolean(res.next);
  return { items, hasMore, nextOffset: offset + items.length };
}

export async function getDelegates(safe) {
  const apiKit = getApi(safe.chainId);
  const response = await apiKit.getSafeDelegates({ safeAddress: safe.safeAddress });
  return response.results;
}

export async function addDelegate(safe, delegate, signer) {
  const apiKit = getApi(safe.chainId);
  if (!signer) throw new Error("No signer available");
  const delegatorAddress = await signer.getAddress?.();
  if (!delegatorAddress) throw new Error("Could not resolve delegator address from signer");
  return apiKit.addSafeDelegate({
    safeAddress: safe.safeAddress,
    delegateAddress: delegate.address,
    delegatorAddress,
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
