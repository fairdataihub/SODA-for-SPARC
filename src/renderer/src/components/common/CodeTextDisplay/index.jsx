import { Text } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";

const CodeTextDisplay = ({ text }) => (
  <FullWidthContainer backgroundColor="black" padding="sm">
    <Text c="red">{text}</Text>
  </FullWidthContainer>
);

export default CodeTextDisplay;
