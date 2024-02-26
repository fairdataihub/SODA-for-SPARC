import React from "react";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

const SodaComponentWrapper = ({ children }) => {
  const theme = {};

  return <MantineProvider theme={theme}>{children}</MantineProvider>;
};

export default SodaComponentWrapper;
