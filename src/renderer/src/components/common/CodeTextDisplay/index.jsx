import { Text } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";

const CodeTextDisplay = ({ text }) => (
  <FullWidthContainer bg="black" padding="md">
    <Text c="white">Pennsieve Agent Output:</Text>
    <Text c="white" style={{ whiteSpace: "pre-wrap" }}>
      {text}
    </Text>
  </FullWidthContainer>
);

export default CodeTextDisplay;
