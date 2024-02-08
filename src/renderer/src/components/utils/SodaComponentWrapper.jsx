import React from "react";
import { MantineProvider } from "@mantine/core";

const SodaComponentWrapper = ({ children }) => {
  const theme = {};

  return <MantineProvider theme={theme}>{children}</MantineProvider>;
};

export default SodaComponentWrapper;
