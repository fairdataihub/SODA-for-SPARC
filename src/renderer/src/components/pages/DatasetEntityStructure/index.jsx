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
import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";

/**
 * Generates a child ID based on the parent's ID.
 *
 * @param {string} parentId - The parent's ID.
 * @param {string} childPrefix - The prefix for the child (e.g., "sam").
 * @param {string} childLabel - A label for the child (e.g., sample type).
 * @param {number} childIndex - The child’s index (1-based).
 * @param {boolean} appendIndex - Whether to append the index.

 * @returns {string} The generated child ID.
 */
const generateChildId = (parentId, childPrefix, childLabel, childIndex, appendIndex = true) => {
  const dashIndex = parentId.indexOf("-");
  const rest = dashIndex >= 0 ? parentId.substring(dashIndex) : "";
  return appendIndex
    ? `${childPrefix}${rest}-${childLabel}-${childIndex}`
    : `${childPrefix}${rest}-${childLabel}`;
};

const DatasetEntityStructurePage = () => {
  // Global configuration for what entities to include.
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);

  // The list of species configurations (each containing sample info, counts, etc.)
  const [speciesList, setSpeciesList] = useState([]);
  // Main data structure: an array of subjects.
  const [datasetEntityArray, setDatasetEntityArray] = useState([]);
  console.log("subjects", datasetEntityArray);

  /**
   * When the speciesList or selectedEntities change, rebuild the subjects array.
   */
  useEffect(() => {
    const newSubjects = speciesList
      .filter((sp) => sp.species.trim())
      .flatMap((sp) =>
        Array.from({ length: sp.subjectCount }, (_, i) => {
          const subjectId = `sub-${sp.species}-${i + 1}`;
          const subjectSites = selectedEntities.includes("subject-sites")
            ? createSubjectSites(subjectId, sp)
            : [];
          const subjectPerformances = selectedEntities.includes("subject-performances")
            ? createSubjectPerformances(subjectId, sp)
            : [];
          const samples = selectedEntities.includes("samples")
            ? sp.sampleTypes
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
    setDatasetEntityArray(newSubjects);
    // Update the global store with the new array of subjects.
    setZustandStoreDatasetEntityStructure(newSubjects);
  }, [speciesList, selectedEntities]);

  // ─── Helper Functions for Generating Entities ─────────────────────────────

  const createSubjectSites = (subjectId, species) =>
    Array.from({ length: species.subjectSiteCount }, (_, idx) => ({
      siteId: `site-${subjectId}-site-${idx + 1}`,
      metadata: {},
    }));

  const createSubjectPerformances = (subjectId, species) =>
    Array.from({ length: species.subjectPerformanceCount }, (_, idx) => ({
      performanceId: `perf-${subjectId}-perf-${idx + 1}`,
      metadata: {},
    }));

  const createSamples = (parentId, sampleType) =>
    Array.from({ length: sampleType.count }, (_, sampleInstance) => {
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

  const createSampleSites = (parentId, sampleType) =>
    Array.from({ length: sampleType.siteCount }, (_, idx) => ({
      siteId: generateChildId(parentId, "site", sampleType.label, idx + 1, true),
      metadata: {},
    }));

  const createSamplePerformances = (parentId, sampleType) =>
    Array.from({ length: sampleType.performanceCount }, (_, idx) => ({
      performanceId: generateChildId(parentId, "perf", sampleType.label, idx + 1, true),
      metadata: {},
    }));

  // ─── Handlers for Updating Species and Sample Configurations ─────────────

  const handleSpeciesCountChange = (count) => {
    setSpeciesList((prev) => {
      const newCount = count || 0;
      const newSpecies = [...prev];
      while (newSpecies.length < newCount) {
        newSpecies.push({
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
      return newSpecies.slice(0, newCount);
    });
  };

  const handleSpeciesNameChange = (index, value) => {
    setSpeciesList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], species: value };
      return updated;
    });
  };

  const handleSubjectCountChange = (index, value) => {
    setSpeciesList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], subjectCount: value || 1 };
      return updated;
    });
  };

  const handleSpeciesSubjectSiteCountChange = (speciesIndex, value) => {
    setSpeciesList((prev) => {
      const updated = [...prev];
      updated[speciesIndex].subjectSiteCount = value;
      return updated;
    });
  };

  const handleSpeciesSubjectPerformanceCountChange = (speciesIndex, value) => {
    setSpeciesList((prev) => {
      const updated = [...prev];
      updated[speciesIndex].subjectPerformanceCount = value;
      return updated;
    });
  };

  const handleSpeciesSampleCountChange = (speciesIndex, count) => {
    setSpeciesList((prev) => {
      const updated = [...prev];
      const current = updated[speciesIndex].sampleTypes;
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
        updated[speciesIndex].sampleTypes = [...current, ...defaults];
      } else {
        updated[speciesIndex].sampleTypes = current.slice(0, newCount);
      }
      return updated;
    });
  };

  const handleSpeciesSampleTypeChange = (speciesIndex, sampleIndex, field, value) => {
    setSpeciesList((prev) => {
      const updated = [...prev];
      updated[speciesIndex].sampleTypes[sampleIndex] = {
        ...updated[speciesIndex].sampleTypes[sampleIndex],
        [field]: value,
      };
      return updated;
    });
  };

  const handleSpeciesSiteCountChange = (speciesIndex, sampleIndex, value) => {
    setSpeciesList((prev) => {
      const updated = [...prev];
      updated[speciesIndex].sampleTypes[sampleIndex].siteCount = value;
      return updated;
    });
  };

  const handleSpeciesPerformanceCountChange = (speciesIndex, sampleIndex, value) => {
    setSpeciesList((prev) => {
      const updated = [...prev];
      updated[speciesIndex].sampleTypes[sampleIndex].performanceCount = value;
      return updated;
    });
  };

  // ─── Rendering Functions ─────────────────────────────

  const renderSpeciesSampleTypeInputs = (speciesIndex, sampleType, sampleIndex) => (
    <Stack key={sampleIndex} spacing="xs" my="md">
      <Group align="flex-start" w="100%">
        <TextInput
          label={`Enter sample type for sample ${sampleIndex + 1}:`}
          value={sampleType.label}
          onChange={(e) =>
            handleSpeciesSampleTypeChange(speciesIndex, sampleIndex, "label", e.target.value)
          }
          placeholder="e.g., tissue"
          flex={1}
        />
        {sampleType.label && (
          <NumberInput
            label={`Number of ${sampleType.label} samples per subject:`}
            value={sampleType.count}
            onChange={(value) =>
              handleSpeciesSampleTypeChange(speciesIndex, sampleIndex, "count", value)
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
            onChange={(value) => handleSpeciesSiteCountChange(speciesIndex, sampleIndex, value)}
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
            onChange={(value) =>
              handleSpeciesPerformanceCountChange(speciesIndex, sampleIndex, value)
            }
            min={0}
            max={10}
            step={1}
          />
        </Stack>
      )}
    </Stack>
  );

  const renderSpecies = (species, speciesIndex) => (
    <Paper key={speciesIndex} withBorder shadow="xs" p="md" my="sm">
      <Text size="md" fw={600}>{`Species ${speciesIndex + 1}`}</Text>
      <TextInput
        label="Species Name"
        placeholder="e.g., mouse"
        value={species.species}
        onChange={(e) => handleSpeciesNameChange(speciesIndex, e.target.value)}
      />
      <NumberInput
        label="How many subjects did you collect data from for this species?"
        value={species.subjectCount}
        onChange={(value) => handleSubjectCountChange(speciesIndex, value)}
        min={1}
        max={100}
        step={1}
        mt="sm"
      />
      {selectedEntities.includes("subject-sites") && (
        <NumberInput
          label="Number of subject sites for this species"
          value={species.subjectSiteCount}
          onChange={(value) => handleSpeciesSubjectSiteCountChange(speciesIndex, value)}
          min={0}
          max={10}
          step={1}
        />
      )}
      {selectedEntities.includes("subject-performances") && (
        <NumberInput
          label="Number of subject performances for this species"
          value={species.subjectPerformanceCount}
          onChange={(value) => handleSpeciesSubjectPerformanceCountChange(speciesIndex, value)}
          min={0}
          max={10}
          step={1}
        />
      )}
      {selectedEntities.includes("samples") && (
        <>
          <Divider my="md" />
          <Text size="md" fw={600}>{`${species.species} samples`}</Text>
          <NumberInput
            label="How many types of samples did you collect from each subject?"
            value={species.sampleTypes.length}
            onChange={(value) => handleSpeciesSampleCountChange(speciesIndex, value)}
            min={1}
            max={10}
            step={1}
          />
          {species.sampleTypes.map((sampleType, sampleIndex) =>
            renderSpeciesSampleTypeInputs(speciesIndex, sampleType, sampleIndex)
          )}
        </>
      )}
    </Paper>
  );

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
      {selectedEntities.includes("samples") && subject.samples?.length > 0 && (
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
          Provide details about the entities from which you collected data during your study. This
          information will be used to generate unique IDs for data association in the following
          steps.
        </Text>
      </GuidedModeSection>
      <GuidedModeSection>
        <Stack spacing="md">
          <Paper withBorder shadow="sm" p="md">
            <NumberInput
              label="How many different species did you collect data from?"
              value={speciesList.length}
              onChange={handleSpeciesCountChange}
              min={1}
              max={10}
              step={1}
            />
            {speciesList.map(renderSpecies)}
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
            <EntityHierarchyRenderer datasetEntityArray={datasetEntityArray} />
          </Paper>
        </Stack>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityStructurePage;
