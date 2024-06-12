import React from "react";
import { MantineProvider, createTheme } from "@mantine/core";

const theme = createTheme({
  colors: {
    SodaGreen: [
      "#13716d",
      "#13716d",
      "#13716d",
      "#13716d",
      "#13716d",
      "#13716d",

      "#13716d",
      "#13716d",
      "#13716d",
      "#13716d",
    ],
  },
  primaryColor: "SodaGreen",
});
const SodaComponentWrapper = ({ children }) => {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
};

export default SodaComponentWrapper;
