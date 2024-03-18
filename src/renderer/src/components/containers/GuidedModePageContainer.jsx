import { Container, Text } from "@mantine/core";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import classes from "./GuidedModePageContainer.module.css";
import NameAndSubtitle from "../forms/NameAndSubtitle";

const pageIdToPageComponentMap = {
  "guided-name-subtitle-tab": NameAndSubtitle,
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
          <PageComponent key={pageId} />
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
