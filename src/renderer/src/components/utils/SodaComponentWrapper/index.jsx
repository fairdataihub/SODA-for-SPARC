import React from "react";
import { MantineProvider, createTheme } from "@mantine/core";

const theme = createTheme({});

const SodaComponentWrapper = ({ children }) => {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
};

export default SodaComponentWrapper;
