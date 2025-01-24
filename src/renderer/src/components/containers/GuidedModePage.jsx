import { Stack, Title, Text } from "@mantine/core";
import classes from "./GuidedModePage.module.css";
import GuidedModeSection from "./GuidedModeSection";

const GuidedModePage = ({ pageHeader, pageDescription, children }) => {
  return (
    <Stack gap="md" mt="lg" className={classes.guidedModePage}>
      <Text ta="center" fw={700} size="xl">
        {pageHeader}
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
