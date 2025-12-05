import * as React from "react";
import { Box, Stack, TextField, MenuItem, Button, Paper, Typography, Link } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { useSafe } from "./safe-ui";
import { getChangesetAndSafeTxHashByKey, getSafeTransaction } from "./safe-api";
import { chainPrefixFromId } from "./chain-utils";
import TransactionCard from "./TransactionCard";

const KEY_SEARCH = "tx-search";

export default function SearchPage() {
  const safe = useSafe();
  const { chainId, safeAddress } = safe;

  const [mode, setMode] = React.useState("safeTxHash");
  const [searchText, setSearchText] = React.useState("");
  const [submittedQuery, setSubmittedQuery] = React.useState(null);

  const chainPrefix = chainPrefixFromId(chainId);
  const hasSubmitted = !!submittedQuery?.text;

  const query = useQuery({
    queryKey: [KEY_SEARCH, submittedQuery?.mode, submittedQuery?.text, chainId, safeAddress],
    enabled: hasSubmitted,
    queryFn: async () => {
      if (!submittedQuery) return null;

      const base = await getChangesetAndSafeTxHashByKey(safe, {
        type: submittedQuery.mode,
        key: submittedQuery.text,
      });

      if (!base?.safeTxHash) return null;

      const txMeta = await getSafeTransaction(safe, base.safeTxHash);

      return { ...base, txMeta };
    },
    refetchOnWindowFocus: false,
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

  const isSearching = hasSubmitted && query.fetchStatus === "fetching";
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

      {isSearching && <Typography>Searching…</Typography>}

      {hasSubmitted && query.isError && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          {query.error?.status === 404 ? (
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
            <Typography color="error">Error: {String(query.error?.message || query.error)}</Typography>
          )}
        </Paper>
      )}

      {!isSearching && hasSubmitted && query.isSuccess && query.data?.changeset && (
        <TransactionCard
          key={query.data.safeTxHash}
          transaction={query.data.txMeta}
          txDetails={query.data.changeset}
          safeTxHash={query.data.safeTxHash}
          readOnly
        />
      )}
    </Stack>
  );
}
