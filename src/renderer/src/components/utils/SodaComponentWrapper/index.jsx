import React from "react";
import { MantineProvider } from "@mantine/core";
import { shadcnCssVariableResolver } from "./cssVariableResolver.ts";
import { shadcnTheme } from "./theme.ts";
import { createTheme } from "@mantine/core";
import "./style.css";

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
  return (
    <MantineProvider
      theme={shadcnTheme}
      cssVariablesResolver={shadcnCssVariableResolver}
      forceColorScheme="light"
    >
      {children}
    </MantineProvider>
  );
};

export default SodaComponentWrapper;
