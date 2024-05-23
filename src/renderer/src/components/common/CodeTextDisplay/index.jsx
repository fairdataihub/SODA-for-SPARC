import { Text, Container } from "@mantine/core";

const CodeTextDisplay = ({ text }) => (
  <Container fluid style={{ backgroundColor: "black" }}>
    <Text c="white">{text}</Text>
  </Container>
);

export default CodeTextDisplay;
