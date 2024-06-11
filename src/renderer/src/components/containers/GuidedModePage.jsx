import { Stack, Title, Text } from "@mantine/core";
import classes from "./GuidedModePage.module.css";
import GuidedModeSection from "./GuidedModeSection";

const GuidedModePage = ({ pageHeader, pageDescriptionArray, children }) => {
  return (
    <Stack gap="md" className={classes.guidedModePage}>
      <Title ta="center" mt="lg" mb="sm">
        {pageHeader}
      </Title>
      {pageDescriptionArray && (
        <GuidedModeSection>
          {pageDescriptionArray.map((pageDescription) => (
            <Text size="lg" key={pageDescription}>
              {pageDescription}
            </Text>
          ))}
        </GuidedModeSection>
      )}
      {children}
    </Stack>
  );
};

export default GuidedModePage;
