import {
  Text,
  Stack,
  Group,
  Button,
  Alert,
  Loader,
  Center,
  List,
  Notification,
} from "@mantine/core";
import { IconTool, IconRosetteDiscountCheck, IconCheck } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import ExternalLink from "../../buttons/ExternalLink";
import CodeTextDisplay from "../../common/CodeTextDisplay";
import useGlobalStore from "../../../stores/globalStore";

const handleRetryButtonClick = () => {
  document.getElementById("guided-button-dataset-contains-microscopy-images").click();
};

const handleSkipMicroscopyImageConversionButtonClick = () => {
  window.sodaJSONObj["skip-microscopy-image-conversion"] = true;
  window.unHideAndSmoothScrollToElement("guided-section-ask-if-dataset-contains-code");
  console.log(window.unHideAndSmoothScrollToElement);
};

const SkipMicroscopyImageConversionButton = (
  <Button onClick={handleSkipMicroscopyImageConversionButtonClick} color="gray" variant="outline">
    Skip Microscopy Image Conversion
  </Button>
);

const SkipMicroscopyImageConversionWarningText = (
  <Notification
    mt="md"
    withCloseButton={false}
    withBorder
    color="red"
    title="Skipping Microsopy Image Conversion"
  >
    <Text fw={200}>
      While not recommended, you can skip the Microscopy Image Data and Metadata conversion by
      clicking the "Skip Microscopy Image Conversion" button below. By doing so, your microscopy
      images will not be converted using MicroFile+ and your images will not be uploaded to
      BioLucida.
    </Text>
  </Notification>
);

const MicrofilePlusInstallationCheckDisplay = () => {
  const { microFilePlusInstalled, usersPlatformIsMicroFilePlusCompatable } = useGlobalStore();
  console.log("microFilePlusInstalled", microFilePlusInstalled);
  console.log("usersPlatformIsMicroFilePlusCompatable", usersPlatformIsMicroFilePlusCompatable);
  return (
    <FullWidthContainer>
      <Text size="lg" mb="md">
        SODA requires the MicroFile+ application to convert Microscopy Image Data and Metadata to
        SPARC Standard Formats.
      </Text>
      {usersPlatformIsMicroFilePlusCompatable === false && (
        <FullWidthContainer>
          <Alert
            variant="light"
            color="red"
            title="MicroFile+ is not compatible with your platform"
            icon={<IconTool />}
            style={{ width: "100%" }}
          >
            <Text mb="sm">
              MicroFile+ is currently only available for Windows, so you must either switch to
              Windows or skip the Microscopy Image Data and Metadata conversion.
            </Text>
            {SkipMicroscopyImageConversionWarningText}
            <Group justify="center" mt="md">
              {SkipMicroscopyImageConversionButton}
            </Group>
          </Alert>
        </FullWidthContainer>
      )}
      {microFilePlusInstalled === false && (
        <Stack align="center">
          <Alert
            variant="light"
            color="blue"
            title="MicroFile+ is not installed"
            icon={<IconTool />}
            style={{ width: "100%" }}
          >
            <Text mb="sm" fw={700}>
              Follow the steps below to install MicroFile+:
            </Text>
            <List type="ordered">
              <List.Item>
                Go to the
                <ExternalLink
                  href="https://www.mbfbioscience.com/download-microfile?wpf12510_6=microfile%20plus"
                  buttonText="MicroFile+ download page"
                  buttonType="anchor"
                  buttonSize="md"
                />
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
            {SkipMicroscopyImageConversionWarningText}

            <Group justify="center" mt="md">
              <Button onClick={handleRetryButtonClick}>Retry MicroFile+ detection</Button>
              {SkipMicroscopyImageConversionButton}
            </Group>
          </Alert>
        </Stack>
      )}
      {microFilePlusInstalled === true && (
        <Alert
          variant="light"
          color="green"
          title="MicroFile+ installed successfully"
          icon={<IconRosetteDiscountCheck />}
          style={{ width: "100%" }}
        >
          <Text>
            SODA will use MicroFile+ to convert Microsocpy Image Data and Metadata to SPARC
            Standards.
          </Text>
        </Alert>
      )}
    </FullWidthContainer>
  );
};

export default MicrofilePlusInstallationCheckDisplay;
