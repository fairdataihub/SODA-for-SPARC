import { Paper, Stack, Group, ThemeIcon, Text, Center } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import NavigationButton from "../../buttons/Navigation";
import GuidedModeSection from "../../containers/GuidedModeSection";

const PageCompleteIndicator = ({ message }) => {
  return (
    <GuidedModeSection>
      <Stack spacing="lg" align="center" mt="lg">
        <Group spacing="md" align="center">
          <Text fw={600} size="lg">
            {message}
          </Text>
        </Group>

        <Center>
          <NavigationButton
            onClick={() => {
              document.getElementById("guided-next-button").click();
            }}
            buttonCustomWidth={"215px"}
            buttonText={"Save and Continue"}
            navIcon={"right-arrow"}
            buttonSize={"md"}
          />
        </Center>
      </Stack>
    </GuidedModeSection>
  );
};

export default PageCompleteIndicator;
