import React from "react";
import { Stack } from "@mantine/core";

const FullWidthStack = ({ children }) => {
  return (
    <Stack spacing="md" align="center" justify="center" style={{ width: "100%" }}>
      {children}
    </Stack>
  );
};

export default FullWidthStack;
