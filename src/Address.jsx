import React from "react";
import { Typography, Popover, Box, Stack, IconButton, TextField, Button } from "@mui/material";
import Chip from "@mui/material/Chip";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { shortAddress } from "./utils";

async function copyToClipboard(text) {
  try {
    if (!navigator.clipboard || !window.isSecureContext) return true;
    await navigator.clipboard.writeText(text);
    return false;
  } catch {
    return true;
  }
}

function Address({ displayName = null, address }) {
  const [popAnchor, setPopAnchor] = React.useState(null);
  const [copied, setCopied] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(false);
  const inputRef = React.useRef(null);

  const popOpen = Boolean(popAnchor);

  const handlePopoverOpen = (event) => setPopAnchor(event.currentTarget);
  const handlePopoverClose = () => setPopAnchor(null);

  React.useEffect(() => {
    if (!manualOpen) return;
    const id = window.setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [manualOpen]);

  const onCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const needsManual = await copyToClipboard(address);
    if (needsManual) {
      setManualOpen(true);
      return;
    }

    setCopied(true);
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
        slotProps={{
          paper: { sx: { p: 1, borderRadius: 2, maxWidth: 440 } },
        }}
      >
        <Stack spacing={0.75} sx={{ minWidth: 320 }}>
          <Typography variant="caption" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
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

          {manualOpen && (
            <Box sx={{ pt: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                Clipboard is blocked in embedded mode. Copy manually:
              </Typography>

              <TextField
                fullWidth
                size="small"
                inputRef={inputRef}
                value={address}
                slotProps={{
                  input: { readOnly: true, sx: { fontFamily: "monospace" } },
                }}
              />

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <Button size="small" variant="text" onClick={() => setManualOpen(false)}>
                  Close
                </Button>
              </Box>
            </Box>
          )}
        </Stack>
      </Popover>
    </>
  );
}

export default Address;
