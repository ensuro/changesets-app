import React from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LaunchIcon from "@mui/icons-material/Launch";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Paper,
  Stack,
  Typography,
  Skeleton,
  Box,
  Chip,
  Button,
  Collapse,
} from "@mui/material";

import { useQuery } from "@tanstack/react-query";

import { KEY_TRANSACTION_DETAILS, KEY_ADDRESS_BOOK, getAddressBook, getTransactionDetails } from "./safe-api";
import { chainPrefixFromId } from "./chain-utils";
import Address from "./Address";
import { useWallet } from "./wallet";
import { useSafe } from "./safe-ui";
import WalletActionButton from "./WalletActionButton";

function truncateMiddle(str, visible = 6) {
  if (!str) return "";
  if (str.length <= visible * 2 + 3) return str;
  return `${str.slice(0, visible)}…${str.slice(-visible)}`;
}

function isHexAddress(v) {
  return typeof v === "string" && /^0x[a-fA-F0-9]{40}$/.test(v);
}

function safeJsonStringify(v, space = 2) {
  try {
    return JSON.stringify(v, null, space);
  } catch {
    return String(v);
  }
}

function normalizeArgItems(args) {
  if (args == null) return [];

  if (Array.isArray(args)) {
    return args.map((a, i) => {
      if (a && typeof a === "object" && !Array.isArray(a)) {
        const name = a.name ?? a.argName ?? a.key ?? null;
        const type = a.type ?? a.argType ?? a.kind ?? null;
        const value = a.value !== undefined ? a.value : a;
        return { name, type, value, index: i };
      }
      return { name: null, type: null, value: a, index: i };
    });
  }

  if (typeof args === "object") {
    return Object.entries(args).map(([k, v], i) => ({ name: k, type: null, value: v, index: i }));
  }

  return [{ name: null, type: null, value: args, index: 0 }];
}

function pickTransformPayload(obj, key) {
  if (!obj || typeof obj !== "object") return null;
  if (obj[key] !== undefined) return obj[key];
  if (obj.type === key) {
    if (obj.value !== undefined) return obj.value;
    if (obj[key] !== undefined) return obj[key];
    return obj;
  }
  return null;
}

function buildChangesetTransforms({ addresses, addressBook }) {
  const getAddressFromKeyOrAddress = (value) => {
    const resolved = addresses?.[value] || value;
    if (isHexAddress(resolved)) {
      return { kind: "address", value: resolved, displayName: addressBook?.[resolved] };
    }
    return { kind: "text", value: resolved };
  };

  const getRole = (value) => {
    if (value && typeof value === "object") {
      const role = value.role ?? value.key ?? value.value ?? value.name ?? value.id;
      return { kind: "text", value: role != null ? String(role) : safeJsonStringify(value, 0) };
    }
    return { kind: "text", value: String(value) };
  };

  const getComponentRole = (value) => {
    if (value && typeof value === "object") {
      const component = value.component ?? value.address_key ?? value.addressKey ?? value.addr ?? value.address;
      const role = value.role ?? value.key ?? value.value ?? value.name ?? value.id;
      const comp = component != null ? getAddressFromKeyOrAddress(component) : null;
      const roleTxt = role != null ? String(role) : "";
      if (comp?.kind === "address") return { kind: "text", value: `${comp.value}:${roleTxt}` };
      return { kind: "text", value: `${String(component)}:${roleTxt}` };
    }
    return { kind: "text", value: safeJsonStringify(value, 0) };
  };

  const getEnumValue = (value) => {
    if (value && typeof value === "object") {
      const enumName = value.enum || value.name || value.type;
      const key = value.key ?? value.value ?? value.id ?? value.label;
      if (enumName && key != null) return { kind: "text", value: `${enumName}.${String(key)}` };
      if (key != null) return { kind: "text", value: String(key) };
      return { kind: "text", value: safeJsonStringify(value, 0) };
    }
    return { kind: "text", value: String(value) };
  };

  return {
    address_key: (value) => getAddressFromKeyOrAddress(value),
    role: (value) => getRole(value),
    component_role: (value) => getComponentRole(value),
    enum: (value) => getEnumValue(value),
  };
}

