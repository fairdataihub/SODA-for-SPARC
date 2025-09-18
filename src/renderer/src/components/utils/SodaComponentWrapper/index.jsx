import React from "react";
import { MantineProvider, createTheme, Stack } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";
import { Tooltip } from "bootstrap";
import { root } from "postcss";

const theme = createTheme({
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
