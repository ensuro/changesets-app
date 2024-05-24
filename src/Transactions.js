/* global BigInt */
import * as React from "react";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import SafeApiKit from "@safe-global/api-kit";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";

import Safe from "@safe-global/protocol-kit";

import { SafeMultisigTransactionResponse } from "@safe-global/safe-core-sdk-types";

function TransactionTable() {
  const { sdk, safe, connected } = useSafeAppsSDK();
  const [transactions, setTransactions] = React.useState([]);

  const signTransaction = async (safeTxHash: string) => {
    console.log("Signing transaction %s", safeTxHash);
    if (!window.ethereum) {
      console.error("No browser wallet available!");
      return;
    }

    const protocolKit = await Safe.init({
      provider: window.ethereum,
      safeAddress: safe.safeAddress,
    });
    const signature = await protocolKit.signHash(safeTxHash);

    const apiKit = new SafeApiKit({ chainId: BigInt(safe.chainId) });
    const result = await apiKit.confirmTransaction(safeTxHash, signature.data);

    console.log("Transaction signed: %s", result);
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
