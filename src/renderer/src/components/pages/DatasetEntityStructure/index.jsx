import { useState, useEffect } from "react";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import {
  TextInput,
  NumberInput,
  Text,
  Stack,
  Group,
  Box,
  Flex,
  Checkbox,
  Button,
} from "@mantine/core";
import { IconUser, IconFlask, IconClipboard, IconPin } from "@tabler/icons-react";

const DatasetEntityStructurePage = () => {
  const [subjectCount, setSubjectCount] = useState(1);
  const [subjectMiddle, setSubjectMiddle] = useState("mouse");
  const [sampleTypes, setSampleTypes] = useState([
    { count: 1, label: "tissue", sampleHasSites: true, sampleHasPerformances: false },
    { count: 2, label: "blood", sampleHasSites: false, sampleHasPerformances: false },
  ]);
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);

  const [dataStructure, setDataStructure] = useState({ subjects: [] });
  console.log("selectedEntities", selectedEntities);
  console.log("dataStructure", dataStructure);

  useEffect(() => {
    if (!subjectMiddle.trim()) return;

    const newSubjects = Array.from({ length: subjectCount }, (_, i) => {
      const subjectId =
        subjectCount === 1 ? `sub-${subjectMiddle}-1` : `sub-${subjectMiddle}-${i + 1}`;
      const samples = sampleTypes
        .filter((sampleType) => sampleType.label.trim())
        .flatMap((sampleType, sampleIndex) => createSamples(sampleType, sampleIndex, i));

      return { id: subjectId, samples };
    });

    setDataStructure((prevState) => ({
      ...prevState,
      subjects: newSubjects,
    }));
  }, [subjectCount, sampleTypes, subjectMiddle]);

  const createSamples = (sampleType, sampleIndex, subjectIndex) => {
    return Array.from({ length: sampleType.count }, (_, sampleInstance) => {
      const sampleId =
        sampleType.count === 1
          ? `sam-${subjectMiddle}-${subjectIndex + 1}-${sampleType.label}`
          : `sam-${subjectMiddle}-${subjectIndex + 1}-${sampleType.label}-${sampleInstance + 1}`;

      const performances = sampleType.sampleHasPerformances
        ? createPerformances(sampleType, sampleIndex, subjectIndex, sampleInstance)
        : [];

      const sites = sampleType.sampleHasSites
        ? createSites(subjectIndex, sampleIndex, sampleInstance)
        : [];

      return { id: sampleId, label: sampleType.label, performances, sites };
    });
  };

  const createPerformances = (sampleType, sampleIndex, subjectIndex, sampleInstance) => {
    return Array.from({ length: sampleType.count }, (_, perfIndex) => ({
      id: `perf-${subjectMiddle}-${subjectIndex + 1}-${sampleType.label}-${
        sampleInstance + 1
      }-run-${perfIndex + 1}`,
      label: `Performance ${perfIndex + 1}`,
    }));
  };

  const createSites = (subjectIndex, sampleIndex, sampleInstance) => {
    return [
      {
        id: `site-${subjectMiddle}-${subjectIndex + 1}-${sampleIndex + 1}-${sampleInstance + 1}`,
        label: `Site ${sampleIndex + 1}`,
      },
    ];
  };

  const handleSampleTypeChange = (index, field, value) => {
    setSampleTypes((prevSampleTypes) => {
      const updatedSampleTypes = [...prevSampleTypes];
      updatedSampleTypes[index] = { ...updatedSampleTypes[index], [field]: value };
      return updatedSampleTypes;
    });
  };

  const handleSampleCountChange = (count) => {
    setSampleTypes(
      Array.from({ length: count }, () => ({
        label: "",
        count: 1,
        sampleHasSites: false,
        sampleHasPerformances: false,
      }))
    );
  };

  const renderSampleTypeInputs = (sampleType, index) => (
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
      {selectedEntities.includes("sample-sites") && (
        <Checkbox
          label={`Data was collected from multiple sites from ${sampleType.label || "samples"}`}
          checked={sampleType.sampleHasSites}
          onChange={(e) => handleSampleTypeChange(index, "sampleHasSites", e.target.checked)}
          flex={1}
        />
      )}
      {selectedEntities.includes("sample-performances") && (
        <Checkbox
          label={`Multiple tests were performed on ${sampleType.label || "samples"}`}
          checked={sampleType.sampleHasPerformances}
          onChange={(e) => handleSampleTypeChange(index, "sampleHasPerformances", e.target.checked)}
          flex={1}
        />
      )}
    </Stack>
  );

  const renderSubjectSamples = (subject) => (
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
                    <Flex gap="xs" justify="flex-start" align="center">
                      <IconClipboard size={15} />
                      <Text key={performance.id}>{performance.id}</Text>
                    </Flex>
                  ))}
                </Box>
              )}
              {sample.sites.length > 0 && (
                <Box ml="sm" pl="xs" style={{ borderLeft: "2px solid orange" }}>
                  {sample.sites.map((site) => (
                    <Flex gap="xs" justify="flex-start" align="center">
                      <IconPin size={15} />
                      <Text key={site.id}>{site.id}</Text>
                    </Flex>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    <GuidedModePage pageHeader="Generate IDs to associate data with">
      <GuidedModeSection>
        <Text mb="md">
          Provide details about the subjects you collected data from to generate unique IDs for data
          association.
        </Text>
        {selectedEntities.includes("subjects") && (
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
        )}

        {selectedEntities.includes("samples") && (
          <NumberInput
            label="How many types of samples did you collect?"
            value={sampleTypes.length}
            onChange={handleSampleCountChange}
            min={1}
            max={10}
            step={1}
          />
        )}

        {selectedEntities.includes("samples") && sampleTypes.map(renderSampleTypeInputs)}

        <Text mt="md">
          Please verify the structure of the dataset entities below is correct before proceeding.
        </Text>

        {dataStructure.subjects.length > 0 && (
          <Stack spacing="3px">{dataStructure.subjects.map(renderSubjectSamples)}</Stack>
        )}

        <Button
          mt="300px"
          onClick={() => {
            setDataStructure({ subjects: [] });
            setSubjectCount(1);
            setSubjectMiddle("mouse");
            setSampleTypes([
              { count: 1, label: "tissue", sampleHasSites: true, sampleHasPerformances: false },
              { count: 2, label: "blood", sampleHasSites: false, sampleHasPerformances: false },
            ]);
          }}
        >
          Reset entity structure
        </Button>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityStructurePage;
