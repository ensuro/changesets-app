import React from "react";

import Grid from "@mui/material/Grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KEY_DELEGATES, addDelegate, getDelegates } from "./safe-api";
import { useSafe } from "./safe-ui";
import { Card, CardContent, TextField, Typography } from "@mui/material";
import Address from "./Address";
import { useWallet } from "./wallet";
import WalletActionButton from "./WalletActionButton";

import { ethers } from "ethers";

function DelegatesPage() {
  const safe = useSafe();
  const { curAccount, signer } = useWallet();

  const queryClient = useQueryClient();
  const delegatesResponse = useQuery({
    queryKey: [KEY_DELEGATES, safe.safeAddress],
    queryFn: async () => getDelegates(safe),
  });
  const addNewDelegate = useMutation({
    mutationFn: async () => addDelegate(safe, newDelegate, signer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY_DELEGATES, safe.safeAddress] });
    },
    onSettled: (data, error) => {
      if (error) console.error("addNewDelegate failed", error);
    },
  });

  const [newDelegate, setNewDelegate] = React.useState({ address: "", name: "" });

  if (delegatesResponse.isPending) return <div>Loading...</div>;
  if (delegatesResponse.isError) return <div>Error: {delegatesResponse.error.message}</div>;

  const isOwner = safe.owners.map((o) => o?.toLowerCase()).includes(curAccount);

  const isValid =
    ethers.isAddress(newDelegate.address) &&
    newDelegate.name.length > 0 &&
    delegatesResponse.data.every((d) => d.delegate.toLowerCase() !== newDelegate.address.toLowerCase());

  const addEnabled = isOwner && isValid;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            {delegatesResponse.data.map((delegate) => (
              <Address address={delegate.delegate} displayName={delegate.label} key={delegate.delegate} />
            ))}
            {delegatesResponse.data.length === 0 && (
              <Grid item xs={12}>
                <Typography variant="body2">No delegates</Typography>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6">Grant Delegate Access</Typography>
            <form>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Address"
                    fullWidth
                    onChange={(e) => setNewDelegate({ ...newDelegate, address: e.target.value })}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Name"
                    fullWidth
                    onChange={(e) => setNewDelegate({ ...newDelegate, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={2}>
                  <WalletActionButton disabled={!addEnabled} onClick={addNewDelegate.mutate}>
                    Grant Access
                  </WalletActionButton>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default DelegatesPage;
