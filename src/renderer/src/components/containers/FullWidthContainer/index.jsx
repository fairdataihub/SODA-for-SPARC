import React from "react";
import { Container } from "@mantine/core";

const FullWidthContainer = ({ children, backgroundColor, margin, padding }) => {
  return (
    <Container
      p={padding} /* Can be "xs", "sm", "md", "lg", "xl" */
      m={margin} /* Can be "xs", "sm", "md", "lg", "xl" */
      style={{
        width: "100%",
        backgroundColor: backgroundColor || "palegoldenrod",
      }}
    >
      {children}
    </Container>
  );
};

export default FullWidthContainer;
