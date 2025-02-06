import { Card, Stack, Text, Group, Tooltip, Checkbox } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore";
import { toggleEntitySelection } from "../../../stores/slices/datasetContentSelectorSlice";

const contentOptionsMap = {
  subjects: {
    label: "I collected data from subjects",
    description:
      "Subjects are individual entities, such as humans, animals, or other biological specimens from which data was collected during the study.",
    ml: "0px",
  },
  samples: {
    label: "I collected data from samples",
    description:
      "Samples are biological or physical specimens collected from subjects, such as tissue samples, blood samples, or other biological materials.",
    dependsOn: ["subjects"],
    ml: "20px",
  },
  sites: {
    label: "I collected data from multiple distinct physical sites on subjects or samples.",
    description:
      "For example, if you collected data from multiple brain regions, different sections of a tissue sample, or distinct parts of an organ.",
    dependsOn: ["subjects"],
    ml: "20px",
  },
  "subject-sites": {
    label: "I collected data from distinct physical sites of subjects.",
    description:
      "Select this option if the sites where data was collected correspond to specific locations or regions within the subjects, such as different anatomical regions or organs.",
    dependsOn: ["subjects", "samples", "sites"],
    ml: "40px",
  },
  "sample-sites": {
    label: "I collected data from distinct physical sites of samples.",
    description:
      "Select this option if the sites where data was collected correspond to specific regions within the samples, such as different sections of tissue or other biological materials.",
    dependsOn: ["subjects", "samples", "sites"],
    ml: "40px",
  },
  performances: {
    label: "I collected data from multiple performances of the same protocol.",
    description:
      "Performances refer to the repeated execution of the same protocol or procedure during the study. This can involve tasks or experiments conducted multiple times on the subjects or samples.",
    dependsOn: ["subjects"],
    ml: "20px",
  },
  "performances-on-subjects": {
    label: "The protocol performances were run on the subjects.",
    description:
      "Select this option if the protocol performances (such as tasks, tests, or procedures) were conducted on subjects, such as humans or animals, and data was collected during those performances.",
    dependsOn: ["subjects", "samples", "performances"],
    ml: "40px",
  },
  "performances-on-samples": {
    label: "The protocol performances were run on the samples.",
    description:
      "Select this option if the protocol performances (such as processing or testing procedures) were conducted on samples, like tissue or biological specimens, and data was collected during those procedures.",
    dependsOn: ["subjects", "samples", "performances"],
    ml: "40px",
  },
  code: {
    label: "I used code to generate or analyze the collected data",
    description:
      "Code includes scripts, computational models, analysis pipelines, or other software used to generate, process, or analyze the data.",
    ml: "0px",
  },
};

const DatasetContentSelector = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);

  const handleEntitySelection = (value) => {
    const isSelected = selectedEntities.includes(value);

    if (isSelected) {
      Object.keys(contentOptionsMap).forEach((key) => {
        if (contentOptionsMap[key].dependsOn?.includes(value) && selectedEntities.includes(key)) {
          toggleEntitySelection(key);
        }
      });
    }

    toggleEntitySelection(value);
  };

  return (
    <FullWidthContainer>
      <Stack spacing="md">
        {Object.keys(contentOptionsMap).map((key) => {
          const option = contentOptionsMap[key];
          const isDisabled = option.dependsOn?.some((dep) => !selectedEntities.includes(dep));
          const isSelected = selectedEntities.includes(key) && !isDisabled;

          return (
            <Tooltip
              key={key}
              label={
                isDisabled
                  ? `${option.dependsOn
                      .map((dep) => contentOptionsMap[dep].label)
                      .join(" and ")} must be selected first.`
                  : ""
              }
              disabled={!isDisabled}
              zIndex={2999}
            >
              <Card
                withBorder
                shadow="sm"
                padding="lg"
                ml={option.ml}
                style={{
                  display: isDisabled ? "none" : "block",
                  opacity: isDisabled ? 0.6 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  backgroundColor: isSelected ? "#e8f5e9" : "white",
                  borderColor: isSelected ? "var(--color-light-green)" : "#e0e0e0",
                  borderWidth: isSelected ? 2 : 1,
                  borderStyle: "solid",
                }}
                onClick={() => !isDisabled && handleEntitySelection(key)}
              >
                <Group position="apart" align="center">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => !isDisabled && handleEntitySelection(key)}
                    style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
                    onClick={(event) => event.stopPropagation()}
                  />
                  <Text fw={600} size="lg">
                    {option.label}
                  </Text>
                </Group>
                {option.description && (
                  <Text size="sm" mt="xs">
                    {option.description}
                  </Text>
                )}
              </Card>
            </Tooltip>
          );
        })}
      </Stack>
    </FullWidthContainer>
  );
};

export default DatasetContentSelector;
