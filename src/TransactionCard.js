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

  const { accounts } = useWallet();
  const { owners } = useSafe();

  if (txDetailsResponse.isPending) return <div>Loading...</div>;
  if (txDetailsResponse.isError) return <div>Error: {txDetailsResponse.error.message}</div>;

  const txDetails = txDetailsResponse.data;

  const isOwner = owners.map((o) => o?.toLowerCase()).includes(accounts[0]);
  const alreadySigned = transaction.confirmations
    .map((c) => c.owner?.toLowerCase())
    .includes(accounts[0]?.toLowerCase());

  const signEnabled = !alreadySigned && isOwner;

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
        <Typography>
          {txDetails.description} ({transaction.safeTxHash})
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <Paper style={{ height: "100%" }}>
                  <Typography>
                    Nonce: {transaction.nonce} <br />
                    Confirmations: {`${transaction.confirmations?.length}/${transaction.confirmationsRequired}`} <br />
                    Modified: {transaction.modified}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper style={{ height: "100%" }}>
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
                    <Grid item xs={12}>
                      <Stack direction="column" spacing={1} justifyContent={"flex-end"}>
                        <WalletActionButton onClick={onConfirm} disabled={!signEnabled}>
                          {isOwner ? "Approve" : "Switch to an owner account"}
                        </WalletActionButton>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper>
                  <Typography variant="h6">Transaction Details</Typography>
                  <pre>{txDetails.original_yaml}</pre>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </AccordionDetails>
    </Accordion>
  );
}

export default TransactionCard;
