import * as React from "react";
import Title from "./Title";
import { Card, Typography } from "@mui/material";

export default function SafeSummary({ address }) {
  return (
    <Card>
      <Title>Safe wallet</Title>
      <Typography>{"Address is " + address}</Typography>
    </Card>
  );
}
