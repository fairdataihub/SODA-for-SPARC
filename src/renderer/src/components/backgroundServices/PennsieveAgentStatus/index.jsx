import { Text, Stack, Button, Group, Container, Center } from "@mantine/core";
import ExternalLink from "../../buttons/ExternalLink";
import CodeTextDisplay from "../../common/CodeTextDisplay";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModeSection from "../../containers/GuidedModeSection";
import FullWidthContainer from "../../containers/FullWidthContainer";

const RetryElement = () => {
  return (
    <Button
      onClick={async () => {
        await window.checkPennsieveBackgroundServices();
      }}
    >
      Retry
    </Button>
  );
};
const PennsieveAgentStatus = () => {
  const {
    pennsieveAgentInstalled,
    pennsieveAgentUpToDate,
    pennsieveAgentDownloadURL,
    pennsieveAgentErrorMessage,
    pennsieveAgentRunning,
  } = useGlobalStore((state) => ({
    pennsieveAgentInstalled: state.pennsieveAgentInstalled,
    pennsieveAgentUpToDate: state.pennsieveAgentUpToDate,
    pennsieveAgentDownloadURL: state.pennsieveAgentDownloadURL,
    pennsieveAgentErrorMessage: state.pennsieveAgentErrorMessage,
    pennsieveAgentRunning: state.pennsieveAgentRunning,
  }));

  if (!pennsieveAgentInstalled) {
    return (
      <Stack>
        <Text>Pennsieve Agent not installed</Text>
        <ExternalLink
          href={pennsieveAgentDownloadURL}
          buttonText="Download the Pennsieve Agent"
          buttonType="button"
        />
        <Text>Once installed, click the button below to start the Pennsieve Agent</Text>
        <Button
          onClick={async () => {
            await window.checkPennsieveBackgroundServices();
          }}
        >
          Start Pennsieve Agent
        </Button>
      </Stack>
    );
  }

  if (pennsieveAgentErrorMessage) {
    return (
      <FullWidthContainer>
        <Text>An error occurred while starting the Pennsieve agent.</Text>
        <CodeTextDisplay text={pennsieveAgentErrorMessage} />
        <Stack mt="sm" align="center">
          Please check the Pennsieve Agent logs for more information. Once you have resolved the
          issue, click the button below.
          <RetryElement />
        </Stack>
      </FullWidthContainer>
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