function transformValue(value, transforms) {
  if (value == null) return { kind: "text", value: "" };

  if (Array.isArray(value)) {
    return { kind: "list", value: value.map((v) => transformValue(v, transforms)) };
  }

  if (typeof value === "object") {
    for (const k of Object.keys(transforms)) {
      const payload = pickTransformPayload(value, k);
      if (payload !== null) return transforms[k](payload);
    }
    return { kind: "json", value };
  }

  if (isHexAddress(value)) return { kind: "address", value };
  return { kind: "text", value: String(value) };
}

function renderTransformedValue(v) {
  if (!v) return null;

  if (v.kind === "address") {
    return <Address address={v.value} displayName={v.displayName} />;
  }

  if (v.kind === "list") {
    const items = Array.isArray(v.value) ? v.value : [];
    return (
      <Stack spacing={0.5} sx={{ mt: 0.25 }}>
        {items.map((it, idx) => (
          <Box key={idx}>{renderTransformedValue(it)}</Box>
        ))}
      </Stack>
    );
  }

  if (v.kind === "json") {
    return (
      <Typography
        component="span"
        variant="caption"
        sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {safeJsonStringify(v.value, 2)}
      </Typography>
    );
  }

  return (
    <Typography
      component="span"
      variant="caption"
      sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
    >
      {String(v.value)}
    </Typography>
  );
}

function argTypeFromParsed(item) {
  if (!item || typeof item !== "object") return null;

  if (item.type && typeof item.type === "string") return item.type;

  if (item.enum) return item.enum;
  if (item.type === "enum" && item.enum) return item.enum;

  if (item.address_key != null || item.type === "address_key") return "address";
  if (item.component_role != null || item.type === "component_role") return "component_role";
  if (item.role != null || item.type === "role") return "role";

  return null;
}

