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
  Button,
  Paper,
  Divider,
} from "@mantine/core";
import { IconUser, IconFlask, IconClipboard, IconPin } from "@tabler/icons-react";

// Helper: generates a child ID by replacing the parent's prefix with the given one,
// then appending "-" and the childLabel. For samples we append an index; for sites/performances,
// pass appendIndex as false.
const generateChildId = (parentId, childPrefix, childLabel, childIndex, appendIndex = true) => {
  const dashIndex = parentId.indexOf("-");
  const rest = dashIndex >= 0 ? parentId.substring(dashIndex) : "";
  return appendIndex
    ? `${childPrefix}${rest}-${childLabel}-${childIndex}`
    : `${childPrefix}${rest}-${childLabel}`;
};

const DatasetEntityStructurePage = () => {
  const [subjectCount, setSubjectCount] = useState(1);
  const [subjectMiddle, setSubjectMiddle] = useState("mouse");
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);

  // Update our initial sampleTypes to include arrays for siteLabels and performanceLabels.
  const initialSampleTypes = [
    {
      count: 1,
      label: "tissue",
      siteCount: selectedEntities.includes("sample-sites") ? 1 : 0,
      siteLabels: selectedEntities.includes("sample-sites") ? ["site"] : [],
      performanceCount: selectedEntities.includes("sample-performances") ? 1 : 0,
      performanceLabels: selectedEntities.includes("sample-performances") ? ["performance"] : [],
    },
    {
      count: 2,
      label: "blood",
      siteCount: selectedEntities.includes("sample-sites") ? 1 : 0,
      siteLabels: selectedEntities.includes("sample-sites") ? ["site"] : [],
      performanceCount: selectedEntities.includes("sample-performances") ? 1 : 0,
      performanceLabels: selectedEntities.includes("sample-performances") ? ["performance"] : [],
    },
  ];
  const [sampleTypes, setSampleTypes] = useState(initialSampleTypes);
  const [dataStructure, setDataStructure] = useState({ subjects: [] });

  // Whenever subjects/samples change, re-create the data structure.
  useEffect(() => {
    if (!subjectMiddle.trim()) return;

    const newSubjects = Array.from({ length: subjectCount }, (_, i) => {
      // Subject ID: always prefixed with "sub"
      const subjectId =
        subjectCount === 1 ? `sub-${subjectMiddle}-1` : `sub-${subjectMiddle}-${i + 1}`;
      // Create samples from each sampleType.
      const samples = sampleTypes
        .filter((sampleType) => sampleType.label.trim())
        .flatMap((sampleType) => createSamples(subjectId, sampleType));
      return { id: subjectId, samples };
    });

    setDataStructure({ subjects: newSubjects });
  }, [subjectCount, sampleTypes, subjectMiddle, selectedEntities]);

  // Create sample IDs (with auto‑increment) using the subject’s ID as parent.
  const createSamples = (parentId, sampleType) => {
    return Array.from({ length: sampleType.count }, (_, sampleInstance) => {
      const sampleId = generateChildId(parentId, "sam", sampleType.label, sampleInstance + 1, true);
      const performances = selectedEntities.includes("sample-performances")
        ? createPerformances(sampleId, sampleType)
        : [];
      const sites = selectedEntities.includes("sample-sites")
        ? createSites(sampleId, sampleType)
        : [];
      return { id: sampleId, label: sampleType.label, performances, sites };
    });
  };

  // For performances, use the custom labels provided by the user (no auto‑increment).
  const createPerformances = (parentId, sampleType) => {
    return sampleType.performanceLabels.map((label) => {
      const perfId = generateChildId(parentId, "perf", label, 0, false);
      return { id: perfId, label };
    });
  };

  // For sites, use the custom labels provided by the user.
  const createSites = (parentId, sampleType) => {
    return sampleType.siteLabels.map((label) => {
      const siteId = generateChildId(parentId, "site", label, 0, false);
      return { id: siteId, label };
    });
  };

  // Handlers for top-level sample type fields.
  const handleSampleTypeChange = (index, field, value) => {
    setSampleTypes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // When the overall number of sample types changes.
  const handleSampleCountChange = (count) => {
    setSampleTypes(
      Array.from({ length: count }, () => ({
        label: "",
        count: 1,
        siteCount: selectedEntities.includes("sample-sites") ? 1 : 0,
        siteLabels: selectedEntities.includes("sample-sites") ? ["site"] : [],
        performanceCount: selectedEntities.includes("sample-performances") ? 1 : 0,
        performanceLabels: selectedEntities.includes("sample-performances") ? ["performance"] : [],
      }))
    );
  };

  // Handlers for updating site labels.
  const handleSiteCountChange = (sampleIndex, value) => {
    setSampleTypes((prev) => {
      const updated = [...prev];
      updated[sampleIndex].siteCount = value;
      const currentLabels = updated[sampleIndex].siteLabels || [];
      if (value > currentLabels.length) {
        updated[sampleIndex].siteLabels = [
          ...currentLabels,
          ...Array(value - currentLabels.length).fill("site"),
        ];
      } else {
        updated[sampleIndex].siteLabels = currentLabels.slice(0, value);
      }
      return updated;
    });
  };

  const handleSiteLabelChange = (sampleIndex, siteIndex, newValue) => {
    setSampleTypes((prev) => {
      const updated = [...prev];
      const labels = updated[sampleIndex].siteLabels;
      labels[siteIndex] = newValue;
      updated[sampleIndex].siteLabels = [...labels];
      return updated;
    });
  };

  // Handlers for updating performance labels.
  const handlePerformanceCountChange = (sampleIndex, value) => {
    setSampleTypes((prev) => {
      const updated = [...prev];
      updated[sampleIndex].performanceCount = value;
      const currentLabels = updated[sampleIndex].performanceLabels || [];
      if (value > currentLabels.length) {
        updated[sampleIndex].performanceLabels = [
          ...currentLabels,
          ...Array(value - currentLabels.length).fill("performance"),
        ];
      } else {
        updated[sampleIndex].performanceLabels = currentLabels.slice(0, value);
      }
      return updated;
    });
  };

  const handlePerformanceLabelChange = (sampleIndex, perfIndex, newValue) => {
    setSampleTypes((prev) => {
      const updated = [...prev];
      const labels = updated[sampleIndex].performanceLabels;
      labels[perfIndex] = newValue;
      updated[sampleIndex].performanceLabels = [...labels];
      return updated;
    });
  };

  // Render inputs for each sample type.
  const renderSampleTypeInputs = (sampleType, index) => (
    <Stack key={index} spacing="xs" mb="md">
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
        <Stack spacing="xs" mb="md">
          <NumberInput
            label={`Number of sites for ${sampleType.label || "samples"}`}
            value={sampleType.siteCount}
            onChange={(value) => handleSiteCountChange(index, value)}
            min={0}
            max={10}
            step={1}
          />
          {Array.from({ length: sampleType.siteCount }).map((_, siteIdx) => (
            <TextInput
              key={siteIdx}
              label={`Label for site ${siteIdx + 1} in ${sampleType.label || "samples"}`}
              value={sampleType.siteLabels?.[siteIdx] || ""}
              onChange={(e) => handleSiteLabelChange(index, siteIdx, e.target.value)}
            />
          ))}
        </Stack>
      )}

      {selectedEntities.includes("sample-performances") && (
        <Stack spacing="xs" mb="md">
          <NumberInput
            label={`Number of performances for ${sampleType.label || "samples"}`}
            value={sampleType.performanceCount}
            onChange={(value) => handlePerformanceCountChange(index, value)}
            min={0}
            max={10}
            step={1}
          />
          {Array.from({ length: sampleType.performanceCount }).map((_, perfIdx) => (
            <TextInput
              key={perfIdx}
              label={`Label for performance ${perfIdx + 1} in ${sampleType.label || "samples"}`}
              value={sampleType.performanceLabels?.[perfIdx] || ""}
              onChange={(e) => handlePerformanceLabelChange(index, perfIdx, e.target.value)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );

  // Render the generated data structure.
  const renderSubjectSamples = (subject) => (
    <Box
      key={subject.id}
      sx={{ border: "1px solid #ddd", borderRadius: "8px", padding: "8px", marginBottom: "8px" }}
    >
      <Flex gap="xs" justify="flex-start" align="center">
        <IconUser size={15} />
        <Text fw={600}>{subject.id}</Text>
      </Flex>

      {subject.samples.length > 0 && (
        <Box ml="sm" pl="xs" style={{ borderLeft: "2px solid green" }}>
          {subject.samples.map((sample) => (
            <Box key={sample.id} ml="xs" mb="4px">
              <Flex gap="xs" justify="flex-start" align="center">
                <IconFlask size={15} />
                <Text fw={500}>{sample.id}</Text>
              </Flex>
              {sample.performances.length > 0 && (
                <Box ml="sm" pl="xs" style={{ borderLeft: "2px solid blue" }}>
                  {sample.performances.map((performance) => (
                    <Flex key={performance.id} gap="xs" justify="flex-start" align="center">
                      <IconClipboard size={15} />
                      <Text>{performance.id}</Text>
                    </Flex>
                  ))}
                </Box>
              )}
              {sample.sites.length > 0 && (
                <Box ml="sm" pl="xs" style={{ borderLeft: "2px solid orange" }}>
                  {sample.sites.map((site) => (
                    <Flex key={site.id} gap="xs" justify="flex-start" align="center">
                      <IconPin size={15} />
                      <Text>{site.id}</Text>
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
        <Stack spacing="md">
          {/* Subjects Section */}
          <Paper withBorder shadow="sm" p="md">
            <Text size="lg" weight={700} mb="sm">
              Subjects
            </Text>
            {selectedEntities.includes("subjects") && (
              <Stack spacing="md">
                <NumberInput
                  label="How many species of subjects did you collect data from?"
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
          </Paper>

          <Divider my="md" />

          {/* Samples Section */}
          <Paper withBorder shadow="sm" p="md">
            <Text size="lg" weight={700} mb="sm">
              Samples
            </Text>
            {selectedEntities.includes("samples") && (
              <>
                <NumberInput
                  label="How many types of samples did you collect?"
                  value={sampleTypes.length}
                  onChange={handleSampleCountChange}
                  min={1}
                  max={10}
                  step={1}
                />
                {sampleTypes.map(renderSampleTypeInputs)}
              </>
            )}
          </Paper>

          <Divider my="md" />

          {/* Data Structure Preview Section */}
          <Paper withBorder shadow="sm" p="md">
            <Text size="lg" weight={700} mb="sm">
              Data Structure Preview
            </Text>
            <Text mb="md">
              Please verify the structure of the dataset entities below is correct before
              proceeding.
            </Text>
            {dataStructure.subjects.length > 0 && (
              <Stack spacing="3px">{dataStructure.subjects.map(renderSubjectSamples)}</Stack>
            )}
          </Paper>

          <Button
            mt="md"
            onClick={() => {
              setDataStructure({ subjects: [] });
              setSubjectCount(1);
              setSubjectMiddle("mouse");
              setSampleTypes(initialSampleTypes);
            }}
          >
            Reset entity structure
          </Button>
        </Stack>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityStructurePage;
