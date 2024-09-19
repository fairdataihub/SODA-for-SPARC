import { Text, Stack, Group, Button, Alert, List, Notification } from "@mantine/core";
import { IconTool, IconRosetteDiscountCheck } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import ExternalLink from "../../buttons/ExternalLink";
import useGlobalStore from "../../../stores/globalStore";

const handleRetryButtonClick = () => {
  document.getElementById("guided-button-dataset-contains-microscopy-images").click();
};

const handleSkipMicroscopyImageConversionButtonClick = () => {
  window.sodaJSONObj["skip-microscopy-image-conversion"] = true;
  window.unHideAndSmoothScrollToElement("guided-section-ask-if-dataset-contains-code");
};

const SkipMicroscopyImageConversionButton = (
  <Button
    onClick={handleSkipMicroscopyImageConversionButtonClick}
    color="gray"
    variant="outline"
    w="300px"
  >
    Skip Microscopy Image Conversion
  </Button>
);

const SkipMicroscopyImageConversionWarningText = (
  <Notification
    mt="xl"
    withCloseButton={false}
    withBorder
    color="red"
    title="If you would like to skip Microscopy Image Conversion"
  >
    <Stack align="center">
      <Text fw={200} size="sm">
        Although not recommended, you can skip the Microscopy Image Data and Metadata conversion by
        clicking the 'Skip Microscopy Image Conversion' button below. If you do so, your microscopy
        images will not be converted using MicroFile+, and they will not be uploaded to BioLucida.
        However, you will still be able to generate your dataset locally and on Pennsieve.
      </Text>
      {SkipMicroscopyImageConversionButton}
    </Stack>
  </Notification>
);

const MicrofilePlusInstallationCheckDisplay = () => {
  const { microFilePlusInstalled, usersPlatformIsMicroFilePlusCompatable } = useGlobalStore();
  console.log("microFilePlusInstalled", microFilePlusInstalled);
  console.log("usersPlatformIsMicroFilePlusCompatable", usersPlatformIsMicroFilePlusCompatable);
  return (
    <FullWidthContainer>
      {microFilePlusInstalled && (
        <Text size="lg" mb="md">
          SODA requires{" "}
          <ExternalLink
            href="https://www.mbfbioscience.com/products/microfileplus"
            buttonText="MicroFile+"
            buttonType="anchor"
            textSize="lg"
          />
          to convert Microscopy Image Data and Metadata to SPARC Standard Formats. The converted
          images are subsequently uploaded to{" "}
          <ExternalLink
            href="https://www.biolucida.net/login"
            buttonText="BioLucida"
            buttonType="anchor"
            textSize="lg"
          />{" "}
          where they can be viewed and analyzed by other researchers.
        </Text>
      )}

      {usersPlatformIsMicroFilePlusCompatable === false && (
        <FullWidthContainer>
          <Alert
            variant="light"
            color="red"
            title="MicroFile+ is not compatible with your platform"
            icon={<IconTool />}
            style={{ width: "100%" }}
          >
            MicroFile+ is currently only available for Windows, so you must either switch to Windows
            or skip the Microscopy Image Data and Metadata conversion.
            {SkipMicroscopyImageConversionWarningText}
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
            <Text mb="sm" fw={600}>
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
              <List.Item>
                Wait for a license code and direct download link to be sent to your Email.
              </List.Item>
              <List.Item>Download and install MicroFile+.</List.Item>
              <List.Item>
                Click the "Retry MicroFile+ detection" button below to ensure SODA can detect the
                installation.
              </List.Item>
            </List>

            <Group justify="center" mt="md">
              <Button onClick={handleRetryButtonClick}>Retry MicroFile+ detection</Button>
            </Group>

            {SkipMicroscopyImageConversionWarningText}
          </Alert>
        </Stack>
      )}
      {microFilePlusInstalled === true && (
        <Alert
          variant="light"
          color="green"
          title="SODA successfully detected MicroFile+ installation"
          icon={<IconRosetteDiscountCheck />}
          style={{ width: "100%" }}
        >
          SODA will use MicroFile+ to convert Microsocpy Image Data and Metadata to SPARC Standards.
        </Alert>
      )}
    </FullWidthContainer>
  );
};

export default MicrofilePlusInstallationCheckDisplay;
