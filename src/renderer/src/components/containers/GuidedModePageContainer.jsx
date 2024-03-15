import { Container } from "@mantine/core";
import { Text } from "@mantine/core";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
// import DatasetNameAndSubtitlePage from "../pages/gm/DatasetNameAndSubtitlePage";
import classes from "./GuidedModePageContainer.module.css";

const pageIdToPageComponentMap = {
  "guided--page--1": "GuidedModePage1",
};
const GuidedModePageContainer = ({ pageId, pageHeader }) => {
  console.log("Rendering Page component for pageId: ", pageId);
  console.log("Page header: ", pageHeader);
  const PageComponent = pageIdToPageComponentMap[pageId];
  return (
    <SodaComponentWrapper>
      <Container className={classes.guidedModePageContainer} bg="teal">
        <Text size="md" ta="center">
          {pageHeader}
        </Text>
        {PageComponent ? (
          PageComponent
        ) : (
          <Text size="md" ta="center">
            PAGE NOT FOUND
          </Text>
        )}
      </Container>
    </SodaComponentWrapper>
  );
};

export default GuidedModePageContainer;
