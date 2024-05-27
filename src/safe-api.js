/* global BigInt */
import SafeApiKit from "@safe-global/api-kit";
import Safe from "@safe-global/protocol-kit";

export const KEY_TRANSACTIONS = "transactions";

export async function getTransactions(safe) {
  const apiKit = new SafeApiKit({ chainId: BigInt(safe.chainId) });
  const txs = await apiKit.getPendingTransactions(safe.safeAddress);
  return txs.results;
}

export async function postConfirmation(safe, safeTxHash) {
  const protocolKit = await Safe.init({
    provider: window.ethereum,
    safeAddress: safe.safeAddress,
  });
  const signature = await protocolKit.signHash(safeTxHash);

  const apiKit = new SafeApiKit({ chainId: BigInt(safe.chainId) });
  return apiKit.confirmTransaction(safeTxHash, signature.data);
}
