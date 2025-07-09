import { Stack, Button, Text, Center } from "@mantine/core";
import { useToggle } from "@mantine/hooks";
import { IconChevronRight, IconChevronDown, IconInfoCircle } from "@tabler/icons-react";
import classes from "./DropDownNote.module.css";
import SodaGreenPaper from "../SodaGreenPaper";
import SodaPaper from "../SodaPaper";
import useGlobalStore from "../../../../stores/globalStore";

const dropDownIcons = {
  info: <IconInfoCircle className={classes.dropDownIcon} color="black" />,
};

const renderDataCategoriesNote = (datasetIncludesCode) => (
  <>
    <SodaPaper>
      <Text fw={600}>Experimental</Text>
      <Text size="sm">
        Data collected from experiments, such as raw or processed measurements, images, recordings,
        or any primary data generated during the study.
      </Text>
    </SodaPaper>
    {datasetIncludesCode && (
      <SodaPaper>
        <Text fw={600}>Code</Text>
        <Text size="sm">
          Scripts, computational models, analysis pipelines, or other software used for data
          processing, analysis, or simulation in the study.
        </Text>
      </SodaPaper>
    )}
    <SodaPaper>
      <Text fw={600}>Documentation</Text>
      <Text size="sm">
        Supporting documents such as README files, data dictionaries, or other materials that help
        users understand and reuse the dataset.
      </Text>
    </SodaPaper>
    <SodaPaper>
      <Text fw={600}>Protocol</Text>
      <Text size="sm">
        Protocols, standard operating procedures, or step-by-step instructions describing how
        experiments or analyses were performed.
      </Text>
    </SodaPaper>
  </>
);

const DropDownNote = ({ id }) => {
  console.log("DropDownNote rendered with id:", id);
  const [isOpen, toggleOpen] = useToggle([false, true]);
  const datasetIncludesCode = useGlobalStore((state) => state.selectedEntities.includes("code"));

  const configMap = {
    "data-categories-list": {
      dropDownIcon: "info",
      dropDownButtonText: "Learn more about the data categories",
      dropDownNote: renderDataCategoriesNote(datasetIncludesCode),
    },
    "entity-types-list": {
      dropDownIcon: "info",
      dropDownButtonText: "What are data entities?",
      dropDownNote: (
        <>
          <Text size="sm" mb="md">
            The SDS uses the term <strong>data entity</strong> to refer to a specific type of
          </Text>
          <SodaPaper>
            <Text fw={600}>Subjects</Text>
            <Text size="sm">
              Data collected from experiments, such as raw or processed measurements, images,
              recordings, or any primary data generated during the study.
            </Text>
          </SodaPaper>
          {datasetIncludesCode && (
            <SodaPaper>
              <Text fw={600}>Samples</Text>
              <Text size="sm">
                Scripts, computational models, analysis pipelines, or other software used for data
                processing, analysis, or simulation in the study.
              </Text>
            </SodaPaper>
          )}
          <SodaPaper>
            <Text fw={600}>Sites</Text>
            <Text size="sm">
              Supporting documents such as README files, data dictionaries, or other materials that
              help users understand and reuse the dataset.
            </Text>
          </SodaPaper>
        </>
      ),
    },
  };

  const config = configMap[id];
  if (!config) return null;

  return (
    <Stack gap="xs">
      <Button variant="subtle" justify="left" onClick={toggleOpen} className={classes.button}>
        {dropDownIcons[config.dropDownIcon]}
        <Text td="underline" className={classes.dropDownButtonText} sx={{ mx: 6 }} size="sm">
          {config.dropDownButtonText}
        </Text>
        {isOpen ? (
          <IconChevronDown className={classes.dropDownIcon} />
        ) : (
          <IconChevronRight className={classes.dropDownIcon} />
        )}
      </Button>
      {isOpen && <SodaGreenPaper>{config.dropDownNote}</SodaGreenPaper>}
    </Stack>
  );
};

export default DropDownNote;
