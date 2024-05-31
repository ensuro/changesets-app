/* global BigInt */
import SafeApiKit from "@safe-global/api-kit";
import Safe from "@safe-global/protocol-kit";

export const KEY_TRANSACTIONS = "transactions";
export const KEY_TRANSACTION_DETAILS = "transaction-details";
export const KEY_ADDRESS_BOOK = "address-book";

export async function getTransactions(safe) {
  const apiKit = new SafeApiKit({ chainId: BigInt(safe.chainId) });
  const txs = await apiKit.getPendingTransactions(safe.safeAddress);
  return txs.results.sort((a, b) => a.nonce - b.nonce);
}

export async function getTransactionDetails(safeTxHash) {
  const response = await fetch(`/${safeTxHash}.json`);
  const data = await response.json();
  return data;
}

export async function getAddressBook() {
  const response = await fetch("/address-book.json");
  return response.json();
}

export async function postConfirmation(safe, safeTxHash) {
  // console.log(await window.ethereum.getSignerAddress());

  const protocolKit = await Safe.init({
    provider: window.ethereum,
    safeAddress: safe.safeAddress,
  });
  const signature = await protocolKit.signHash(safeTxHash);

  const apiKit = new SafeApiKit({ chainId: BigInt(safe.chainId) });
  return apiKit.confirmTransaction(safeTxHash, signature.data);
}
