/* global BigInt */
import SafeApiKit from "@safe-global/api-kit";
import Safe from "@safe-global/protocol-kit";

import { CHANGESET_URL_PREFIX, ADDRESSBOOK_URL } from "./config";

export const KEY_TRANSACTIONS = "transactions";
export const KEY_DELEGATES = "delegates";
export const KEY_TRANSACTION_DETAILS = "transaction-details";
export const KEY_ADDRESS_BOOK = "address-book";

export async function getTransactions(safe) {
  const apiKit = new SafeApiKit({ chainId: BigInt(safe.chainId) });
  const txs = await apiKit.getPendingTransactions(safe.safeAddress);
  return txs.results.sort((a, b) => a.nonce - b.nonce);
}

export async function getDelegates(safe) {
  const apiKit = new SafeApiKit({ chainId: BigInt(safe.chainId) });
  const response = await apiKit.getSafeDelegates({
    safeAddress: safe.safeAddress,
  });
  return response.results;
}

export async function addDelegate(safe, delegate, signer) {
  const config = {
    safeAddress: safe.safeAddress,
    delegateAddress: delegate.address,
    delegatorAddress: signer.address,
    signer: signer,
    label: delegate.name,
  };
  const apiKit = new SafeApiKit({ chainId: BigInt(safe.chainId) });
  return apiKit.addSafeDelegate(config);
}

export async function getTransactionDetails(safeTxHash) {
  const response = await fetch(`${CHANGESET_URL_PREFIX}/${safeTxHash}.json`);
  const data = await response.json();
  return data;
}

export async function getAddressBook() {
  const response = await fetch(ADDRESSBOOK_URL);
  return response.json();
}

export async function postConfirmation(safe, safeTxHash, signer) {
  const protocolKit = await Safe.init({
    provider: window.ethereum,
    safeAddress: safe.safeAddress,
    signer: signer,
  });
  const signature = await protocolKit.signHash(safeTxHash);

  const apiKit = new SafeApiKit({ chainId: BigInt(safe.chainId) });
  return apiKit.confirmTransaction(safeTxHash, signature.data);
}
