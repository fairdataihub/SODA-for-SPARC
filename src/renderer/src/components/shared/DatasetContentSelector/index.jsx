import { Card, Stack, Text, Group } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore";
import { toggleComponent } from "../../../stores/slices/datasetContentSelectorSlice";

const DatasetContentSelector = () => {
  const selectedComponents = useGlobalStore((state) => state.selectedComponents);

  const options = [
    {
      value: "subjects",
      label: "Subjects",
      description:
        "Individual entities, such as humans, animals, or other organisms, that participated in the study.",
    },
    {
      value: "samples",
      label: "Samples",
      description:
        "Biological or chemical specimens collected from subjects for further analysis or experimentation.",
      dependsOn: "subjects",
    },
    {
      value: "sites",
      label: "Sites",
      description:
        "Specific locations in the body, environment, or experimental setup where data or samples were collected. Conditionally required if data were gathered from multiple distinct locations or experimental setups for the same subject or sample.",
      dependsOn: "subjects",
    },
    {
      value: "performances",
      label: "Performances",
      description:
        "Multiple distinct performances of one type of experimental protocol on the same subject or same sample (i.e. multiple visits, runs, sessions, or execution).",
      dependsOn: "subjects",
    },
    {
      value: "code",
      label: "Code",
      description:
        "Scripts, computational models, analysis pipelines, or other code/tools used in the study.",
    },
  ];

  const toggleSelection = (value) => {
    toggleComponent(value);
  };

  return (
    <FullWidthContainer>
      <Stack spacing="md">
        {options.map((option) => {
          const isDisabled = option.dependsOn && !selectedComponents.includes(option.dependsOn);
          const isSelected = selectedComponents.includes(option.value);

          return (
            <Card
              key={option.value}
              withBorder
              shadow="sm"
              padding="lg"
              style={{
                opacity: isDisabled ? 0.6 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
                backgroundColor: isSelected ? "#e8f5e9" : "white", // Light green for selected
                borderColor: isSelected ? "var(--color-light-green)" : "#e0e0e0",
                borderWidth: isSelected ? 2 : 1,
                borderStyle: "solid",
              }}
              onClick={() => {
                if (!isDisabled) {
                  toggleSelection(option.value);
                }
              }}
            >
              <Group position="apart" align="flex-start">
                <Text weight={500} size="lg">
                  {option.label}
                </Text>
              </Group>
              <Text c="dimmed" size="sm" mt="xs">
                {option.description}
              </Text>
            </Card>
          );
        })}
      </Stack>
    </FullWidthContainer>
  );
};

export default DatasetContentSelector;
