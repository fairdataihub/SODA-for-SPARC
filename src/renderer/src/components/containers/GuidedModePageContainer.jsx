import { Stack, Title } from "@mantine/core";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import classes from "./GuidedModePageContainer.module.css";

const GuidedModePageContainer = ({ pageHeader, children }) => {
  return (
    <SodaComponentWrapper>
      <Title order={1}>{pageHeader}</Title>
      <Stack gap="md" className={classes.guidedModePageContainer}>
        {children}
      </Stack>
    </SodaComponentWrapper>
  );
};

export default GuidedModePageContainer;
