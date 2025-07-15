import { Stack, Title, Text } from "@mantine/core";
import { upperFirst } from "@mantine/hooks";
import classes from "./GuidedModePage.module.css";
import GuidedModeSection from "./GuidedModeSection";

// Function that capitalizes the first letter of a series of words
// and returns the string
const capitalizeFirstLetter = (str) => {
  return str
    .split(" ")
    .map((word) => upperFirst(word))
    .join(" ");
};

const GuidedModePage = ({ pageHeader, pageDescription, children }) => {
  return (
    <Stack gap="md" mt="lg" className={classes.guidedModePage}>
      <Text ta="center" fw={700} size="xl">
        {capitalizeFirstLetter(pageHeader)}
      </Text>
      {pageDescription && (
        <GuidedModeSection>
          <Text size="lg">{pageDescription}</Text>
        </GuidedModeSection>
      )}
      {children}
    </Stack>
  );
};

export default GuidedModePage;
