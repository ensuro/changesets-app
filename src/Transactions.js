import * as React from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { KEY_TRANSACTIONS, getTransactions, postConfirmation } from "./safe-api";
import { useSafe } from "./safe-ui";
import TransactionCard from "./TransactionCard";
import { Stack } from "@mui/material";

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
    <Stack spacing={2}>
      {transactions.data?.map((transaction) => (
        <TransactionCard
          transaction={transaction}
          onConfirm={() => confirmTransaction.mutate(transaction.safeTxHash)}
          key={transaction.safeTxHash}
        />
      ))}
    </Stack>
  );
}

export default TransactionTable;
