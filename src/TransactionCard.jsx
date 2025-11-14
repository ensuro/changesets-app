import React from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LaunchIcon from "@mui/icons-material/Launch";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  Paper,
  Stack,
  Typography,
  Skeleton,
  Box,
  Chip,
  Tooltip,
  Button,
  Collapse,
} from "@mui/material";

import { useQuery } from "@tanstack/react-query";

import { KEY_TRANSACTION_DETAILS, KEY_ADDRESS_BOOK, getAddressBook, getTransactionDetails } from "./safe-api";
import Address from "./Address";
import { useWallet } from "./wallet";
import { useSafe } from "./safe-ui";
import WalletActionButton from "./WalletActionButton";

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

function truncateMiddle(str, visible = 6) {
  if (!str) return "";
  if (str.length <= visible * 2 + 3) return str;
  return `${str.slice(0, visible)}…${str.slice(-visible)}`;
}

function buildSteps(txDetails) {
  if (!txDetails) return [];

  const batch = txDetails.batch;
  if (batch && Array.isArray(batch.targets) && batch.targets.length) {
    const targets = batch.targets || [];
    const values = batch.values || [];
    const payloads = batch.payloads || [];
    const asArgs = batch.asArgs || [];

    return targets.map((target, index) => {
      const value = values[index];
      const payload = payloads[index];
      const args = asArgs[index];

      return {
        id: `batch-${index}`,
        title: `Call #${index + 1}`,
        to: target,
        value,
        token: null,
        summary: payload ? `Calldata: ${truncateMiddle(payload, 10)}` : null,
        rawArgs: args,
      };
    });
  }

  const rawSteps = Array.isArray(txDetails.steps) ? txDetails.steps : null;
  if (rawSteps && rawSteps.length) return rawSteps;

  const summary = txDetails.summary || null;
  const description = txDetails.description || null;

  const title = summary || description || "Transaction";

  const to = txDetails.to || txDetails.target || null;
  const value = txDetails.value ?? null;
  const token = txDetails.tokenSymbol || (txDetails.token && txDetails.token.symbol) || null;

  const bodySummary =
    summary && summary !== title ? summary : description && description !== title ? description : null;

  return [
    {
      id: "main",
      title,
      to,
      value,
      token,
      summary: bodySummary,
    },
  ];
}

