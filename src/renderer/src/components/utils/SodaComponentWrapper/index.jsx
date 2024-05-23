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
