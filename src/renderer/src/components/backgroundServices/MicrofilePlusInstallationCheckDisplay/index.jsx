import { Text, Stack, Group, Button, Alert, Loader, Center, List } from "@mantine/core";
import { IconTool, IconRosetteDiscountCheck, IconCheck } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import ExternalLink from "../../buttons/ExternalLink";
import CodeTextDisplay from "../../common/CodeTextDisplay";
import useGlobalStore from "../../../stores/globalStore";

const handleExitButtonClick = () => {
  window.electron.ipcRenderer.invoke("exit-soda");
};

const MicrofilePlusInstallationCheckDisplay = () => {
  const { microFilePlusInstalled } = useGlobalStore();

  if (microFilePlusInstalled === false) {
    return (
      <FullWidthContainer>
        <Stack mt="sm" align="center">
          <Alert
            variant="light"
            color="blue"
            title="MicroFile+ not installed"
            icon={<IconTool />}
            style={{ width: "100%" }}
          >
            <Text mb="sm">
              SODA uses MicroFile+ to convert Microscopy Image Data and Metadata to SPARC Standard
              Formats.
            </Text>
            <Text mb="sm">
              Click the button below, fill out the form required to get access to MicroFile+, and
              then download MicroFile+. After installing MicroFile+, click the "Retry MicroFile+
              detection" button below.
            </Text>
            <List type="ordered">
              <List.Item>
                Click the "Download MicroFile+" button below to be directed to the MicroFile+
                download page.
              </List.Item>
              <List.Item>Fill out and submit the required form.</List.Item>
              <List.Item>Check your Email for a direct link to download MicroFile+.</List.Item>
              <List.Item>
                Download and install MicroFile+ using the license code sent to your Email.
              </List.Item>
              <List.Item>
                Click the "Retry MicroFile+ detection" button below to ensure SODA can detect the
                installation.
              </List.Item>
            </List>
            <ExternalLink
              href="https://www.mbfbioscience.com/download-microfile?wpf12510_6=microfile%20plus"
              buttonText="Download MicroFile+"
              buttonType="button"
              buttonSize="md"
            />
            <Button onClick={handleExitButtonClick}>Retry MicroFile+ detection</Button>
          </Alert>
        </Stack>
      </FullWidthContainer>
    );
  }

  if (microFilePlusInstalled === true) {
    return (
      <FullWidthContainer>
        <Alert
          variant="light"
          color="green"
          title="MicroFile+ installed successfully"
          icon={<IconRosetteDiscountCheck />}
          style={{ width: "100%" }}
        >
          Great Success!
        </Alert>
      </FullWidthContainer>
    );
  }

  return (
    <FullWidthContainer>
      <Center>
        <Loader size="xl" />
        <Text>Soda is detecting MicroFile+ installation status...</Text>
      </Center>
    </FullWidthContainer>
  );
};

export default MicrofilePlusInstallationCheckDisplay;
