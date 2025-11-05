/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

export const WalletContext = createContext({
  chainId: null,
  connected: false,
  curAccount: null,
  setCurAccount: () => {},
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
  const [curAccount, setCurAccount] = useState(null);

  useEffect(() => {
    if (!window.ethereum) return;

    const onChainChanged = (newChainId) => setChainId(Number(newChainId));
    const onAccountsChanged = (accs) => setAccounts(accs);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    window.ethereum.on("chainChanged", onChainChanged);
    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("connect", onConnect);
    window.ethereum.on("disconnect", onDisconnect);

    return () => {
      window.ethereum.removeListener?.("chainChanged", onChainChanged);
      window.ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener?.("connect", onConnect);
      window.ethereum.removeListener?.("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accs) => setAccounts(accs))
      .catch((error) => console.error("Failed to get accounts: ", error));
  }, []);

  useEffect(() => {
    if (!window.ethereum || chainId) return;
    window.ethereum
      .request({ method: "eth_chainId" })
      .then((cid) => setChainId(Number(cid)))
      .catch((e) => console.error("Failed to get chainId:", e));
  }, [chainId]);

  useEffect(() => {
    if (!window.ethereum) return;
    try {
      setConnected(window.ethereum.isConnected());
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum || !curAccount) return;

    const p = new ethers.BrowserProvider(window.ethereum);
    setProvider(p);

    let cancelled = false;
    p.getSigner(curAccount)
      .then((s) => !cancelled && setSigner(s))
      .catch((e) => console.error("Failed to get signer:", e));

    return () => {
      cancelled = true;
      setSigner(null);
    };
  }, [curAccount]);

  useEffect(() => {
    setCurAccount(accounts[0]);
  }, [accounts]);

  return (
    <WalletContext.Provider value={{ chainId, connected, accounts, signer, provider, curAccount, setCurAccount }}>
      {children}
    </WalletContext.Provider>
  );
};
export default WalletProvider;

export const useWallet = () => useContext(WalletContext);
