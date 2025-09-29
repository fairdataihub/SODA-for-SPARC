import React from "react";
import { Paper } from "@mantine/core";

const SodaPaper = ({ children }) => {
  return (
    <Paper shadow="sm" radius="md" p="md" withBorder mb="md" w="100%">
      {children}
    </Paper>
  );
};

export default SodaPaper;
