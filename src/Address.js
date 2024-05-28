import React from "react";
import { Typography, Popover } from "@mui/material";
import Chip from "@mui/material/Chip";
import { shortAddress } from "./utils";

function Address({ displayName = null, address }) {
  const [popAnchor, setPopAnchor] = React.useState(null);

  const handlePopoverOpen = (event) => {
    setPopAnchor(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setPopAnchor(null);
  };

  const popOpen = Boolean(popAnchor);

  return (
    <>
      <Chip
        label={displayName || shortAddress(address)}
        aria-owns={popOpen ? "mouse-over-popover" : undefined}
        aria-haspopup="true"
        onMouseEnter={handlePopoverOpen}
      />
      <Popover
        id="mouse-over-popover"
        open={popOpen}
        anchorEl={popAnchor}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Typography sx={{ p: 1 }}>{address}</Typography>
      </Popover>
    </>
  );
}

export default Address;
