import { Stack, Title, Text } from "@mantine/core";
import classes from "./GuidedModePage.module.css";
import GuidedModeSection from "./GuidedModeSection";

const GuidedModePage = ({ pageHeader, pageDescription, children }) => {
  return (
    <Stack gap="md" className={classes.guidedModePage}>
      <Title ta="center" mt="lg" mb="sm">
        {pageHeader}
      </Title>
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
