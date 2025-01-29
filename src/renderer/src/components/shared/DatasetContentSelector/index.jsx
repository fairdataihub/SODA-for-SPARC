import { Card, Stack, Text, Group, Tooltip } from "@mantine/core";
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
      description:
        "Individual entities, such as humans, animals, or other biological specimens, from which data was collected during the study.",
    },
    {
      value: "samples",
      description:
        "Biological specimens, such as tissue, blood, or fluid, collected from subjects for analysis or experimentation.",
      dependsOn: "subjects",
    },
    {
      value: "sites",
      description:
        "Multiple distinct anatomical or geographical locations where data was collected from subjects during the study.",
      dependsOn: "subjects",
    },
    {
      value: "performances",
      description:
        "Multiple distinct performances of the same experimental protocol on the same subject or sample (e.g., multiple visits, runs, sessions, or executions).",
      dependsOn: "subjects",
    },
    {
      value: "code",
      description:
        "Scripts, computational models, analysis pipelines, or other code/tools used during the study for data processing or analysis.",
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
                isDisabled
                  ? `Requires ${upperCaseFirstLetter(option.dependsOn)} to be selected`
                  : isSelected
                    ? `${upperCaseFirstLetter(option.value)} is selected`
                    : ""
              }
              disabled={!isDisabled && !isSelected}
            >
              <Card
                withBorder
                shadow="sm"
                padding="lg"
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
                <Group position="apart" align="flex-start">
                  <Text fw={700} size="lg">
                    {upperCaseFirstLetter(option.value)}
                  </Text>
                  {isSelected && <IconCheck size={18} color="var(--color-light-green)" />}
                </Group>
                <Text size="sm" mt="xs">
                  {option.description}
                </Text>
              </Card>
            </Tooltip>
          );
        })}
      </Stack>
    </FullWidthContainer>
  );
};

export default DatasetContentSelector;
