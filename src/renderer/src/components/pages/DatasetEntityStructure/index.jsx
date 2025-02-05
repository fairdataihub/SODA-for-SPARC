import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { TextInput, Text, Stack, Group, Button, Card, Box } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

const DatasetEntityStructurePage = () => {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");

  const addSubject = () => {
    if (newSubject.trim()) {
      setSubjects([...subjects, { name: newSubject, samples: [], sites: [], performances: [] }]);
      setNewSubject("");
    }
  };

  const addSample = (subjectIndex, sampleName) => {
    if (sampleName.trim()) {
      const updatedSubjects = [...subjects];
      updatedSubjects[subjectIndex].samples.push({
        name: sampleName,
        sites: [],
        performances: [],
      });
      setSubjects(updatedSubjects);
    }
  };

  const addSiteOrPerformance = (subjectIndex, sampleIndex, type, name) => {
    if (name.trim()) {
      const updatedSubjects = [...subjects];
      if (sampleIndex === null) {
        updatedSubjects[subjectIndex][type].push(name);
      } else {
        updatedSubjects[subjectIndex].samples[sampleIndex][type].push(name);
      }
      setSubjects(updatedSubjects);
    }
  };

  return (
    <GuidedModePage pageHeader="Dataset Entity Structure">
      <GuidedModeSection>
        <Stack spacing="md">
          <Group spacing="xs" align="center" w="100%">
            <TextInput
              flex={1}
              placeholder="Enter subject name"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(event) => {
                if (event.which === 13) {
                  addSubject();
                }
              }}
            />
            <Button onClick={addSubject} leftIcon={<IconPlus />} variant="outline">
              Add Subject
            </Button>
          </Group>

          {/* Subjects List */}
          {subjects.map((subject, subjectIndex) => (
            <Card key={subjectIndex} shadow="sm" padding="md" withBorder style={{ marginTop: 20 }}>
              <Text fw={600} size="lg" mb={10} align="center">
                sub-{subject.name}
              </Text>

              {/* Sample Input (disabled for every other subject) */}
              {subjectIndex % 2 === 0 && (
                <Group spacing="xs" align="center" width="100%">
                  <TextInput
                    placeholder="Add sample"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addSample(subjectIndex, e.target.value);
                    }}
                    flex={1}
                  />
                  <Button
                    onClick={() => addSample(subjectIndex, "")}
                    leftIcon={<IconPlus />}
                    variant="outline"
                  >
                    Add Sample
                  </Button>
                </Group>
              )}

              {/* Sample List */}
              {subject.samples.map((sample, sampleIndex) => (
                <Box
                  key={sampleIndex}
                  ml={20}
                  mt={10}
                  style={{ border: "1px solid black" }}
                  withBorder
                  mb="sm"
                  p="sm"
                >
                  <Text weight={500}>{sample.name}</Text>

                  {/* Add Site Button and Input */}

                  <Group spacing="xs" align="center" width="100%">
                    <TextInput
                      flex={1}
                      placeholder="Enter site name"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.which === 13) {
                          addSubject();
                        }
                      }}
                    />
                    <Button onClick={addSubject} leftIcon={<IconPlus />} variant="outline">
                      Add Site
                    </Button>
                  </Group>

                  {/* Add Performance Button and Input */}
                  <Group spacing="xs" align="center" w="100%" mt="md">
                    <TextInput
                      flex={1}
                      placeholder="Enter performance name"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.which === 13) {
                          addSubject();
                        }
                      }}
                    />
                    <Button onClick={addSubject} leftIcon={<IconPlus />} variant="outline">
                      Add Performance
                    </Button>
                  </Group>
                </Box>
              ))}

              {/* Site/Performance Inputs */}
              <Stack spacing="xs">
                <Group spacing="xs" align="center" w="100%" mt="sm">
                  <TextInput
                    flex={1}
                    placeholder="Add site to subject"
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        addSiteOrPerformance(subjectIndex, null, "sites", e.target.value);
                    }}
                  />
                  <Button
                    onClick={() => addSiteOrPerformance(subjectIndex, null, "sites", "")}
                    leftIcon={<IconPlus />}
                    variant="outline"
                  >
                    Add Site
                  </Button>
                </Group>

                <Group spacing="xs" align="center" width="100%">
                  <TextInput
                    flex={1}
                    placeholder="Add performance to subject"
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        addSiteOrPerformance(subjectIndex, null, "performances", e.target.value);
                    }}
                  />
                  <Button
                    onClick={() => addSiteOrPerformance(subjectIndex, null, "performances", "")}
                    leftIcon={<IconPlus />}
                    variant="outline"
                  >
                    Add Performance
                  </Button>
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityStructurePage;
