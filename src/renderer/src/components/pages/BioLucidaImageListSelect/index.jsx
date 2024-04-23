import useGuidedModeStore from "../../../stores/guidedModeStore";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import {
  setMicroscopyImagesUploadableToBioLucida,
  addMicroscopyImageToBeUploadedToBioLucida,
  removeMicroscopyImageToBeUploadedToBioLucida,
} from "../../../stores/slices/microscopyImageSlice";
import {
  SimpleGrid,
  Card,
  Image,
  Text,
  Affix,
  Badge,
  Button,
  Group,
  HoverCard,
  Transition,
  Paper,
} from "@mantine/core";
import { IconSquareCheck } from "@tabler/icons-react";
import SodaGreenPaper from "../../utils/ui/SodaGreenPaper";
import styles from "./BioLucidaImageListSelectPage.module.css";

import ExternalLink from "../../buttons/ExternalLink";

const BioLucidaImageListSelectPage = () => {
  const { currentGuidedModePage } = useGlobalStore();
  const microscopyImagesUploadableToBioLucida = useGlobalStore(
    (state) => state.microscopyImagesUploadableToBioLucida
  );
  const microscopyImagesSelectedToBeUploadedToBioLucida = useGlobalStore(
    (state) => state.microscopyImagesSelectedToBeUploadedToBioLucida
  );

  return (
    <GuidedModePage
      pageHeader="BioLucida Image Selection"
      pageDescription="Select the microscopy images you would like to upload to BioLucida (Up to 10)."
    >
      <SimpleGrid cols={5}>
        {microscopyImagesUploadableToBioLucida.map((image) => (
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            key={image.relativePath}
            className={styles.imageCard}
            onClick={() => {
              microscopyImagesSelectedToBeUploadedToBioLucida.includes(image.filePath)
                ? removeMicroscopyImageToBeUploadedToBioLucida(image.filePath)
                : addMicroscopyImageToBeUploadedToBioLucida(image.filePath);
            }}
          >
            {microscopyImagesSelectedToBeUploadedToBioLucida.includes(image.filePath) && (
              <Card.Section pos="relative" style={{ zIndex: 1000 }}>
                <IconSquareCheck className={styles.imageCheckMark} />
              </Card.Section>
            )}
            <Card.Section>
              <Image src={image.filePath} height={160} alt="Microscopy image" />
            </Card.Section>
          </Card>
        ))}
      </SimpleGrid>
      {currentGuidedModePage === "guided-biolucida-image-selection-tab" && (
        <Affix
          position={{ top: 150, right: 20 }}
          style={{
            zIndex: 1000,
          }}
        >
          <SodaGreenPaper>
            <Text>Images selected: {microscopyImagesSelectedToBeUploadedToBioLucida.length}</Text>
          </SodaGreenPaper>
        </Affix>
      )}
    </GuidedModePage>
  );
};

export default BioLucidaImageListSelectPage;
