import React from "react";

import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

import { useSafe } from "./safe-ui";

import SafeSummary from "./SafeSummary";
import Transactions from "./Transactions";

function TransactionsPage() {
  const safe = useSafe();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SafeSummary address={safe.safeAddress} />
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
          <Transactions />
        </Paper>
      </Grid>
    </Grid>
  );
}

export default TransactionsPage;
