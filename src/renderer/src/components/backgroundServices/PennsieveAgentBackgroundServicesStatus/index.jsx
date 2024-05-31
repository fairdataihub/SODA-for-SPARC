import { Text, Stack, Button, Group, Container, Center, Alert, Loader } from "@mantine/core";
import { IconBroadcastOff, IconTool, IconAlertCircle, IconRocket } from "@tabler/icons-react";
import ExternalLink from "../../buttons/ExternalLink";
import CodeTextDisplay from "../../common/CodeTextDisplay";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModeSection from "../../containers/GuidedModeSection";
import FullWidthContainer from "../../containers/FullWidthContainer";

const retryButtonText = "Retry Pennsieve Agent check";

const RetryElement = () => {
  return (
    <Button
      onClick={async () => {
        await window.checkPennsieveBackgroundServices();
      }}
    >
      {retryButtonText}
    </Button>
  );
};

const KnownIssueFixerDisplay = () => {
  return (
    <Stack mt="sm" align="center">
      <Text size="xl" fw={700}>
        asdf
      </Text>
      <Button>asdf</Button>
    </Stack>
  );
};

const PennsieveAgentErrorMessageDisplay = ({ pennsieveAgentErrorMessage }) => {
  const knownErrorMessages = [
    "UNIQUE constraint failed:",
    "NotAuthorizedException: Incorrect username or password.",
    "401 Error Creating new UserSettings",
  ];
  const isKnownError = knownErrorMessages.some((message) =>
    pennsieveAgentErrorMessage.includes(message)
  );
  return (
    <Stack mt="sm" align="center">
      <Alert
        variant="light"
        color="blue"
        title={
          isKnownError
            ? "A known error occured while starting the Pennsieve agent"
            : "The Pennsieve Agent failed to start"
        }
        icon={<IconAlertCircle />}
        style={{ width: "100%" }}
      >
        <CodeTextDisplay text={pennsieveAgentErrorMessage} />

        {isKnownError ? (
          <Stack mt="sm" align="center">
            <Text>
              This is a known issue that can be fixed by following the instructions below. After
              troubleshooting, click the {retryButtonText} button to check if the issue has been
              resolved.
            </Text>
            <KnownIssueFixerDisplay />
          </Stack>
        ) : (
          <Text my="sm">
            Please view the
            <ExternalLink
              href="https://docs.sodaforsparc.io/docs/common-errors/trouble-starting-the-pennsieve-agent-in-soda"
              buttonText="SODA documentation"
              buttonType="inline"
            />
            to troubleshoot this issue. After troubleshooting, click the {retryButtonText}
            button to check if the issue has been resolved.
          </Text>
        )}
        {isKnownError && <KnownIssueFixerDisplay />}
      </Alert>
      <RetryElement />
    </Stack>
  );
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
        <Text size="xl" fw={700}>
          Ensuring the Pennsieve Agent is running
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
          title="Pennsieve Agent not installed"
          icon={<IconTool />}
        >
          Please download and install the Pennsieve Agent by clicking the button below. After
          installing the agent, click the {retryButtonText} button to ensure the agent was installed
          properly.
          <br />
          <br />
          <ExternalLink
            href={pennsieveAgentDownloadURL}
            buttonText="Download the Pennsieve Agent here"
            buttonType="button"
            buttonSize="md"
          />
        </Alert>
        <RetryElement />
      </Stack>
    );
  }

  if (pennsieveAgentOutputErrorMessage) {
    return (
      <PennsieveAgentErrorMessageDisplay
        pennsieveAgentErrorMessage={pennsieveAgentOutputErrorMessage}
      />
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
      <Text size="xl" fw={700}>
        The Pennsieve Agent is running and ready to upload!
      </Text>
      <Text size="lg" fw={600}>
        Click the "Save and Continue" button below to start uploading your data to Pennsieve.
      </Text>
    </Stack>
  );
};

export default PennsieveAgentBackgroundServicesStatus;
