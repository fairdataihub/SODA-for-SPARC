import React from "react";
import { Container } from "@mantine/core";

const FullWidthContainer = ({ children, backgroundColor, margin, padding }) => {
  return (
    <Container
      p={padding || "0px"} /* Can be "xs", "sm", "md", "lg", "xl" */
      m={margin || "0px"} /* Can be "xs", "sm", "md", "lg", "xl" */
      style={{
        width: "100%",
        backgroundColor: backgroundColor,
      }}
    >
      {children}
    </Container>
  );
};

export default FullWidthContainer;