function StepItem({ index, step, addressBook }) {
  const title = step.title || step.name || step.action || `Step ${index + 1}`;

  const to = step.to || step.recipient || step.target || null;

  const value = step.value ?? step.amount ?? null;
  const token = step.token || step.tokenSymbol || step.asset || null;

  const summary = step.summary || step.description || null;

  const displayName = to && addressBook ? addressBook[to] : undefined;

  return (
    <Box
      sx={{
        mt: 0.5,
        p: 1,
        borderRadius: 1,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: "rgba(255,255,255,0.02)",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: (theme) => `1px solid ${theme.palette.primary.main}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "primary.main",
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          {index + 1}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>

          {summary && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {summary}
            </Typography>
          )}

          <Stack spacing={0.25}>
            {to && (
              <Typography variant="caption" color="text.secondary">
                To: <Address address={to} displayName={displayName} />
              </Typography>
            )}

            {value != null && (
              <Typography variant="caption" color="text.secondary">
                Amount:{" "}
                <Typography component="span" variant="caption" sx={{ fontFamily: "monospace" }}>
                  {String(value)}
                  {token ? ` ${token}` : ""}
                </Typography>
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

function DetailsPanel({ txDetails, safeTxHash, chainId, safeAddress, txKey, addressBook }) {
  const [showRaw, setShowRaw] = React.useState(false);

  const steps = buildSteps(txDetails);
  const chainPrefix = chainPrefixFromId(chainId);
  const baseSafeUrl =
    chainPrefix && safeAddress ? `https://app.safe.global/transactions/tx?safe=${chainPrefix}:${safeAddress}` : null;

  const safeIdParam = safeTxHash ? safeTxHash : txKey && safeAddress ? `multisig_${safeAddress}_${txKey}` : null;

  const safeUrl = baseSafeUrl && safeIdParam ? `${baseSafeUrl}&id=${safeIdParam}` : null;

  const networks = txDetails?.networks || txDetails?.network || null;
  const via = txDetails?.via || null;
  const timelock = txDetails?.timelock || null;
  const contract = txDetails?.contract || null;

  const viaAddress = via?.address;
  const viaType = via?.type;
  const viaDisplayName = viaAddress && addressBook ? addressBook[viaAddress] : undefined;

  const timelockRelayAddress = timelock?.execution_relay?.address;
  const timelockRelayDisplayName = timelockRelayAddress && addressBook ? addressBook[timelockRelayAddress] : undefined;

  const contractTarget = contract?.target;
  const contractTargetName = contractTarget && addressBook ? addressBook[contractTarget] : undefined;

  const hasTimelockBadge =
    !!timelock && ((timelock.delay && String(timelock.delay) !== "min") || !!timelock.execution_relay);

  const titleDescription = txDetails?.description || "Multisig transaction";

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
        {titleDescription}
      </Typography>

      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.6, fontWeight: 600 }}>
        Transaction details
      </Typography>

      {safeTxHash && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            safeTxHash:{" "}
            <Tooltip title={safeTxHash}>
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                {truncateMiddle(safeTxHash, 8)}
              </Box>
            </Tooltip>
          </Typography>
        </Box>
      )}

      <Stack spacing={0.5} sx={{ mb: 1.5 }}>
        {networks && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Networks:
            </Typography>
            {Array.isArray(networks) ? (
              networks.map((n) => (
                <Chip
                  key={n}
                  size="small"
                  label={String(n)}
                  variant="outlined"
                  sx={{ height: 20, fontSize: "0.7rem" }}
                />
              ))
            ) : (
              <Chip size="small" label={String(networks)} variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
            )}
          </Stack>
        )}

        {viaAddress && (
          <Typography variant="caption" color="text.secondary">
            Via ({viaType || "via"}): <Address address={viaAddress} displayName={viaDisplayName} />
          </Typography>
        )}

        {timelock && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Timelock: delay={String(timelock.delay || "n/a")}
              {timelockRelayAddress && (
                <>
                  {" "}
                  · relay: <Address address={timelockRelayAddress} displayName={timelockRelayDisplayName} />
                </>
              )}
            </Typography>
            {hasTimelockBadge && (
              <Chip
                size="small"
                label="Timelocked"
                color="warning"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
            )}
          </Stack>
        )}

        {contractTarget && (
          <Typography variant="caption" color="text.secondary">
            Contract target: <Address address={contractTarget} displayName={contractTargetName} />
          </Typography>
        )}
      </Stack>

      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.6, fontWeight: 600 }}>
        Steps
      </Typography>

      {steps.length ? (
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          {steps.map((step, index) => (
            <StepItem key={step.id || index} index={index} step={step} addressBook={addressBook} />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          No structured steps were provided for this transaction.
        </Typography>
      )}

      <Stack direction="row" spacing={1} sx={{ mt: 1.5, mb: 1 }} alignItems="center" justifyContent="space-between">
        <Box>
          {safeUrl && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              component="a"
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<LaunchIcon fontSize="small" />}
            >
              Open in Safe web app
            </Button>
          )}
        </Box>

        <Button size="small" variant="text" onClick={() => setShowRaw((v) => !v)}>
          {showRaw ? "Hide raw JSON" : "Show raw JSON"}
        </Button>
      </Stack>

      <Collapse in={showRaw} unmountOnExit>
        <Box
          component="pre"
          sx={{
            mt: 1,
            maxHeight: 260,
            overflow: "auto",
            fontSize: "0.75rem",
            backgroundColor: "rgba(255,255,255,0.02)",
            borderRadius: 1,
            p: 1,
          }}
        >
          {JSON.stringify(txDetails, null, 2)}
        </Box>
      </Collapse>
    </Paper>
  );
}

