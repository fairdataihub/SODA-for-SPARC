import React from "react";
import { MantineProvider } from "@mantine/core";

const SodaComponentWrapper = ({ childrenComponents }) => {
  const theme = {};

  return <MantineProvider theme={theme}>{childrenComponents}</MantineProvider>;
};

export default SodaComponentWrapper;
