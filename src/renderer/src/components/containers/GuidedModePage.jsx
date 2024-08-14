import { Stack, Title, Text, Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import classes from "./GuidedModePage.module.css";
import GuidedModeSection from "./GuidedModeSection";

const GuidedModePage = ({ pageHeader, pageDescriptionArray, children }) => {
  const handleTextBlockRendering = (text) => {
    if (text.startsWith("*NOTE*")) {
      return (
        <Alert icon={<IconInfoCircle />} color="cyan" key={text} variant="light">
          {text.replace("*NOTE*", "")}
        </Alert>
      );
    }

    return (
      <Text size="lg" key={text}>
        {text}
      </Text>
    );
  };
  return (
    <Stack gap="md" className={classes.guidedModePage}>
      <Title ta="center" mt="lg" mb="sm">
        {pageHeader}
      </Title>
      {pageDescriptionArray && (
        <GuidedModeSection>
          {pageDescriptionArray.map((textBlock) => handleTextBlockRendering(textBlock))}
        </GuidedModeSection>
      )}
      {children}
    </Stack>
  );
};

export default GuidedModePage;
