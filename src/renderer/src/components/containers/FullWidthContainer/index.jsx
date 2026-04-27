import React from "react";
import { Container } from "@mantine/core";

const FullWidthContainer = ({ children, bg, margin, padding, id }) => {
  return (
    <Container
      id={id}
      p={padding || "0px"} /* Can be "xs", "sm", "md", "lg", "xl" */
      m={margin || "0px"} /* Can be "xs", "sm", "md", "lg", "xl" */
      style={{
        width: "100%",
      }}
      bg={bg}
    >
      {children}
    </Container>
  );
};

export default FullWidthContainer;
