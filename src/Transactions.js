/* global BigInt */
import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { KEY_TRANSACTIONS, getTransactions, postConfirmation } from "./safe-api";
import { useSafe } from "./safe-ui";

function TransactionTable() {
  const queryClient = useQueryClient();

  const safe = useSafe();

  const transactions = useQuery({ queryKey: [KEY_TRANSACTIONS], queryFn: async () => getTransactions(safe) });

  const confirmTransaction = useMutation({
    mutationFn: async (safeTxHash) => postConfirmation(safe, safeTxHash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY_TRANSACTIONS] });
    },
    onSettled: (data, error) => {
      console.log("onSettled", data, error);
    },
  });

  if (transactions.isPending) return <div>Loading...</div>;
  if (transactions.isError) return <div>Error: {transactions.error.message}</div>;

  return (
    <div>
      {transactions.data?.map((transaction) => (
        <Accordion key={transaction.safeTxHash}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
            <Typography>To: {transaction.to}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Card>
              <CardContent>
                <Typography>
                  Value: {transaction.value} <br />
                  Data: {transaction.data} <br />
                  Confirmations: {`${transaction.confirmations?.length}/${transaction.confirmationsRequired}`} <br />
                  Modified: {transaction.modified}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => confirmTransaction.mutate(transaction.safeTxHash)}
                >
                  Sign Transaction
                </Button>
              </CardContent>
            </Card>
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  );
}

export default TransactionTable;
