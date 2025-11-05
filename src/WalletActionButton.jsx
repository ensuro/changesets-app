import React from "react";
import Button from "@mui/material/Button";
import { useWallet, switchNetwork, connectWallet } from "./wallet";
import { useSafe } from "./safe-ui";

const WalletActionButton = ({ onClick, disabled, style = null, children }) => {
  const wallet = useWallet();
  const safe = useSafe();

  let handleClick = onClick;
  let content = children;
  let buttonDisabled = disabled;
  if (wallet.chainId !== safe.chainId) {
    handleClick = () => switchNetwork(safe.chainId);
    content = "Switch Network";
    buttonDisabled = false;
  } else if (wallet.accounts.length === 0) {
    handleClick = connectWallet;
    content = "Connect Wallet";
    buttonDisabled = false;
  }

  return (
    <Button variant="contained" onClick={handleClick} disabled={buttonDisabled} style={style}>
      {content}
    </Button>
  );
};

export default WalletActionButton;
