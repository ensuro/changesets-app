/* global BigInt */
import * as React from "react";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import SafeApiKit from "@safe-global/api-kit";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";

import { SafeMultisigTransactionResponse } from "@safe-global/safe-core-sdk-types";

function TransactionTable() {
  const { sdk, safe, connected } = useSafeAppsSDK();
  const [transactions, setTransactions] = React.useState([]);

  const signTransaction = async (safeTxHash: string) => {
    console.log("Signing transaction %s", safeTxHash);
  };

  React.useEffect(() => {
    const fetchTransactions = async () => {
      console.log("chainId=%s, safeAddress=%s", safe.chainId, safe.safeAddress);
      const apiKit = new SafeApiKit({ chainId: BigInt(safe.chainId) });
      const txs = await apiKit.getPendingTransactions(safe.safeAddress);
      setTransactions(txs.results);
    };

    if (safe.safeAddress && connected) fetchTransactions();
  }, [sdk, safe.safeAddress, safe.chainId, connected]);

  return (
    <div>
      {transactions.map((transaction: SafeMultisigTransactionResponse) => (
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
                  Confirmations: {`${transaction.confirmations.length}/${transaction.confirmationsRequired}`} <br />
                  Modified: {transaction.modified}
                </Typography>
                <Button variant="contained" color="primary" onClick={() => signTransaction(transaction.safeTxHash)}>
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
