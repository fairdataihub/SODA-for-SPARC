import { Text, Stack, Button, Group, Container } from "@mantine/core";
import ExternalLink from "../../buttons/ExternalLink";
import CodeTextDisplay from "../../common/CodeTextDisplay";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModeSection from "../../containers/GuidedModeSection";

const PennsieveAgentStatus = () => {
  const pennsieveAgentInstalled = useGlobalStore((state) => state.pennsieveAgentInstalled);
  const pennsieveAgentUpToDate = useGlobalStore((state) => state.pennsieveAgentUpToDate);
  const pennsieveAgentDownloadURL = useGlobalStore((state) => state.pennsieveAgentDownloadURL);
  const pennsieveAgentErrorMessage = useGlobalStore((state) => state.pennsieveAgentErrorMessage);

  if (!pennsieveAgentInstalled) {
    return (
      <Stack>
        <Text>Pennsieve Agent not installed</Text>
        <ExternalLink
          href={pennsieveAgentDownloadURL}
          buttonText="Download the Pennsieve Agent"
          buttonType="button"
        />
      </Stack>
    );
  }

  if (pennsieveAgentErrorMessage) {
    return (
      <Container>
        <Text>Pennsieve Agent error</Text>
        <CodeTextDisplay text={pennsieveAgentErrorMessage} />
      </Container>
    );
  }

  if (!pennsieveAgentUpToDate) {
    return (
      <Stack>
        <Text>Pennsieve Agent out of date</Text>
        <ExternalLink href={pennsieveAgentDownloadURL} buttonText="Download" buttonType="button" />
      </Stack>
    );
  }

  return <Text>Installed</Text>;
};

export default PennsieveAgentStatus;
