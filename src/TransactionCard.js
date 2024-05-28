import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import { KEY_TRANSACTION_DETAILS, getTransactionDetails } from "./safe-api";
import { useQuery } from "@tanstack/react-query";
import CardActions from "@mui/material/CardActions";

function TransactionCard({ transaction, onConfirm }) {
  const txDetailsResponse = useQuery({
    queryKey: [KEY_TRANSACTION_DETAILS],
    queryFn: async () => getTransactionDetails(transaction.safeTxHash),
  });

  if (txDetailsResponse.isPending) return <div>Loading...</div>;
  if (txDetailsResponse.isError) return <div>Error: {txDetailsResponse.error.message}</div>;

  const txDetails = txDetailsResponse.data;

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
        <Typography>{txDetails.description}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Card>
          <CardContent>
            <Typography>
              ID: {transaction.safeTxHash} <br />
              Nonce: {transaction.nonce} <br />
              Confirmations: {`${transaction.confirmations?.length}/${transaction.confirmationsRequired}`} <br />
              Modified: {transaction.modified}
            </Typography>
            <pre>{txDetails.original_yaml}</pre>
          </CardContent>
          <CardActions style={{ justifyContent: "flex-end" }}>
            <Button variant="contained" color="primary" onClick={onConfirm}>
              Sign Transaction
            </Button>
          </CardActions>
        </Card>
      </AccordionDetails>
    </Accordion>
  );
}

export default TransactionCard;
