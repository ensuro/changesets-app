import * as React from "react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ParaglidingIcon from "@mui/icons-material/Paragliding";

export const mainListItems = (
  <React.Fragment>
    <ListItemButton>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Transactions" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <ParaglidingIcon />
      </ListItemIcon>
      <ListItemText primary="Delegates" />
    </ListItemButton>
  </React.Fragment>
);
