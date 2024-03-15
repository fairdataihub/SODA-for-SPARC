import React from "react";
import { MantineProvider, createTheme } from "@mantine/core";

const theme = createTheme({
  colors: {
    SodaGreen: [
      "#EEFCFB",
      "#DDF6F6",
      "#B6EFEC",
      "#8DE7E2",
      "#6EDFDA",
      "#5CDCD5",
      "#51DAD2",
      "#42C0BA",
      "#34ABA5",
      "#19948F",
    ],
  },
  primaryColor: "SodaGreen",
});
const SodaComponentWrapper = ({ children }) => {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
};

export default SodaComponentWrapper;
