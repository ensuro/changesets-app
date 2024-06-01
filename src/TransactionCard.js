import React from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { useQuery } from "@tanstack/react-query";

import { KEY_TRANSACTION_DETAILS, KEY_ADDRESS_BOOK, getAddressBook, getTransactionDetails } from "./safe-api";
import Address from "./Address";
import { useWallet } from "./wallet";
import { useSafe } from "./safe-ui";
import WalletActionButton from "./WalletActionButton";

function TransactionCard({ transaction, onConfirm }) {
  const txDetailsResponse = useQuery({
    queryKey: [KEY_TRANSACTION_DETAILS, transaction.safeTxHash],
    queryFn: async () => getTransactionDetails(transaction.safeTxHash),
  });

  const addressBookResponse = useQuery({
    queryKey: [KEY_ADDRESS_BOOK],
    queryFn: getAddressBook,
    // Fetch only once, no need to refresh
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const { curAccount } = useWallet();
  const { owners } = useSafe();

  if (txDetailsResponse.isPending) return <div>Loading...</div>;
  if (txDetailsResponse.isError) return <div>Error: {txDetailsResponse.error.message}</div>;

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
          <Grid item xs={8}>
            <Paper style={{ height: "100%" }} variant="outlined">
              <Typography>
                Nonce: {transaction.nonce} <br />
                Confirmations: {`${transaction.confirmations?.length}/${transaction.confirmationsRequired}`} <br />
                Modified: {transaction.modified}
              </Typography>
            </Paper>
          </Grid>
          <Grid item container xs={4}>
            <Paper style={{ height: "100%", width: "100%" }} variant="outlined">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">Signers</Typography>
                </Grid>
                <Grid item xs={12} sx={{ margin: "0 10%" }}>
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
                <Grid item container xs={12} justifyContent="center">
                  <WalletActionButton
                    onClick={onConfirm}
                    disabled={!signEnabled}
                    style={{ marginBottom: "10px", width: "90%" }}
                  >
                    {isOwner ? "Approve" : "Switch to an owner account"}
                  </WalletActionButton>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12}>
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
