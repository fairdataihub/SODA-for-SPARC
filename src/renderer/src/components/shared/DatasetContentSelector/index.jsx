import { Card, Stack, Text, Group, Tooltip, Checkbox, Box } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore";
import { toggleEntitySelection } from "../../../stores/slices/datasetContentSelectorSlice";

const upperCaseFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const DatasetContentSelector = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);

  const contentOptions = [
    {
      value: "subjects",
      label: "I collected data from subjects",
      description:
        "Subjects are individual entities, such as humans, animals, or other biological specimens, from which data was collected during the study.",
    },
    {
      value: "samples",
      label: "I collected samples from subjects",
      description:
        "Samples are biological or physical specimens collected from subjects, such as tissue samples, blood samples, or other biological materials.",
      dependsOn: "subjects",
    },
    {
      value: "sites",
      label: "I collected data from multiple physical locations on the same subject or sample",
      dependsOn: "subjects",
    },
    {
      value: "performances",
      label: "I collected data from multiple performances of the same protocol",
      dependsOn: "subjects",
    },
    {
      value: "code",
      label: "I used code to generate or analyze the collected data",
      description:
        "Code includes scripts, computational models, analysis pipelines, or other software used to generate, process, or analyze the data.",
    },
  ];

  const handleEntitySelection = (value) => {
    const isSelected = selectedEntities.includes(value);

    // Deselect dependent entities if the value is deselected
    if (isSelected) {
      contentOptions.forEach((option) => {
        if (option.dependsOn === value && selectedEntities.includes(option.value)) {
          toggleEntitySelection(option.value);
        }
      });
    }

    // Toggle the selection of the current entity
    toggleEntitySelection(value);
  };

  return (
    <FullWidthContainer>
      <Stack spacing="md">
        {contentOptions.map((option) => {
          const isDisabled = option.dependsOn && !selectedEntities.includes(option.dependsOn);
          const isSelected = selectedEntities.includes(option.value) && !isDisabled;

          return (
            <Tooltip
              key={option.value}
              label={
                option.dependsOn &&
                `${upperCaseFirstLetter(
                  option.dependsOn
                )} must be selected before choosing this option.`
              }
              disabled={!isDisabled}
              zIndex={2999}
            >
              <Card
                withBorder
                shadow="sm"
                padding="lg"
                ml={option.dependsOn ? "xl" : 0}
                style={{
                  opacity: isDisabled ? 0.6 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  backgroundColor: isSelected ? "#e8f5e9" : "white",
                  borderColor: isSelected ? "var(--color-light-green)" : "#e0e0e0",
                  borderWidth: isSelected ? 2 : 1,
                  borderStyle: "solid",
                }}
                onClick={() => {
                  if (!isDisabled) handleEntitySelection(option.value);
                }}
              >
                <Group position="apart" align="center">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => {
                      if (!isDisabled) handleEntitySelection(option.value);
                    }}
                    style={{
                      cursor: isDisabled ? "not-allowed" : "pointer",
                    }}
                    onClick={(event) => event.stopPropagation()}
                  />
                  <Text fw={700} size="lg">
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
