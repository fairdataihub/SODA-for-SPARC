import { Stack, Group, Text, Box, Flex } from "@mantine/core";
import { IconUser, IconFlask, IconClipboard, IconPin } from "@tabler/icons-react";

const EntityHierarchyRenderer = ({ datasetEntityStructure }) => {
  if (!datasetEntityStructure) {
    return null;
  }
  return (
    <Stack spacing="md">
      {datasetEntityStructure.subjects.map((subject) => (
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

          {subject.subjectSites?.length > 0 && (
            <Box ml="xs" pl="xs" style={{ borderLeft: "2px solid purple" }}>
              {subject.subjectSites.map((site) => (
                <Flex key={site.siteId} gap="xs" align="center">
                  <IconPin size={15} />
                  <Text>{site.siteId}</Text>
                </Flex>
              ))}
            </Box>
          )}

          {subject.subjectPerformances?.length > 0 && (
            <Box ml="xs" pl="xs" style={{ borderLeft: "2px solid teal" }}>
              {subject.subjectPerformances.map((performance) => (
                <Flex key={performance.performanceId} gap="xs" align="center">
                  <IconClipboard size={15} />
                  <Text>{performance.performanceId}</Text>
                </Flex>
              ))}
            </Box>
          )}

          {subject.samples?.length > 0 && (
            <Box ml="xs" pl="xs" style={{ borderLeft: "2px solid green" }}>
              {subject.samples.map((sample) => (
                <Box key={sample.sampleId} ml="xs" mb="4px">
                  <Flex gap="xs" align="center">
                    <IconFlask size={15} />
                    <Text fw={500}>{sample.sampleId}</Text>
                  </Flex>

                  {sample.sites?.length > 0 && (
                    <Box ml="xs" pl="xs" style={{ borderLeft: "2px solid orange" }}>
                      {sample.sites.map((site) => (
                        <Flex key={site.siteId} gap="xs" align="center">
                          <IconPin size={15} />
                          <Text>{site.siteId}</Text>
                        </Flex>
                      ))}
                    </Box>
                  )}

                  {sample.performances?.length > 0 && (
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
      ))}
    </Stack>
  );
};

export default EntityHierarchyRenderer;
