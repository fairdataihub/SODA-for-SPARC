import React from "react";
import { MantineProvider, createTheme, Stack } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";

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
});

const SodaComponentWrapper = ({ children, layout }) => {
  const renderContent = () => {
    if (layout === "container") {
      console.log("Wrapping in container");
      return <FullWidthContainer fluid>{children}</FullWidthContainer>;
    } else if (layout === "stack") {
      console.log("Wrapping in stack");
      return <Stack>{children}</Stack>;
    } else {
      console.log("Not wrapping in anything");
      return children;
    }
  };

  return <MantineProvider theme={theme}>{renderContent()}</MantineProvider>;
};

export default SodaComponentWrapper;
