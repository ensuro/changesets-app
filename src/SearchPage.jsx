import * as React from "react";
import { Box, Stack, TextField, MenuItem, Button, Paper, Typography, Link } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { useSafe } from "./safe-ui";
import { chainPrefixFromId } from "./chain-utils";
import { KEY_TRANSACTIONS, getChangesetAndSafeTxHashByKey, getSafeTransaction } from "./safe-api";
import TransactionCard from "./TransactionCard";

const KEY_SEARCH = "tx-search";

export default function SearchPage() {
  const { chainId, safeAddress } = useSafe();
  const safe = React.useMemo(() => ({ chainId, safeAddress }), [chainId, safeAddress]);

  const [mode, setMode] = React.useState("safeTxHash");
  const [searchText, setSearchText] = React.useState("");
  const [submittedQuery, setSubmittedQuery] = React.useState(null);

  const chainPrefix = chainPrefixFromId(chainId);
  const hasSubmitted = !!submittedQuery?.text;

  const searchQuery = useQuery({
    queryKey: [KEY_SEARCH, submittedQuery?.mode, submittedQuery?.text, chainId, safeAddress],
    enabled: hasSubmitted,
    queryFn: async () => {
      if (!submittedQuery) return null;
      return getChangesetAndSafeTxHashByKey(safe, { type: submittedQuery.mode, key: submittedQuery.text });
    },
  });

  const safeTxHash = searchQuery.data?.safeTxHash || null;

  const txMetaQuery = useQuery({
    queryKey: [KEY_TRANSACTIONS, "search-meta", chainId, safeAddress, safeTxHash],
    enabled: !!safeTxHash,
    queryFn: async () => getSafeTransaction(safe, safeTxHash),
  });

  function onSubmit(e) {
    e.preventDefault();
    const text = searchText.trim();
    if (!text) return;
    setSubmittedQuery({ mode, text });
  }

  const baseSafeUrl = hasSubmitted
    ? `https://app.safe.global/transactions/tx?safe=${chainPrefix}:${safeAddress}`
    : null;

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box component="form" onSubmit={onSubmit}>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Type"
              size="small"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="safeTxHash">safeTxHash</MenuItem>
              <MenuItem value="txHash">txHash</MenuItem>
            </TextField>

            <TextField
              label="Search"
              size="small"
              fullWidth
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={mode === "safeTxHash" ? "0x… (safeTxHash)" : "0x… (txHash)"}
            />

            <Button type="submit" variant="contained">
              Search
            </Button>
          </Stack>
        </Box>
      </Paper>

      {hasSubmitted && (searchQuery.fetchStatus === "fetching" || txMetaQuery.fetchStatus === "fetching") && (
        <Typography>Searching…</Typography>
      )}

      {hasSubmitted && (searchQuery.isError || txMetaQuery.isError) && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          {searchQuery.error?.status === 404 ? (
            <Typography color="text.secondary">
              No changeset found for transaction{" "}
              {submittedQuery?.text && (
                <Link
                  href={`${baseSafeUrl}&id=multisig_${safeAddress}_${submittedQuery.text}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {submittedQuery.text}
                </Link>
              )}
            </Typography>
          ) : (
            <Typography color="error">
              Error:{" "}
              {String(
                searchQuery.error?.message || txMetaQuery.error?.message || searchQuery.error || txMetaQuery.error
              )}
            </Typography>
          )}
        </Paper>
      )}

      {hasSubmitted && searchQuery.isSuccess && searchQuery.data?.changeset && (
        <TransactionCard
          transaction={txMetaQuery.data || undefined}
          txDetails={searchQuery.data.changeset}
          safeTxHash={searchQuery.data.safeTxHash}
          readOnly
        />
      )}
    </Stack>
  );
}
