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
  fontSizes: {
    xs: "0.8rem",
    sm: "0.9rem",
    md: "1rem", // (default)
    lg: "1.2rem",
    xl: "1.4rem",
  },
  components: {
    Alert: {
      defaultProps: {
        color: "SodaGreen",
        title: "SODA Alert",
      },
      styles(theme) {
        return {
          title: {
            fontSize: "1.1rem",
          },
        };
      },
    },
  },
});

const SodaComponentWrapper = ({ children }) => {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
};

export default SodaComponentWrapper;
