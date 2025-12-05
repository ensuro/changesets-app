import React from "react";
import { Typography, Popover, Link } from "@mui/material";
import Chip from "@mui/material/Chip";
import { shortAddress } from "./utils";
import { explorerAddressUrl } from "./chain-utils";
import { useSafe } from "./safe-ui";

function Address({ displayName = null, address }) {
  const [popAnchor, setPopAnchor] = React.useState(null);
  const { chainId } = useSafe();

  const popOpen = Boolean(popAnchor);
  const url = explorerAddressUrl(chainId, address);

  return (
    <>
      <Chip
        label={displayName || shortAddress(address)}
        aria-owns={popOpen ? "address-popover" : undefined}
        aria-haspopup="true"
        onClick={(e) => setPopAnchor(e.currentTarget)}
        onDelete={undefined}
        variant="outlined"
      />
      <Popover
        id="address-popover"
        open={popOpen}
        anchorEl={popAnchor}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        onClose={() => setPopAnchor(null)}
        disableRestoreFocus
      >
        <Typography sx={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
          {url ? (
            <Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}
              onClick={() => setPopAnchor(null)}
            >
              {address}
            </Link>
          ) : (
            address
          )}
        </Typography>
      </Popover>
    </>
  );
}

export default Address;
