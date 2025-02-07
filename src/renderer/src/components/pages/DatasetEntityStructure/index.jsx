import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import {
  TextInput,
  Text,
  Stack,
  Group,
  Button,
  Card,
  Box,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";

const DatasetEntityStructurePage = () => {
  const [subjects, setSubjects] = useState([]);
  const [newSubjectId, setNewSubjectId] = useState("");
  const [sampleInputs, setSampleInputs] = useState({});
  const [siteInputs, setSiteInputs] = useState({});
  const [performanceInputs, setPerformanceInputs] = useState({});

  const addSubject = () => {
    if (newSubjectId.trim()) {
      // Add "sub-" prefix if not already present.
      const formattedId = newSubjectId.startsWith("sub-") ? newSubjectId : `sub-${newSubjectId}`;
      setSubjects([...subjects, { id: formattedId, samples: [], sites: [], performances: [] }]);
      setNewSubjectId(""); // Clear input after adding
    }
  };

  const addSample = (subjectIndex) => {
    const sampleId = sampleInputs[subjectIndex]?.trim();
    if (sampleId) {
      // Add "sam-" prefix if not already provided.
      const formattedId = sampleId.startsWith("sam-") ? sampleId : `sam-${sampleId}`;
      const updatedSubjects = [...subjects];
      updatedSubjects[subjectIndex].samples.push({
        id: formattedId,
        sites: [],
        performances: [],
      });
      setSubjects(updatedSubjects);
      setSampleInputs({ ...sampleInputs, [subjectIndex]: "" }); // Clear input
    }
  };

  const addSiteOrPerformance = (subjectIndex, sampleIndex, type) => {
    const inputValue =
      sampleIndex === null
        ? siteInputs[subjectIndex]?.trim()
        : performanceInputs[`${subjectIndex}-${sampleIndex}`]?.trim();

    if (inputValue) {
      // Use appropriate prefix based on the type.
      const prefix = type === "sites" ? "site-" : "perf-";
      const formattedId = inputValue.startsWith(prefix) ? inputValue : `${prefix}${inputValue}`;

      const updatedSubjects = [...subjects];
      if (sampleIndex === null) {
        updatedSubjects[subjectIndex][type].push(formattedId);
        setSiteInputs({ ...siteInputs, [subjectIndex]: "" }); // Clear input
      } else {
        updatedSubjects[subjectIndex].samples[sampleIndex][type].push(formattedId);
        setPerformanceInputs({
          ...performanceInputs,
          [`${subjectIndex}-${sampleIndex}`]: "",
        }); // Clear input
      }
      setSubjects(updatedSubjects);
    }
  };

  const deleteSubject = (subjectIndex) => {
    const updatedSubjects = subjects.filter((_, index) => index !== subjectIndex);
    setSubjects(updatedSubjects);
  };

  const deleteSample = (subjectIndex, sampleIndex) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[subjectIndex].samples = updatedSubjects[subjectIndex].samples.filter(
      (_, index) => index !== sampleIndex
    );
    setSubjects(updatedSubjects);
  };

  const deleteSite = (subjectIndex, sampleIndex, siteIndex) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[subjectIndex].samples[sampleIndex].sites = updatedSubjects[
      subjectIndex
    ].samples[sampleIndex].sites.filter((_, index) => index !== siteIndex);
    setSubjects(updatedSubjects);
  };

  const deletePerformance = (subjectIndex, sampleIndex, performanceIndex) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[subjectIndex].samples[sampleIndex].performances = updatedSubjects[
      subjectIndex
    ].samples[sampleIndex].performances.filter((_, index) => index !== performanceIndex);
    setSubjects(updatedSubjects);
  };

  return (
    <GuidedModePage pageHeader="SPARC SDS Data Import - Entity Structure">
      <GuidedModeSection>
        <Text>
          For SPARC SDS data import, assign each subject a unique identifier by entering the custom
          portion of the ID below (the appropriate prefix will be added automatically). Then, for
          each subject, add associated samples, sites, and performances as needed.
        </Text>
        <Stack spacing="md">
          {/* Subject Input */}
          <Group spacing="xs" align="center" w="100%">
            <Group spacing="xs" align="center" flex={1} gap={0}>
              <Text m={0}>Sub-</Text>
              <TextInput
                flex={1}
                placeholder="Enter subject identifier (e.g., 001 or A01)"
                value={newSubjectId}
                onChange={(e) => setNewSubjectId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSubject()}
              />
            </Group>
            <Button onClick={addSubject} variant="outline">
              Add Subject
            </Button>
          </Group>

          {subjects.length === 0 ? (
            <Text mt="md" c="gray" align="center">
              No subjects have been added yet. Enter a subject identifier above to add one.
            </Text>
          ) : (
            subjects.map((subject, subjectIndex) => (
              <Card key={subject.id} shadow="sm" padding="md" withBorder style={{ marginTop: 20 }}>
                <Group justify="space-between" mb="xs">
                  <Text fw={600} size="lg">
                    {subject.id}
                  </Text>
                  <Tooltip label={`Delete ${subject.id}`} zIndex={2999}>
                    <ActionIcon color="red" onClick={() => deleteSubject(subjectIndex)}>
                      <IconTrash />
                    </ActionIcon>
                  </Tooltip>
                </Group>

                {/* Sample Input */}
                <Box mt="xs">
                  <Group spacing="xs" align="center" width="100%">
                    <TextInput
                      placeholder="Enter sample identifier (e.g., tissue-1 or brain)"
                      aria-label="Sample Identifier"
                      value={sampleInputs[subjectIndex] || ""}
                      onChange={(e) =>
                        setSampleInputs({
                          ...sampleInputs,
                          [subjectIndex]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => e.key === "Enter" && addSample(subjectIndex)}
                      flex={1}
                    />
                    <Button onClick={() => addSample(subjectIndex)} variant="outline">
                      Add Sample
                    </Button>
                  </Group>
                </Box>
                {subject.samples.length === 0 ? (
                  <Text mt="md" c="gray" align="center">
                    No samples added to {subject.id} yet. Use the field above to add one.
                  </Text>
                ) : (
                  subject.samples.map((sample, sampleIndex) => (
                    <Card
                      key={sample.id}
                      shadow="xs"
                      padding="md"
                      withBorder
                      style={{ marginTop: 10, backgroundColor: "#f9f9f9" }}
                    >
                      <Group justify="space-between" style={{ marginBottom: 10 }}>
                        <Text fw={500} size="lg">
                          {sample.id}
                        </Text>
                        <Tooltip label={`Delete ${sample.id}`} zIndex={2999}>
                          <ActionIcon
                            color="red"
                            onClick={() => deleteSample(subjectIndex, sampleIndex)}
                          >
                            <IconTrash />
                          </ActionIcon>
                        </Tooltip>
                      </Group>

                      {/* Site Input */}
                      <Box mt="md">
                        <Text size="sm" fw={500} mb={5} color="gray">
                          Sites for {sample.id}
                        </Text>
                        <Group spacing="xs" align="center" width="100%">
                          <TextInput
                            flex={1}
                            placeholder="Enter site identifier (e.g., L1 or 001)"
                            aria-label="Site Identifier"
                            value={siteInputs[subjectIndex] || ""}
                            onChange={(e) =>
                              setSiteInputs({
                                ...siteInputs,
                                [subjectIndex]: e.target.value,
                              })
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && addSiteOrPerformance(subjectIndex, null, "sites")
                            }
                          />
                          <Button
                            onClick={() => addSiteOrPerformance(subjectIndex, null, "sites")}
                            variant="outline"
                          >
                            Add Site
                          </Button>
                        </Group>
                      </Box>

                      {sample.sites.map((site, siteIndex) => (
                        <Text key={siteIndex} mt="xs" ml={20} color="gray">
                          Site: {site}
                          <ActionIcon
                            color="red"
                            ml="sm"
                            onClick={() => deleteSite(subjectIndex, sampleIndex, siteIndex)}
                          >
                            <IconTrash />
                          </ActionIcon>
                        </Text>
                      ))}

                      {/* Performance Input */}
                      <Box mt="md">
                        <Text size="sm" fw={500} mb={5} color="gray">
                          Performances for {sample.id}
                        </Text>
                        <Group spacing="xs" align="center" width="100%">
                          <TextInput
                            flex={1}
                            placeholder="Enter performance identifier (e.g., trial-1 or 001)"
                            aria-label="Performance Identifier"
                            value={performanceInputs[`${subjectIndex}-${sampleIndex}`] || ""}
                            onChange={(e) =>
                              setPerformanceInputs({
                                ...performanceInputs,
                                [`${subjectIndex}-${sampleIndex}`]: e.target.value,
                              })
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              addSiteOrPerformance(subjectIndex, sampleIndex, "performances")
                            }
                          />
                          <Button
                            onClick={() =>
                              addSiteOrPerformance(subjectIndex, sampleIndex, "performances")
                            }
                            variant="outline"
                          >
                            Add Performance
                          </Button>
                        </Group>
                      </Box>

                      {sample.performances.map((performance, performanceIndex) => (
                        <Text key={performanceIndex} mt="xs" ml={20} color="gray">
                          Performance: {performance}
                          <ActionIcon
                            color="red"
                            ml="sm"
                            onClick={() =>
                              deletePerformance(subjectIndex, sampleIndex, performanceIndex)
                            }
                          >
                            <IconTrash />
                          </ActionIcon>
                        </Text>
                      ))}
                    </Card>
                  ))
                )}
              </Card>
            ))
          )}
        </Stack>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityStructurePage;
