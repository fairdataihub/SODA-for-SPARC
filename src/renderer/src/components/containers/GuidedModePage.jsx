import { Stack, Title } from "@mantine/core";
import classes from "./GuidedModePage.module.css";

const GuidedModePage = ({ pageHeader, children }) => {
  return (
    <Stack gap="md" className={classes.guidedModePage}>
      <Title ta="center">{pageHeader}</Title>
      {children}
    </Stack>
  );
};

export default GuidedModePage;