function TransactionCard({
  transaction,
  onConfirm,
  readOnly = false,
  variant,
  txDetails: txDetailsProp,
  safeTxHash: safeTxHashProp,
}) {
  const hasTransaction = !!transaction;
  const { curAccount } = useWallet();
  const { owners, chainId, safeAddress } = useSafe();

  const txKey = hasTransaction
    ? transaction.safeTxHash || transaction.transactionHash || transaction.txHash
    : safeTxHashProp;

  const shouldFetchDetails = !txDetailsProp && hasTransaction && !!transaction.safeTxHash;

  const txDetailsResponse = useQuery({
    queryKey: [KEY_TRANSACTION_DETAILS, txKey],
    enabled: shouldFetchDetails,
    queryFn: async () => getTransactionDetails(transaction.safeTxHash),
  });

  const addressBookResponse = useQuery({
    queryKey: [KEY_ADDRESS_BOOK],
    queryFn: getAddressBook,
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: hasTransaction,
  });

  const addressBook = addressBookResponse.data || {};
  const txDetails = txDetailsProp || txDetailsResponse.data;

  if (!hasTransaction || variant === "panel") {
    if (!txDetails) return null;
    return (
      <DetailsPanel
        txDetails={txDetails}
        safeTxHash={safeTxHashProp}
        chainId={chainId}
        safeAddress={safeAddress}
        txKey={txKey}
        addressBook={addressBook}
      />
    );
  }

  if (shouldFetchDetails && txDetailsResponse.isPending) {
    return (
      <Accordion elevation={2}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Skeleton variant="text" width="60%" />
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="60%" />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="rectangular" height={80} />
              </Paper>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  }

  if (shouldFetchDetails && txDetailsResponse.isError) {
    if (txDetailsResponse.error?.status === 404) {
      const chainPrefix = chainPrefixFromId(chainId);
      const safeIdPart = `multisig_${safeAddress}_${txKey}`;
      const safeUrl = `https://app.safe.global/transactions/tx?safe=${chainPrefix}:${safeAddress}&id=${safeIdPart}`;
      return (
        <Accordion elevation={2}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{txKey}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography color="text.secondary">
                    No changeset found for transaction{" "}
                    <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                      {txKey}
                    </a>
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      );
    }
    return (
      <Paper sx={{ p: 2 }} variant="outlined">
        <Typography color="error">
          Error: {String(txDetailsResponse.error?.message || txDetailsResponse.error)}
        </Typography>
      </Paper>
    );
  }

  const safeOwners = owners || [];
  const isOwner = safeOwners.map((o) => o?.toLowerCase()).includes(curAccount);
  const alreadySigned = transaction.confirmations
    .map((c) => c.owner?.toLowerCase())
    .includes(curAccount?.toLowerCase());

  const signEnabled = !alreadySigned && isOwner;

  return (
    <Accordion elevation={2}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {txDetails?.description || "Multisig transaction"}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center">
              {transaction.safeTxHash && (
                <Tooltip title={transaction.safeTxHash}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontFamily: "monospace",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 200,
                    }}
                  >
                    {truncateMiddle(transaction.safeTxHash, 6)}
                  </Typography>
                </Tooltip>
              )}
              <Chip label={`Nonce ${transaction.nonce}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
            </Stack>
          </Box>

          {!readOnly && (
            <Box sx={{ ml: 1 }}>
              <WalletActionButton
                onClick={onConfirm}
                disabled={!signEnabled}
                style={{ marginBottom: "10px", width: "100%" }}
              >
                {isOwner ? "Approve" : "Switch to an owner account"}
              </WalletActionButton>
            </Box>
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ height: "100%", p: 2 }} variant="outlined">
              <Typography>
                Nonce: {transaction.nonce} <br />
                Confirmations: {`${transaction.confirmations?.length}/${transaction.confirmationsRequired}`} <br />
                Modified: {transaction.modified}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ height: "100%", width: "100%", p: 2 }} variant="outlined">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">Signers</Typography>
                </Grid>
                <Grid item xs={12} sx={{ margin: "0 10%" }}>
                  <Stack direction="column" spacing={1}>
                    {transaction.confirmations.length === 0 && <Typography>No signatures yet</Typography>}
                    {transaction.confirmations.map((signer) => (
                      <Address key={signer.owner} address={signer.owner} displayName={addressBook[signer.owner]} />
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <DetailsPanel
              txDetails={txDetails}
              safeTxHash={transaction.safeTxHash}
              chainId={chainId}
              safeAddress={safeAddress}
              txKey={txKey}
              addressBook={addressBook}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

export default TransactionCard;
