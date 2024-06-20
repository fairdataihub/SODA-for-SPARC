import { Text, Stack, Group, Button, Alert, Loader, Center } from "@mantine/core";
import { IconTool, IconAlertCircle, IconCheck } from "@tabler/icons-react";
import ExternalLink from "../../buttons/ExternalLink";
import CodeTextDisplay from "../../common/CodeTextDisplay";
import useGlobalStore from "../../../stores/globalStore";

// Constants
const RETRY_BUTTON_TEXT = "Retry Pennsieve Agent check";
const KNOWN_ERROR_MESSAGES = [
  "UNIQUE constraint failed:",
  "NotAuthorizedException: Incorrect username or password.",
  "401 Error Creating new UserSettings",
];

// Utility Functions
const deletePennsieveAgentDBFilesAndRestart = async () => {
  const filesToDelete = [
    "/.pennsieve/pennsieve_agent.db",
    "/.pennsieve/pennsieve_agent.db-shm",
    "/.pennsieve/pennsieve_agent.db-wal",
  ];

  for (const file of filesToDelete) {
    const filePath = `${window.homeDirectory}${file}`;
    if (window.fs.existsSync(filePath)) {
      await window.fs.unlink(filePath);
    }
  }

  await window.checkPennsieveAgent();
};

const RetryButton = () => <Button onClick={window.checkPennsieveAgent}>{RETRY_BUTTON_TEXT}</Button>;

const PennsieveAgentErrorMessageDisplay = ({ errorMessage }) => {
  const isKnownError = KNOWN_ERROR_MESSAGES.some((msg) => errorMessage.includes(msg));

  return (
    <Stack mt="sm" align="center">
      <Alert
        variant="light"
        color="blue"
        title="An error occurred while starting the Pennsieve Agent"
        icon={<IconAlertCircle />}
        style={{ width: "100%" }}
      >
        <CodeTextDisplay text={errorMessage} />
        <Stack mt="sm" align="center">
          {isKnownError ? (
            <>
              <Text>
                This is a known issue with the Pennsieve Agent. It can typically be resolved by
                deleting the local Pennsieve Agent database files. Would you like SODA to do this
                and restart the Agent?
              </Text>
              <Group justify="center" mt="sm">
                <Button onClick={deletePennsieveAgentDBFilesAndRestart}>
                  Have SODA try to fix the issue
                </Button>
                <RetryButton />
              </Group>
            </>
          ) : (
            <>
              <Text my="sm">
                Please view the
                <ExternalLink
                  href="https://docs.sodaforsparc.io/docs/common-errors/trouble-starting-the-pennsieve-agent-in-soda"
                  buttonText="SODA documentation"
                  buttonType="anchor"
                />
                to troubleshoot this issue. After troubleshooting, click the {RETRY_BUTTON_TEXT}{" "}
                button to check if the issue has been resolved.
              </Text>
              <Center mt="sm">
                <RetryButton />
              </Center>
            </>
          )}
        </Stack>
      </Alert>
    </Stack>
  );
};

const PennsieveAgentCheckDisplay = () => {
  const {
    pennsieveAgentInstalled,
    pennsieveAgentUpToDate,
    pennsieveAgentDownloadURL,
    pennsieveAgentOutputErrorMessage,
    pennsieveAgentCheckInProgress,
    pennsieveAgentCheckError,
    usersPennsieveAgentVersion,
    latestPennsieveAgentVersion,
    postPennsieveAgentCheckAction,
  } = useGlobalStore((state) => ({
    pennsieveAgentInstalled: state.pennsieveAgentInstalled,
    pennsieveAgentUpToDate: state.pennsieveAgentUpToDate,
    pennsieveAgentDownloadURL: state.pennsieveAgentDownloadURL,
    pennsieveAgentOutputErrorMessage: state.pennsieveAgentOutputErrorMessage,
    pennsieveAgentCheckInProgress: state.pennsieveAgentCheckInProgress,
    pennsieveAgentCheckError: state.pennsieveAgentCheckError,
    usersPennsieveAgentVersion: state.usersPennsieveAgentVersion,
    latestPennsieveAgentVersion: state.latestPennsieveAgentVersion,
    postPennsieveAgentCheckAction: state.postPennsieveAgentCheckAction,
  }));

  if (pennsieveAgentCheckInProgress === true) {
    return (
      <Stack mt="sm" align="center">
        <Text size="xl" fw={700}>
          Checking the status of the Pennsieve agent
        </Text>
        <Loader color="orange" type="bars" />
      </Stack>
    );
  }

  if (pennsieveAgentCheckError?.title && pennsieveAgentCheckError?.message) {
    return (
      <Stack mt="sm" align="center">
        <Alert
          variant="light"
          color="blue"
          title={pennsieveAgentCheckError.title}
          icon={<IconAlertCircle />}
          style={{ width: "100%" }}
        >
          <Text>{pennsieveAgentCheckError.message}</Text>
          <Center mt="sm">
            <RetryButton />
          </Center>
        </Alert>
      </Stack>
    );
  }

  if (pennsieveAgentInstalled === false) {
    return (
      <Stack mt="sm" align="center">
        <Alert
          variant="light"
          color="blue"
          title="Pennsieve Agent not installed"
          icon={<IconTool />}
          style={{ width: "100%" }}
        >
          <Text mb="sm">
            The Pennsieve agent is required to upload data to Pennsieve from SODA. Please download
            and install the Pennsieve Agent by clicking the button below.
          </Text>
          <ExternalLink
            href={pennsieveAgentDownloadURL}
            buttonText="Download the Pennsieve Agent"
            buttonType="button"
            buttonSize="md"
          />
          <Text mt="sm">
            After installing the agent, click the {RETRY_BUTTON_TEXT} button to ensure the agent was
            installed properly.
          </Text>
          <Center mt="sm">
            <RetryButton />
          </Center>
        </Alert>
      </Stack>
    );
  }

  if (pennsieveAgentOutputErrorMessage === true) {
    return <PennsieveAgentErrorMessageDisplay errorMessage={pennsieveAgentOutputErrorMessage} />;
  }

  if (pennsieveAgentUpToDate === false) {
    return (
      <Stack mt="sm" align="center">
        <Alert
          variant="light"
          color="blue"
          title="Pennsieve Agent Out of Date"
          icon={<IconAlertCircle />}
          style={{ width: "100%" }}
        >
          <Text>
            Installed Pennsieve Agent version: <b>{usersPennsieveAgentVersion}</b>
          </Text>
          <Text mt="sm">
            Latest Pennsieve Agent version: <b>{latestPennsieveAgentVersion}</b>
          </Text>
          <Text mt="sm" mb="sm">
            Please download and install the latest version of the Pennsieve Agent below.
          </Text>
          <ExternalLink
            href={pennsieveAgentDownloadURL}
            buttonText="Download the Latest Pennsieve Agent"
            buttonType="button"
            buttonSize="md"
          />
          <Text mt="sm">
            After installing the agent, click the {RETRY_BUTTON_TEXT} button to ensure the agent was
            installed properly.
          </Text>
          <Center mt="sm">
            <RetryButton />
          </Center>
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack mt="sm" align="center" mx="sm">
      <Text size="xl" fw={700}>
        The Pennsieve Agent is running and ready to upload!
      </Text>
      <Text size="lg" fw={600}>
        {postPennsieveAgentCheckAction}
      </Text>
    </Stack>
  );
};

export default PennsieveAgentCheckDisplay;