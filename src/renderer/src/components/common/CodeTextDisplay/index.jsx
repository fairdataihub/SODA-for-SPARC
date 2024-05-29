import { Text } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";

const CodeTextDisplay = ({ text }) => (
  <FullWidthContainer backgroundColor="black" padding="sm">
    <Text c="white">Pennsieve Agent Output:</Text>
    <Text c="white">{text}</Text>
  </FullWidthContainer>
);

export default CodeTextDisplay;
