import React from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Grid, Paper, Stack, Typography } from "@mui/material";

import { useQuery } from "@tanstack/react-query";

import { KEY_TRANSACTION_DETAILS, KEY_ADDRESS_BOOK, getAddressBook, getTransactionDetails } from "./safe-api";
import Address from "./Address";
import { useWallet } from "./wallet";
import { useSafe } from "./safe-ui";
import WalletActionButton from "./WalletActionButton";

function TransactionCard({ transaction, onConfirm, readOnly = false }) {
  const txKey = transaction.safeTxHash || transaction.transactionHash || transaction.txHash;
  const txDetailsResponse = useQuery({
    queryKey: [KEY_TRANSACTION_DETAILS, txKey],
    queryFn: async () => getTransactionDetails(transaction.safeTxHash),
  });

  const addressBookResponse = useQuery({
    queryKey: [KEY_ADDRESS_BOOK],
    queryFn: getAddressBook,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { curAccount } = useWallet();
  const { owners } = useSafe();

  if (txDetailsResponse.isPending) return <div>Loading...</div>;
  if (txDetailsResponse.isError) {
    if (txDetailsResponse.error?.status === 404) {
      return (
        <Accordion elevation={2}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{txKey}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item size={12}>
                <Paper variant="outlined" style={{ padding: 12 }}>
                  <Typography color="text.secondary">
                    The specified key does not exist. No such object: changesets-polygon/{`${txKey}`}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      );
    }
    return <div>Error: {String(txDetailsResponse.error?.message || txDetailsResponse.error)}</div>;
  }

  const txDetails = txDetailsResponse.data;

  const isOwner = owners.map((o) => o?.toLowerCase()).includes(curAccount);
  const alreadySigned = transaction.confirmations
    .map((c) => c.owner?.toLowerCase())
    .includes(curAccount?.toLowerCase());

  const signEnabled = !alreadySigned && isOwner;

  return (
    <Accordion elevation={2}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
        <Typography>
          {txDetails.description} ({transaction.safeTxHash})
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid item size={8}>
            <Paper style={{ height: "100%" }} variant="outlined">
              <Typography>
                Nonce: {transaction.nonce} <br />
                Confirmations: {`${transaction.confirmations?.length}/${transaction.confirmationsRequired}`} <br />
                Modified: {transaction.modified}
              </Typography>
            </Paper>
          </Grid>
          <Grid item container size={4}>
            <Paper style={{ height: "100%", width: "100%" }} variant="outlined">
              <Grid container spacing={2}>
                <Grid item size={12}>
                  <Typography variant="h6">Signers</Typography>
                </Grid>
                <Grid item size={12} sx={{ margin: "0 10%" }}>
                  <Stack direction="column" spacing={1}>
                    {transaction.confirmations.length === 0 && <Typography>No signatures yet</Typography>}
                    {transaction.confirmations.map((signer) => (
                      <Address
                        key={signer.owner}
                        address={signer.owner}
                        displayName={addressBookResponse.data?.[signer.owner]}
                      />
                    ))}
                  </Stack>
                </Grid>
                {!readOnly && (
                  <Grid item container size={12} justifyContent="center">
                    <WalletActionButton
                      onClick={onConfirm}
                      disabled={!signEnabled}
                      style={{ marginBottom: "10px", width: "90%" }}
                    >
                      {isOwner ? "Approve" : "Switch to an owner account"}
                    </WalletActionButton>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
          <Grid item size={12}>
            <Paper variant="outlined">
              <Typography variant="h6">Transaction Details</Typography>
              <pre>{txDetails.original_yaml}</pre>
            </Paper>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

export default TransactionCard;
