export const SAFE_PREFIX_BY_CHAIN_ID = {
  1: "eth",
  137: "matic",
  42161: "arb1",
  11155111: "sep",
};

export const EXPLORER_BY_CHAIN_ID = {
  1: "https://etherscan.io",
  137: "https://polygonscan.com",
  42161: "https://arbiscan.io",
  11155111: "https://sepolia.etherscan.io",
};

export function chainPrefixFromId(chainId) {
  return SAFE_PREFIX_BY_CHAIN_ID[Number(chainId)] || String(chainId);
}

export function explorerAddressUrl(chainId, address) {
  const base = EXPLORER_BY_CHAIN_ID[Number(chainId)];
  if (!base) return null;
  return `${base}/address/${address}`;
}

export function explorerTxUrl(chainId, txHash) {
  const base = EXPLORER_BY_CHAIN_ID[Number(chainId)];
  if (!base) return null;
  return `${base}/tx/${txHash}`;
}
