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
  Paper,
  Divider,
} from "@mantine/core";
import { IconUser, IconFlask, IconClipboard, IconPin } from "@tabler/icons-react";
import { setZustandStoreDatasetEntityStructure } from "../../../stores/slices/datasetEntityStructureSlice";

// Helper: Generates a child ID using the parent's ID, a prefix, a label, and an index.
const generateChildId = (parentId, childPrefix, childLabel, childIndex, appendIndex = true) => {
  // The label (e.g., a sample type) is used in the generated ID.
  const dashIndex = parentId.indexOf("-");
  const rest = dashIndex >= 0 ? parentId.substring(dashIndex) : "";
  return appendIndex
    ? `${childPrefix}${rest}-${childLabel}-${childIndex}`
    : `${childPrefix}${rest}-${childLabel}`;
};

const DatasetEntityStructurePage = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);

  // The organism configuration is used to build subjects.
  // species is used only for ID generation.
  const initialOrganism = {
    subjectCount: 1,
    species: "mouse",
    metadata: {},
    // Subject-level sites/performances (if enabled)
    subjectSiteCount: selectedEntities.includes("subject-sites") ? 1 : 0,
    subjectPerformanceCount: selectedEntities.includes("subject-performances") ? 1 : 0,
    // Sample-related configuration
    sampleTypes: [
      {
        label: "tissue", // used only for ID generation
        count: 1,
        metadata: {},
        siteCount: selectedEntities.includes("sample-sites") ? 1 : 0,
        performanceCount: selectedEntities.includes("sample-performances") ? 1 : 0,
      },
      {
        label: "blood",
        count: 2,
        metadata: {},
        siteCount: selectedEntities.includes("sample-sites") ? 1 : 0,
        performanceCount: selectedEntities.includes("sample-performances") ? 1 : 0,
      },
    ],
  };

  // Even though the UI groups configuration by organism,
  // the final JSON is a flat array of subjects.
  const [organisms, setOrganisms] = useState([initialOrganism]);
  const [datasetEntityStructure, setDataEntityStructure] = useState({ subjects: [] });
  console.log("datasetEntityStructure", datasetEntityStructure);

  useEffect(() => {
    const newSubjects = organisms
      .filter((org) => org.species.trim())
      .flatMap((org) =>
        Array.from({ length: org.subjectCount }, (_, i) => {
          // Generate subjectId using the organism's species.
          const subjectId =
            org.subjectCount === 1 ? `sub-${org.species}-1` : `sub-${org.species}-${i + 1}`;
          // Generate subject-level sites and performances if applicable.
          const subjectSites = selectedEntities.includes("subject-sites")
            ? createSubjectSites(subjectId, org)
            : [];
          const subjectPerformances = selectedEntities.includes("subject-performances")
            ? createSubjectPerformances(subjectId, org)
            : [];
          // Generate samples only if "samples" is selected.
          const samples = selectedEntities.includes("samples")
            ? org.sampleTypes
                .filter((sampleType) => sampleType.label.trim())
                .flatMap((sampleType) => createSamples(subjectId, sampleType))
            : [];
          return {
            subjectId,
            metadata: {},
            ...(selectedEntities.includes("subject-sites") && { subjectSites }),
            ...(selectedEntities.includes("subject-performances") && { subjectPerformances }),
            ...(selectedEntities.includes("samples") && { samples }),
          };
        })
      );
    setDataEntityStructure({ subjects: newSubjects });
    setZustandStoreDatasetEntityStructure({ subjects: newSubjects });
  }, [organisms, selectedEntities]);

  // Helper functions for subject-level sites and performances.
  const createSubjectSites = (subjectId, organism) => {
    return Array.from({ length: organism.subjectSiteCount }, (_, idx) => {
      const siteId = `site-${subjectId}-site-${idx + 1}`;
      return { siteId, metadata: {} };
    });
  };

  const createSubjectPerformances = (subjectId, organism) => {
    return Array.from({ length: organism.subjectPerformanceCount }, (_, idx) => {
      const performanceId = `perf-${subjectId}-perf-${idx + 1}`;
      return { performanceId, metadata: {} };
    });
  };

  // Create samples for a subject.
  const createSamples = (parentId, sampleType) => {
    return Array.from({ length: sampleType.count }, (_, sampleInstance) => {
      const sampleId = generateChildId(parentId, "sam", sampleType.label, sampleInstance + 1, true);
      const sampleSites = selectedEntities.includes("sample-sites")
        ? createSampleSites(sampleId, sampleType)
        : [];
      const samplePerformances = selectedEntities.includes("sample-performances")
        ? createSamplePerformances(sampleId, sampleType)
        : [];
      return {
        sampleId,
        metadata: {},
        ...(selectedEntities.includes("sample-sites") && { sites: sampleSites }),
        ...(selectedEntities.includes("sample-performances") && {
          performances: samplePerformances,
        }),
      };
    });
  };

  const createSampleSites = (parentId, sampleType) => {
    return Array.from({ length: sampleType.siteCount }, (_, idx) => {
      const siteId = generateChildId(parentId, "site", sampleType.label, idx + 1, true);
      return { siteId, metadata: {} };
    });
  };

  const createSamplePerformances = (parentId, sampleType) => {
    return Array.from({ length: sampleType.performanceCount }, (_, idx) => {
      const performanceId = generateChildId(parentId, "perf", sampleType.label, idx + 1, true);
      return { performanceId, metadata: {} };
    });
  };

  // ─── Organism / Subject Handlers ─────────────────────────────

  const handleOrganismCountChange = (count) => {
    setOrganisms((prev) => {
      const newCount = count || 0;
      const newOrgs = [...prev];
      while (newOrgs.length < newCount) {
        newOrgs.push({
          subjectCount: 1,
          species: "",
          metadata: {},
          subjectSiteCount: selectedEntities.includes("subject-sites") ? 1 : 0,
          subjectPerformanceCount: selectedEntities.includes("subject-performances") ? 1 : 0,
          sampleTypes: [
            {
              label: "",
              count: 1,
              metadata: {},
              siteCount: selectedEntities.includes("sample-sites") ? 1 : 0,
              performanceCount: selectedEntities.includes("sample-performances") ? 1 : 0,
            },
          ],
        });
      }
      return newOrgs.slice(0, newCount);
    });
  };

  const handleSpeciesNameChange = (index, value) => {
    setOrganisms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], species: value };
      return updated;
    });
  };

  const handleSubjectCountChange = (index, value) => {
    setOrganisms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], subjectCount: value || 1 };
      return updated;
    });
  };

  // ─── Handlers for Subject-Level Options (sites and performances) ─────

  const handleOrganismSubjectSiteCountChange = (orgIndex, value) => {
    setOrganisms((prev) => {
      const updated = [...prev];
      updated[orgIndex].subjectSiteCount = value;
      return updated;
    });
  };

  const handleOrganismSubjectPerformanceCountChange = (orgIndex, value) => {
    setOrganisms((prev) => {
      const updated = [...prev];
      updated[orgIndex].subjectPerformanceCount = value;
      return updated;
    });
  };

  // ─── Sample Type Handlers for Each Organism ─────────────────────────────
  // (These controls are only relevant if "samples" is selected.)
  const handleOrganismSampleCountChange = (orgIndex, count) => {
    setOrganisms((prev) => {
      const updated = [...prev];
      const current = updated[orgIndex].sampleTypes;
      const newCount = count || 0;
      if (newCount > current.length) {
        const defaults = Array(newCount - current.length)
          .fill(null)
          .map(() => ({
            label: "",
            count: 1,
            metadata: {},
            siteCount: selectedEntities.includes("sample-sites") ? 1 : 0,
            performanceCount: selectedEntities.includes("sample-performances") ? 1 : 0,
          }));
        updated[orgIndex].sampleTypes = [...current, ...defaults];
      } else {
        updated[orgIndex].sampleTypes = current.slice(0, newCount);
      }
      return updated;
    });
  };

  const handleOrganismSampleTypeChange = (orgIndex, sampleIndex, field, value) => {
    setOrganisms((prev) => {
      const updated = [...prev];
      updated[orgIndex].sampleTypes[sampleIndex] = {
        ...updated[orgIndex].sampleTypes[sampleIndex],
        [field]: value,
      };
      return updated;
    });
  };

  const handleOrganismSiteCountChange = (orgIndex, sampleIndex, value) => {
    setOrganisms((prev) => {
      const updated = [...prev];
      updated[orgIndex].sampleTypes[sampleIndex].siteCount = value;
      return updated;
    });
  };

  const handleOrganismPerformanceCountChange = (orgIndex, sampleIndex, value) => {
    setOrganisms((prev) => {
      const updated = [...prev];
      updated[orgIndex].sampleTypes[sampleIndex].performanceCount = value;
      return updated;
    });
  };

  // ─── Rendering Functions ─────────────────────────────

  // Render inputs for each sample type.
  // This section is only rendered if "samples" is in selectedEntities.
  const renderOrganismSampleTypeInputs = (orgIndex, sampleType, sampleIndex) => (
    <Stack key={sampleIndex} spacing="xs" my="md">
      <Group align="flex-start" w="100%">
        <TextInput
          label={`Enter sample type for sample ${sampleIndex + 1}:`}
          value={sampleType.label}
          onChange={(e) =>
            handleOrganismSampleTypeChange(orgIndex, sampleIndex, "label", e.target.value)
          }
          placeholder="e.g., tissue"
          flex={1}
        />
        {sampleType.label && (
          <NumberInput
            label={`Number of ${sampleType.label} samples per subject:`}
            value={sampleType.count}
            onChange={(value) =>
              handleOrganismSampleTypeChange(orgIndex, sampleIndex, "count", value)
            }
            min={1}
            max={200}
            step={1}
            flex={1}
          />
        )}
      </Group>

      {selectedEntities.includes("sample-sites") && (
        <Stack spacing="xs" mb="md">
          <NumberInput
            label={`Number of sites for ${sampleType.label || "samples"}`}
            value={sampleType.siteCount}
            onChange={(value) => handleOrganismSiteCountChange(orgIndex, sampleIndex, value)}
            min={0}
            max={10}
            step={1}
          />
        </Stack>
      )}

      {selectedEntities.includes("sample-performances") && (
        <Stack spacing="xs" mb="md">
          <NumberInput
            label={`Number of performances for ${sampleType.label || "samples"}`}
            value={sampleType.performanceCount}
            onChange={(value) => handleOrganismPerformanceCountChange(orgIndex, sampleIndex, value)}
            min={0}
            max={10}
            step={1}
          />
        </Stack>
      )}
    </Stack>
  );

  // Render configuration for a single organism.
  const renderOrganism = (organism, orgIndex) => (
    <Paper key={orgIndex} withBorder shadow="xs" p="md" my="sm">
      <Text size="md" fw={600}>{`Organism ${orgIndex + 1}`}</Text>
      <TextInput
        label="Species or Organism Name"
        placeholder="e.g., mouse"
        value={organism.species}
        onChange={(e) => handleSpeciesNameChange(orgIndex, e.target.value)}
      />
      <NumberInput
        label="How many subjects did you collect data from for this species or organism?"
        value={organism.subjectCount}
        onChange={(value) => handleSubjectCountChange(orgIndex, value)}
        min={1}
        max={100}
        step={1}
        mt="sm"
      />
      {selectedEntities.includes("subject-sites") && (
        <NumberInput
          label="Number of subject sites for this species"
          value={organism.subjectSiteCount}
          onChange={(value) => handleOrganismSubjectSiteCountChange(orgIndex, value)}
          min={0}
          max={10}
          step={1}
        />
      )}
      {selectedEntities.includes("subject-performances") && (
        <NumberInput
          label="Number of subject performances for this species or organism"
          value={organism.subjectPerformanceCount}
          onChange={(value) => handleOrganismSubjectPerformanceCountChange(orgIndex, value)}
          min={0}
          max={10}
          step={1}
        />
      )}
      {selectedEntities.includes("samples") && (
        <>
          <Divider my="md" />
          <Text size="md" fw={600}>
            {`${organism.species} samples`}
          </Text>
          <NumberInput
            label="How many types of samples did you collect from each subject?"
            value={organism.sampleTypes.length}
            onChange={(value) => handleOrganismSampleCountChange(orgIndex, value)}
            min={1}
            max={10}
            step={1}
          />
          {organism.sampleTypes.map((sampleType, sampleIndex) =>
            renderOrganismSampleTypeInputs(orgIndex, sampleType, sampleIndex)
          )}
        </>
      )}
    </Paper>
  );

  // Render a preview for a single subject.
  const renderSubjectSamples = (subject) => (
    <Box
      key={subject.subjectId}
      sx={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "8px",
        marginBottom: "8px",
      }}
    >
      <Flex gap="xs" align="center">
        <IconUser size={15} />
        <Text fw={600}>{subject.subjectId}</Text>
      </Flex>
      {subject.subjectSites && subject.subjectSites.length > 0 && (
        <Box ml="xs" pl="xs" style={{ borderLeft: "2px solid purple" }}>
          {subject.subjectSites.map((site) => (
            <Flex key={site.siteId} gap="xs" align="center">
              <IconPin size={15} />
              <Text>{site.siteId}</Text>
            </Flex>
          ))}
        </Box>
      )}
      {subject.subjectPerformances && subject.subjectPerformances.length > 0 && (
        <Box ml="xs" pl="xs" style={{ borderLeft: "2px solid teal" }}>
          {subject.subjectPerformances.map((performance) => (
            <Flex key={performance.performanceId} gap="xs" align="center">
              <IconClipboard size={15} />
              <Text>{performance.performanceId}</Text>
            </Flex>
          ))}
        </Box>
      )}
      {selectedEntities.includes("samples") && subject.samples.length > 0 && (
        <Box ml="xs" pl="xs" style={{ borderLeft: "2px solid green" }}>
          {subject.samples.map((sample) => (
            <Box key={sample.sampleId} ml="xs" mb="4px">
              <Flex gap="xs" align="center">
                <IconFlask size={15} />
                <Text fw={500}>{sample.sampleId}</Text>
              </Flex>
              {sample.sites && sample.sites.length > 0 && (
                <Box ml="xs" pl="xs" style={{ borderLeft: "2px solid orange" }}>
                  {sample.sites.map((site) => (
                    <Flex key={site.siteId} gap="xs" align="center">
                      <IconPin size={15} />
                      <Text>{site.siteId}</Text>
                    </Flex>
                  ))}
                </Box>
              )}
              {sample.performances && sample.performances.length > 0 && (
                <Box ml="xs" pl="xs" style={{ borderLeft: "2px solid blue" }}>
                  {sample.performances.map((performance) => (
                    <Flex key={performance.performanceId} gap="xs" align="center">
                      <IconClipboard size={15} />
                      <Text>{performance.performanceId}</Text>
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
    <GuidedModePage pageHeader="Generate IDs to Associate Data With">
      <GuidedModeSection>
        <Text>
          Provide details about the organisms, subjects, and sample types from which you collected
          data. Depending on the selected options, sites and performances can be configured at both
          the subject and sample levels. If "samples" is not selected, no sample-related questions
          will be shown and no sample data will be added.
        </Text>
      </GuidedModeSection>
      <GuidedModeSection>
        <Stack spacing="md">
          {/* Organisms / Subjects Configuration */}
          <Paper withBorder shadow="sm" p="md">
            <Text size="lg" fw={700} mb="sm">
              Organisms / Subjects Configuration
            </Text>
            <NumberInput
              label="How many different organisms or species did you collect data from?"
              value={organisms.length}
              onChange={handleOrganismCountChange}
              min={1}
              max={10}
              step={1}
            />
            {organisms.map(renderOrganism)}
          </Paper>

          <Divider my="md" />

          {/* Data Structure Preview */}
          <Paper withBorder shadow="sm" p="md" mb="sm">
            <Text size="lg" fw={700} mb="sm">
              Data Structure Preview
            </Text>
            <Text mb="md">
              Please verify that the generated structure below is correct before proceeding.
            </Text>
            {datasetEntityStructure.subjects && datasetEntityStructure.subjects.length > 0 && (
              <Stack spacing="3px">
                {datasetEntityStructure.subjects.map(renderSubjectSamples)}
              </Stack>
            )}
          </Paper>
        </Stack>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityStructurePage;
