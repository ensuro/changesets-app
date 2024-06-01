import { IconButton, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import NoAccountsOutlinedIcon from "@mui/icons-material/NoAccountsOutlined";

import React, { useState } from "react";
import { shortAddress } from "./utils";
import { useWallet, connectWallet } from "./wallet";

const AccountsMenu = () => {
  const { accounts, curAccount, setCurAccount } = useWallet();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    connectWallet();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton color="inherit" onClick={handleMenuClick}>
        {accounts.length === 0 ? <NoAccountsOutlinedIcon /> : <AccountCircleOutlinedIcon />}
        <Typography variant="body1" sx={{ ml: 1 }}>
          {curAccount ? shortAddress(curAccount) : "Connect Wallet"}
        </Typography>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {accounts.map((account) => (
          <MenuItem
            key={account}
            onClick={() => {
              setCurAccount(account);
              handleClose();
            }}
          >
            {shortAddress(account)}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default AccountsMenu;
