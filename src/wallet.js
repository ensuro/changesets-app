import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

export const WalletContext = createContext({
  chainId: null,
  connected: false,
  accounts: [],
  signer: null,
  provider: null,
});

export const connectWallet = async () => {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  } catch (error) {
    console.error("Failed to connect to wallet: ", error);
  }
};

export const switchNetwork = async (chainId) => {
  if (!window.ethereum) return;

  console.log("Switching network to ", ethers.toQuantity(chainId), typeof chainId);
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ethers.toQuantity(chainId) }],
    });
  } catch (error) {
    console.error("Failed to switch network: ", error);
  }
};

const WalletProvider = ({ children }) => {
  const [chainId, setChainId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.on("chainChanged", (newChainId) => setChainId(parseInt(newChainId)));
    window.ethereum.on("accountsChanged", (accounts) => setAccounts(accounts));
    window.ethereum.on("connect", () => setConnected(true));
    window.ethereum.on("disconnect", () => setConnected(false));

    return () => window.ethereum.removeAllListeners();
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum
      .request({ method: "eth_accounts", params: [] })
      .then((accounts) => setAccounts(accounts))
      .catch((error) => {
        console.error("Failed to get accounts: ", error);
      });
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    if (chainId) return;
    window.ethereum.request({ method: "eth_chainId", params: [] }).then((chainId) => setChainId(parseInt(chainId)));
  }, [chainId]);

  useEffect(() => {
    if (!window.ethereum) return;
    setConnected(window.ethereum.isConnected());
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    if (accounts.length === 0) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    setProvider(provider);

    provider.getSigner().then((signer) => setSigner(signer));
  }, [accounts]);

  return (
    <WalletContext.Provider value={{ chainId, connected, accounts, signer, provider }}>
      {children}
    </WalletContext.Provider>
  );
};
export default WalletProvider;

export const useWallet = () => useContext(WalletContext);
