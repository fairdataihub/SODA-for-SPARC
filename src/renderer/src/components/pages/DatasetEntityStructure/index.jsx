import { useState, useEffect, useCallback } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { TextInput, NumberInput, Text, Stack, Group, Box } from "@mantine/core";
import { IconUser, IconFlask } from "@tabler/icons-react";

const DatasetEntityStructurePage = () => {
  const [subjects, setSubjects] = useState([]);
  const [subjectCount, setSubjectCount] = useState(1);
  const [subjectMiddle, setSubjectMiddle] = useState("");
  const [sampleTypeCount, setSampleTypeCount] = useState(1);
  const [sampleTypes, setSampleTypes] = useState([]);

  const generateSubjects = useCallback(() => {
    if (!subjectMiddle.trim()) return []; // Prevent subjects from generating without a valid label

    return Array.from({ length: subjectCount }, (_, i) => {
      const subjectId = `sub-${subjectMiddle}-${i + 1}`;

      const samples = sampleTypes
        .filter((sampleType) => sampleType.label.trim()) // Ensure only labeled sample types are used
        .flatMap((sampleType) =>
          Array.from({ length: sampleType.count }, (_, sampleIndex) => ({
            id: `sam-${subjectMiddle}-${i + 1}-${sampleType.label}-${sampleIndex + 1}`,
            label: sampleType.label,
          }))
        );

      return { id: subjectId, samples };
    });
  }, [subjectCount, sampleTypes, subjectMiddle]);

  useEffect(() => {
    setSubjects(generateSubjects());
  }, [subjectCount, sampleTypes, subjectMiddle, generateSubjects]);

  const handleSampleTypeChange = (index, field, value) => {
    setSampleTypes((prevSampleTypes) =>
      prevSampleTypes.map((sampleType, i) =>
        i === index ? { ...sampleType, [field]: value } : sampleType
      )
    );
  };

  useEffect(() => {
    setSampleTypes(
      Array.from({ length: sampleTypeCount }, () => ({
        label: "",
        count: 1,
      }))
    );
  }, [sampleTypeCount]);

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
          value={sampleTypeCount}
          onChange={setSampleTypeCount}
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
                label={
                  sampleType.label
                    ? `Number of ${sampleType.label} samples collected`
                    : "Number of samples"
                }
                value={sampleType.count}
                onChange={(value) => handleSampleTypeChange(index, "count", value)}
                min={1}
                max={200}
                step={1}
                flex={1}
              />
            </Group>
          </Stack>
        ))}

        <Text mt="md">
          Please verify the structure of the dataset entities below is correct before proceeding.
        </Text>

        {subjects.length > 0 && (
          <Stack spacing="3px">
            {subjects.map((subject) => (
              <Box key={subject.id} p="xs" style={{ marginTop: 10 }}>
                <Group justify="space-between" mb="xs">
                  <Group spacing="xs" align="center">
                    <IconUser />
                    <Text fw={600} size="lg">
                      {subject.id}
                    </Text>
                  </Group>
                </Group>

                {subject.samples.length > 0 &&
                  subject.samples.map((sample) => (
                    <Box key={sample.id} mt="xs" ml="md">
                      <Group justify="space-between">
                        <Group spacing="xs" align="center">
                          <IconFlask />
                          <Text fw={500} size="lg">
                            {sample.id}
                          </Text>
                        </Group>
                      </Group>
                    </Box>
                  ))}
              </Box>
            ))}
          </Stack>
        )}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityStructurePage;
