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
    label: "I collected samples from subjects",
    description:
      "Samples are biological or physical specimens collected from subjects, such as tissue samples, blood samples, or other biological materials.",
    dependsOn: ["subjects"],
    ml: "20px",
  },
  sites: {
    label: "I collected data from multiple locations from subjects",
    description:
      "Samples are biological or physical specimens collected from subjects, such as tissue samples, blood samples, or other biological materials.",
    dependsOn: ["subjects"],
    ml: "20px",
  },
  "subject-sites": {
    label: "The locations from which I collected data are related to the subjects",
    description: "Select this option if...",
    dependsOn: ["subjects", "samples", "sites"],
    ml: "40px",
  },
  "sample-sites": {
    label: "The locations from which I collected data are related to the samples",
    description: "Select this option if...",
    dependsOn: ["subjects", "samples", "sites"],
    ml: "40px",
  },
  performances: {
    label: "I collected data from multiple protocol performances",
    dependsOn: ["subjects"],
    ml: "20px",
  },
  "performances-on-subjects": {
    label: "The protocol performances are related to the subjects",
    description: "Select this option if...",
    dependsOn: ["subjects", "samples", "performances"],
    ml: "40px",
  },
  "performances-on-samples": {
    label: "The protocol performances are related to the samples",
    description: "Select this option if...",
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
