import * as React from "react";
import { Stack, Button, Typography, Divider } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";

import TransactionCard from "./TransactionCard";
import { useSafe } from "./safe-ui";
import { KEY_TRANSACTIONS, getTransactionsHistoryPage } from "./safe-api";

const PAGE_SIZE = 5;

function isoDay(dateIso) {
  return (dateIso || "").slice(0, 10) || "unknown";
}

function labelDDMMYYYY(isoDayStr) {
  if (isoDayStr === "unknown") return "Unknown date";
  const [y, m, d] = isoDayStr.split("-");
  return `${d}/${m}/${y}`;
}

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

  const items = React.useMemo(() => data?.pages?.flatMap((p) => p.items || []) ?? [], [data]);

  const groups = React.useMemo(() => {
    const byDay = new Map();
    for (const tx of items) {
      const day = isoDay(tx.executionDate) || isoDay(tx.modified) || isoDay(tx.submissionDate) || "unknown";
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(tx);
    }

    const days = Array.from(byDay.keys()).sort((a, b) => {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return a < b ? 1 : a > b ? -1 : 0;
    });

    return days.map((day) => {
      const txs = byDay
        .get(day)
        .slice()
        .sort((a, b) => (Number(a.nonce) < Number(b.nonce) ? 1 : -1));
      return { day, txs };
    });
  }, [items]);

  if (isPending) return <Typography>Loading…</Typography>;
  if (isError) return <Typography color="error">{String(error?.message || error)}</Typography>;

  return (
    <Stack spacing={2}>
      {items.length === 0 ? (
        <Typography color="text.secondary">No historical proposals</Typography>
      ) : (
        groups.map(({ day, txs }) => (
          <React.Fragment key={day}>
            <Divider textAlign="left" sx={{ "&::before, &::after": { borderColor: "divider" } }}>
              <Typography variant="overline">{labelDDMMYYYY(day)}</Typography>
            </Divider>
            {txs.map((tx) => (
              <TransactionCard key={tx.safeTxHash || tx.transactionHash} transaction={tx} readOnly />
            ))}
          </React.Fragment>
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