function methodSignature(methodName, argItems) {
  if (!methodName) return null;

  const types = argItems
    .map((a) => {
      if (!a) return null;

      if (a.type) {
        if (a.type === "address_key") return "address";
        if (a.type === "enum") {
          const v = a.value;
          if (v && typeof v === "object") return v.enum || v.name || "enum";
          return "enum";
        }
        return a.type;
      }

      const inferred = argTypeFromParsed(a.value);
      return inferred || null;
    })
    .filter(Boolean);

  return `${methodName}(${types.join(", ")})`;
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
      let method = null;
      if (args && typeof args === "object") {
        method =
          args.method ||
          args.function ||
          args.fn ||
          args.name ||
          args.selector ||
          args.signature ||
          args.contractMethod ||
          args.contract_method ||
          null;
      }

      return {
        id: `batch-${index}`,
        title: `Call #${index + 1}`,
        to: target,
        value,
        token: null,
        summary: payload ? `Calldata: ${truncateMiddle(payload, 10)}` : null,
        rawArgs: args,
        method,
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

function StepItem({ index, step, addressBook, addresses }) {
  const title = step.title || step.name || step.action || `Step ${index + 1}`;
  const to = step.to || step.recipient || step.target || null;
  const value = step.value ?? step.amount ?? null;
  const token = step.token || step.tokenSymbol || step.asset || null;
  const summary = step.summary || step.description || null;
  const displayName = to && addressBook ? addressBook[to] : undefined;

  const methodName =
    step.method ||
    step.function ||
    step.functionName ||
    step.selector ||
    step.signature ||
    step.contractMethod ||
    step.contract_method ||
    (step.rawArgs && typeof step.rawArgs === "object"
      ? step.rawArgs.method ||
        step.rawArgs.function ||
        step.rawArgs.fn ||
        step.rawArgs.name ||
        step.rawArgs.selector ||
        step.rawArgs.signature
      : null);

  const argsRaw =
    step.rawArgs ?? step.args ?? step.parameters ?? step.params ?? step.contractArgs ?? step.contract_args ?? null;

  const parsedArgs = step.parsedArguments || step.parsed_args || null;

  const contractAddressKey = step.contract_address_key || step.contractAddressKey || null;
  const contractType = step.contract_type || step.contractType || null;

  const contractTarget = (step.contract && step.contract.target) || step.contract_target || null;
  const resolvedContractAddress =
    contractTarget || (contractAddressKey && addresses && addresses[contractAddressKey]) || null;
  const resolvedContractName =
    resolvedContractAddress && addressBook ? addressBook[resolvedContractAddress] : undefined;

  const argItems = normalizeArgItems(parsedArgs ?? argsRaw);
  const transforms = React.useMemo(
    () => buildChangesetTransforms({ addresses, addressBook }),
    [addresses, addressBook]
  );
  const signature = methodSignature(methodName, argItems);

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

            {contractAddressKey && (
              <Typography variant="caption" color="text.secondary">
                Contract key:{" "}
                <Typography component="span" variant="caption" sx={{ fontFamily: "monospace" }}>
                  {contractAddressKey}
                  {contractType ? ` (${contractType})` : ""}
                </Typography>
              </Typography>
            )}

            {resolvedContractAddress && (
              <Typography variant="caption" color="text.secondary">
                Contract addr: <Address address={resolvedContractAddress} displayName={resolvedContractName} />
              </Typography>
            )}

            {signature && (
              <Typography variant="caption" color="text.secondary">
                Method:{" "}
                <Typography component="span" variant="caption" sx={{ fontFamily: "monospace" }}>
                  {signature}
                </Typography>
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

            {argItems.length > 0 && (
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Arguments:
                </Typography>

                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {argItems.map((a) => {
                    const label = a.name
                      ? `${a.name}${a.type ? ` (${a.type})` : ""}`
                      : a.type
                      ? a.type
                      : `arg${a.index}`;
                    const tv = transformValue(a.value, transforms);
                    return (
                      <Stack
                        key={`${a.index}-${label}`}
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                        sx={{ flexWrap: "wrap" }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ minWidth: 140, fontFamily: "monospace" }}
                        >
                          {label}:
                        </Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>{renderTransformedValue(tv)}</Box>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {parsedArgs == null && argsRaw != null && (
              <Box
                component="pre"
                sx={{
                  mt: 0.75,
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderRadius: 1,
                  p: 1,
                }}
              >
                {typeof argsRaw === "string" ? argsRaw : safeJsonStringify(argsRaw, 2)}
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

function DetailsPanel({ txDetails, transaction, safeTxHash, chainId, safeAddress, txKey, addressBook }) {
  const [showYaml, setShowYaml] = React.useState(false);
  const [showJson, setShowJson] = React.useState(false);

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

  const rawYaml = txDetails?.original_yaml || "";
  const rawJson = JSON.stringify(txDetails || {}, null, 2);

  const showTxMeta = Boolean(transaction);

  const confirmationsCount = transaction?.confirmations?.length ?? 0;
  const confirmationsRequired = transaction?.confirmationsRequired ?? null;

  const signers = Array.isArray(transaction?.confirmations) ? transaction.confirmations : [];

  return (
    <Paper variant="outlined" sx={{ p: 2, mx: "auto" }}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.6, fontWeight: 600 }}>
        Transaction details
      </Typography>

      <Stack spacing={0.5} sx={{ mb: 1.5, mt: 0.5 }}>
        {showTxMeta && (
          <>
            <Typography variant="caption" color="text.secondary">
              Nonce:{" "}
              <Typography component="span" variant="caption" sx={{ fontFamily: "monospace" }}>
                {transaction.nonce}
              </Typography>
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Confirmations:{" "}
              <Typography component="span" variant="caption" sx={{ fontFamily: "monospace" }}>
                {confirmationsRequired != null
                  ? `${confirmationsCount}/${confirmationsRequired}`
                  : String(confirmationsCount)}
              </Typography>
            </Typography>

            {transaction.modified && (
              <Typography variant="caption" color="text.secondary">
                Modified:{" "}
                <Typography component="span" variant="caption" sx={{ fontFamily: "monospace" }}>
                  {transaction.modified}
                </Typography>
              </Typography>
            )}
          </>
        )}

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
              Timelock: delay:{" "}
              <Typography component="span" variant="caption" sx={{ fontFamily: "monospace" }}>
                {String(timelock.delay)}
              </Typography>
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

        {showTxMeta && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Signers:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
              {signers.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  No signatures yet
                </Typography>
              )}
              {signers.map((signer) => (
                <Address key={signer.owner} address={signer.owner} displayName={addressBook[signer.owner]} />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>

      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.6, fontWeight: 600 }}>
        Steps
      </Typography>

      {steps.length ? (
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          {steps.map((step, index) => (
            <StepItem
              key={step.id || index}
              index={index}
              step={step}
              addressBook={addressBook}
              addresses={txDetails?.addresses}
            />
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

        <Stack direction="row" spacing={1}>
          <Button size="small" variant={showYaml ? "contained" : "outlined"} onClick={() => setShowYaml((v) => !v)}>
            YAML
          </Button>
          <Button size="small" variant={showJson ? "contained" : "outlined"} onClick={() => setShowJson((v) => !v)}>
            JSON
          </Button>
        </Stack>
      </Stack>

      <Collapse in={showYaml} unmountOnExit>
        <Box
          component="pre"
          sx={{
            mt: 1,
            fontSize: "0.75rem",
            backgroundColor: "rgba(255,255,255,0.02)",
            borderRadius: 1,
            p: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "monospace",
          }}
        >
          {rawYaml}
        </Box>
      </Collapse>

      <Collapse in={showJson} unmountOnExit>
        <Box
          component="pre"
          sx={{
            mt: 1,
            fontSize: "0.75rem",
            backgroundColor: "rgba(255,255,255,0.02)",
            borderRadius: 1,
            p: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "monospace",
          }}
        >
          {rawJson}
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
    retry: (failureCount, err) => {
      if (readOnly && err?.status === 404) return false;
      return failureCount < 1;
    },
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

  const handleApproveClick = React.useCallback(
    (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (onConfirm) onConfirm();
    },
    [onConfirm]
  );

  if (!hasTransaction || variant === "panel") {
    if (!txDetails) return null;
    return (
      <DetailsPanel
        txDetails={txDetails}
        transaction={transaction}
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
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="60%" />
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="rectangular" height={120} sx={{ mt: 1 }} />
            </Paper>
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  }

  if (shouldFetchDetails && txDetailsResponse.isError) {
    if (txDetailsResponse.error?.status === 404) {
      const chainPrefix = chainPrefixFromId(chainId);
      const safeIdPart = `multisig_${safeAddress}_${transaction.safeTxHash}`;
      const safeUrl = `https://app.safe.global/transactions/tx?safe=${chainPrefix}:${safeAddress}&id=${safeIdPart}`;
      return (
        <Accordion elevation={2}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{txKey}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography color="text.secondary">
                No changeset found for transaction{" "}
                <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                  {transaction.safeTxHash || txKey}
                </a>
              </Typography>
            </Paper>
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
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                >
                  {transaction.safeTxHash}
                </Typography>
              )}
              <Chip label={`Nonce ${transaction.nonce}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
            </Stack>
          </Box>

          {!readOnly && (
            <Box sx={{ ml: 1 }}>
              <WalletActionButton
                onClick={handleApproveClick}
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
        <DetailsPanel
          txDetails={txDetails}
          transaction={transaction}
          safeTxHash={transaction.safeTxHash}
          chainId={chainId}
          safeAddress={safeAddress}
          txKey={txKey}
          addressBook={addressBook}
        />
      </AccordionDetails>
    </Accordion>
  );
}

export default TransactionCard;
