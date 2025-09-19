import React from "react";
import { MantineProvider, createTheme, Stack } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";
import { Tooltip } from "bootstrap";
import { root } from "postcss";

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
  // primaryColor: "SodaGreen",
  fontSizes: {
    xs: "0.8rem",
    sm: "0.9rem",
    md: "1rem", // (default)
    lg: "1.2rem",
    xl: "1.4rem",
  },
  components: {
    Tooltip: {
      styles: {
        root: {
          zIndex: 2999,
        },
      },
    },
    TextInput: {
      styles: {
        error: {
          color: "red",
        },
      },
    },
  },
});

const SodaComponentWrapper = ({ children }) => {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
};

export default SodaComponentWrapper;
