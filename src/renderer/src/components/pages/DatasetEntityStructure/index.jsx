import { useState, useEffect } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { TextInput, NumberInput, Text, Stack, Group, Box, Flex, Checkbox } from "@mantine/core";
import { IconUser, IconFlask } from "@tabler/icons-react";

const DatasetEntityStructurePage = () => {
  const [subjects, setSubjects] = useState([]);
  const [subjectCount, setSubjectCount] = useState(1);
  const [subjectMiddle, setSubjectMiddle] = useState("");
  const [sampleTypes, setSampleTypes] = useState([
    { label: "", count: 1, sampleHasSites: false, sampleHasPerformances: false },
  ]);

  useEffect(() => {
    if (!subjectMiddle.trim()) return;

    setSubjects(
      Array.from({ length: subjectCount }, (_, i) => {
        const subjectId =
          subjectCount === 1 ? `sub-${subjectMiddle}-1` : `sub-${subjectMiddle}-${i + 1}`;
        const samples = sampleTypes
          .filter((sampleType) => sampleType.label.trim())
          .flatMap((sampleType, sampleIndex) => {
            return Array.from({ length: sampleType.count }, (_, sampleInstance) => {
              const sampleId =
                sampleType.count === 1
                  ? `sam-${subjectMiddle}-${i + 1}-${sampleType.label}`
                  : `sam-${subjectMiddle}-${i + 1}-${sampleType.label}-${sampleInstance + 1}`;

              const performances = sampleType.sampleHasPerformances
                ? Array.from({ length: sampleType.count }, (_, perfIndex) => ({
                    id: `perf-${subjectMiddle}-${i + 1}-${sampleType.label}-${
                      sampleInstance + 1
                    }-run-${perfIndex + 1}`,
                    label: `Performance ${perfIndex + 1}`,
                  }))
                : [];

              return { id: sampleId, label: sampleType.label, performances };
            });
          });

        return { id: subjectId, samples };
      })
    );
  }, [subjectCount, sampleTypes, subjectMiddle]);

  const handleSampleTypeChange = (index, field, value) => {
    const newSampleTypes = [...sampleTypes];
    newSampleTypes[index] = { ...newSampleTypes[index], [field]: value };
    setSampleTypes(newSampleTypes);
  };

  return (
    <GuidedModePage pageHeader="Generate IDs to associate data with">
      <GuidedModeSection>
        <Text mb="md">
          Provide details about the subjects you collected data from to generate unique IDs for data
          association.
        </Text>
        <Stack spacing="md">
          <NumberInput
            label="How many subjects did you collect data from?"
            value={subjectCount}
            onChange={setSubjectCount}
            min={1}
            max={100}
            step={1}
          />
          <TextInput
            label="Enter a label to identify the subjects"
            placeholder="e.g., mouse"
            value={subjectMiddle}
            onChange={(e) => setSubjectMiddle(e.target.value)}
          />
        </Stack>

        <NumberInput
          label="How many types of samples did you collect?"
          value={sampleTypes.length}
          onChange={(count) =>
            setSampleTypes(
              Array.from({ length: count }, () => ({
                label: "",
                count: 1,
                sampleHasSites: false,
                sampleHasPerformances: false,
              }))
            )
          }
          min={1}
          max={10}
          step={1}
        />

        {sampleTypes.map((sampleType, index) => (
          <Stack key={index} spacing="xs">
            <Group align="flex-start" w="100%">
              <TextInput
                label={`Label for sample type ${index + 1}`}
                value={sampleType.label}
                onChange={(e) => handleSampleTypeChange(index, "label", e.target.value)}
                placeholder="e.g., tissue"
                flex={1}
              />
              <NumberInput
                label={`Number of ${sampleType.label || "samples"} collected`}
                value={sampleType.count}
                onChange={(value) => handleSampleTypeChange(index, "count", value)}
                min={1}
                max={200}
                step={1}
                flex={1}
              />
            </Group>
            <Checkbox
              label={`Data was collected from multiple sites from ${sampleType.label || "samples"}`}
              checked={sampleType.sampleHasSites}
              onChange={(e) => handleSampleTypeChange(index, "sampleHasSites", e.target.checked)}
              flex={1}
            />
            <Checkbox
              label={`Multiple tests were performed on ${sampleType.label || "samples"}`}
              checked={sampleType.sampleHasPerformances}
              onChange={(e) =>
                handleSampleTypeChange(index, "sampleHasPerformances", e.target.checked)
              }
              flex={1}
            />
          </Stack>
        ))}

        <Text mt="md">
          Please verify the structure of the dataset entities below is correct before proceeding.
        </Text>

        {subjects.length > 0 && (
          <Stack spacing="3px">
            {subjects.map((subject) => (
              <Box key={subject.id} sx={{ border: "1px solid #ddd", borderRadius: "8px" }}>
                <Flex gap="xs" justify="flex-start" align="center">
                  <IconUser size={15} />
                  <Text fw={600}>{subject.id}</Text>
                </Flex>

                {subject.samples.length > 0 && (
                  <Box ml="sm" pl="xs" style={{ borderLeft: "2px solid green" }}>
                    {subject.samples.map((sample) => (
                      <Box key={sample.id} ml="xs">
                        <Flex gap="xs" justify="flex-start" align="center">
                          <IconFlask size={15} />
                          <Text fw={500}>{sample.id}</Text>
                        </Flex>
                        {sample.performances.length > 0 && (
                          <Box ml="sm" pl="xs" style={{ borderLeft: "2px solid blue" }}>
                            {sample.performances.map((performance) => (
                              <Text key={performance.id}>{performance.id}</Text>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityStructurePage;
