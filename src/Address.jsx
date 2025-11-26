import React from "react";
import { Typography, Popover, Box, Stack, IconButton } from "@mui/material";
import Chip from "@mui/material/Chip";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { shortAddress } from "./utils";

async function copyToClipboard(text) {
  if (!navigator.clipboard || !window.isSecureContext) return false;
  await navigator.clipboard.writeText(text);
  return true;
}

function Address({ displayName = null, address }) {
  const [popAnchor, setPopAnchor] = React.useState(null);
  const [copied, setCopied] = React.useState(false);

  const handlePopoverOpen = (event) => {
    setPopAnchor(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setPopAnchor(null);
  };

  const popOpen = Boolean(popAnchor);

  const onCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyToClipboard(address);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 900);
  };

  return (
    <>
      <Chip
        label={displayName || shortAddress(address)}
        aria-owns={popOpen ? "address-popover" : undefined}
        aria-haspopup="true"
        onClick={handlePopoverOpen}
        variant="outlined"
        sx={{
          height: 26,
          borderRadius: 2,
          maxWidth: 260,
          "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
        }}
      />

      <Popover
        id="address-popover"
        open={popOpen}
        anchorEl={popAnchor}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        onClose={handlePopoverClose}
        disableRestoreFocus
        sx={{ p: 1, borderRadius: 2 }}
      >
        <Stack spacing={0.75} sx={{ minWidth: 260 }}>
          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
            {address}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton size="small" onClick={onCopy} aria-label="Copy address">
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>

            <Box sx={{ flex: 1 }} />

            {copied && (
              <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                Copied
              </Typography>
            )}
          </Box>
        </Stack>
      </Popover>
    </>
  );
}

export default Address;
