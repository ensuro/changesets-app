import * as React from "react";
import { Stack, Button, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";

import TransactionCard from "./TransactionCard";
import { useSafe } from "./safe-ui";
import { KEY_TRANSACTIONS, getTransactionsHistoryPage } from "./safe-api";

const PAGE_SIZE = 5;

export default function HistoryTransactions() {
  const safe = useSafe();

  const { data, isPending, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [KEY_TRANSACTIONS, "history", safe.chainId, safe.safeAddress],
    enabled: !!safe?.safeAddress,
    queryFn: ({ pageParam = 0 }) => getTransactionsHistoryPage(safe, { limit: PAGE_SIZE, offset: pageParam }),
    getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextOffset : undefined),
    staleTime: 5_000,
    refetchOnWindowFocus: "always",
  });

  if (isPending) return <Typography>Loading…</Typography>;
  if (isError) return <Typography color="error">{String(error?.message || error)}</Typography>;

  const items = data?.pages?.flatMap((p) => p.items || []) ?? [];

  return (
    <Stack spacing={2}>
      {items.length === 0 ? (
        <Typography color="text.secondary">No historical proposals</Typography>
      ) : (
        items.map((tx) => (
          <TransactionCard key={tx.safeTxHash || tx.transactionHash} transaction={tx} readOnly={true} />
        ))
      )}

      {hasNextPage && (
        <Button
          variant="outlined"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          sx={{ alignSelf: "center" }}
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}
    </Stack>
  );
}
