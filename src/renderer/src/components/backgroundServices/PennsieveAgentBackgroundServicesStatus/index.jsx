import { Text, Stack, Button, Group, Container, Center, Alert, Loader } from "@mantine/core";
import { IconBroadcastOff, IconTool, IconAlertCircle, IconRocket } from "@tabler/icons-react";
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
      Retry Pennsieve Agent check
    </Button>
  );
};

const KnownPennsieveAgentOutputErrorHelper = ({ pennsieveAgentErrorMessage }) => {
  const knownErrorMessages = [
    "UNIQUE constraint failed:",
    "NotAuthorizedException: Incorrect username or password.",
    "401 Error Creating new UserSettings",
  ];
  return <Text>{knownErrorMessages.includes(pennsieveAgentErrorMessage) && "Known error"}</Text>;
};
const PennsieveAgentBackgroundServicesStatus = () => {
  const {
    pennsieveAgentInstalled,
    pennsieveAgentUpToDate,
    pennsieveAgentDownloadURL,
    pennsieveAgentOutputErrorMessage,
    backgroundServicesChecksInProgress,
    backgroundServicesError,
  } = useGlobalStore((state) => ({
    pennsieveAgentInstalled: state.pennsieveAgentInstalled,
    pennsieveAgentUpToDate: state.pennsieveAgentUpToDate,
    pennsieveAgentDownloadURL: state.pennsieveAgentDownloadURL,
    pennsieveAgentOutputErrorMessage: state.pennsieveAgentOutputErrorMessage,
    backgroundServicesChecksInProgress: state.backgroundServicesChecksInProgress,
    backgroundServicesError: state.backgroundServicesError,
  }));

  /* Display a loading div while the background checks are being performed */
  if (backgroundServicesChecksInProgress) {
    return (
      <Stack mt="sm" align="center">
        <Text size="lg" fw={700}>
          Ensuring you are ready to upload to Pennsieve
        </Text>
        <Loader color="orange" type="bars" />
      </Stack>
    );
  }

  /* The backgroundServicesError is true when a non-agent issue occurs such as no internet */
  if (backgroundServicesError) {
    return (
      <Stack mt="sm" align="center">
        <Alert
          variant="light"
          color="blue"
          title={backgroundServicesError.title}
          icon={<IconAlertCircle />}
        >
          {backgroundServicesError.message}
        </Alert>
        <RetryElement />
      </Stack>
    );
  }

  if (!pennsieveAgentInstalled) {
    return (
      <Stack mt="sm" align="center">
        <Alert
          variant="light"
          color="blue"
          title="You do not have the Pennsieve Agent installed"
          icon={<IconTool />}
        >
          please download and install the Pennsieve Agent. Once the Pennsieve Agent is installed,
          click the button below to ensure it is installed properly.
          <ExternalLink
            href={pennsieveAgentDownloadURL}
            buttonText="Download the Pennsieve Agent"
            buttonType="button"
          />
        </Alert>
        <RetryElement />
      </Stack>
    );
  }

  if (pennsieveAgentOutputErrorMessage) {
    return (
      <Stack mt="sm" align="center">
        <Alert
          variant="light"
          color="blue"
          title="An error occurred while starting the Pennsieve Agent"
          icon={<IconAlertCircle />}
          style={{ width: "100%" }}
        >
          <Text my="sm">
            An internet connection is required to upload to pennsieve. Please connect to the
            internet and click the try again button below.
          </Text>
          <CodeTextDisplay text={pennsieveAgentOutputErrorMessage} />
          <KnownPennsieveAgentOutputErrorHelper
            pennsieveAgentErrorMessage={pennsieveAgentOutputErrorMessage}
          />
        </Alert>
        <RetryElement />
      </Stack>
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

  return (
    <Stack mt="sm" align="center">
      <Text size="lg" fw={700}>
        The Pennsieve Agent is running and ready to upload
      </Text>
      <IconRocket />
    </Stack>
  );
};

export default PennsieveAgentBackgroundServicesStatus;
