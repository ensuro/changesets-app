// src/SearchPage.jsx
import * as React from "react";
import { Box, Stack, TextField, MenuItem, Button, Paper, Typography, Link } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { useSafe } from "./safe-ui";
import { getTransactionDetailsByKey } from "./safe-api";
import { TransactionDetailsPanel } from "./TransactionCard";

const KEY_SEARCH = "tx-search";

function chainPrefixFromId(chainId) {
  switch (Number(chainId)) {
    case 1:
      return "eth";
    case 137:
      return "matic";
    case 42161:
      return "arb1";
    default:
      return String(chainId);
  }
}

export default function SearchPage() {
  const { chainId, safeAddress } = useSafe();
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
      const changeset = await getTransactionDetailsByKey(
        { chainId, safeAddress },
        { type: submittedQuery.mode, key: submittedQuery.text.trim() }
      );
      const safeTxHash =
        submittedQuery.mode === "safeTxHash"
          ? submittedQuery.text.trim()
          : changeset?.safeTxHash || changeset?.safe_tx_hash || submittedQuery.text.trim();
      return { safeTxHash, changeset };
    },
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
      {/* Formulario de búsqueda */}
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

      {/* Estado de carga */}
      {hasSubmitted && query.fetchStatus === "fetching" && <Typography>Searching…</Typography>}

      {/* Errores (incluido 404 sin changeset) */}
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

      {/* Resultado: panel amigable reutilizando TransactionDetailsPanel */}
      {hasSubmitted && query.isSuccess && query.data?.changeset && (
        <TransactionDetailsPanel
          txDetails={query.data.changeset}
          safeTxHash={query.data.safeTxHash}
          chainId={chainId}
          safeAddress={safeAddress}
          txKey={query.data.safeTxHash}
          // En la búsqueda no tenemos address book cargado aquí
          addressBook={undefined}
        />
      )}
    </Stack>
  );
}
