import React from "react";
import { Typography, Popover, Link, Stack } from "@mui/material";
import Chip from "@mui/material/Chip";
import { shortAddress } from "./utils";
import { explorerAddressUrl } from "./chain-utils";
import { useSafe } from "./safe-ui";

function Address({ displayName = null, address }) {
  const [popAnchor, setPopAnchor] = React.useState(null);
  const { chainId } = useSafe();

  const handlePopoverOpen = (event) => setPopAnchor(event.currentTarget);
  const handlePopoverClose = () => setPopAnchor(null);

  const popOpen = Boolean(popAnchor);

  const url = explorerAddressUrl(chainId, address);

  return (
    <>
      <Chip
        label={displayName || shortAddress(address)}
        aria-owns={popOpen ? "address-popover" : undefined}
        aria-haspopup="true"
        onClick={handlePopoverOpen}
        variant="outlined"
        sx={{ height: 26, borderRadius: 2 }}
      />
      <Popover
        id="address-popover"
        open={popOpen}
        anchorEl={popAnchor}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        onClose={handlePopoverClose}
        disableRestoreFocus
        slotProps={{ paper: { sx: { p: 1, borderRadius: 2, maxWidth: 520 } } }}
      >
        <Stack spacing={0.75}>
          <Typography sx={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{address}</Typography>
          {url && (
            <Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}
            >
              {url}
            </Link>
          )}
        </Stack>
      </Popover>
    </>
  );
}

export default Address;
