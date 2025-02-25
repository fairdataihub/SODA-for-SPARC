import { Stack, Text, Box, Flex } from "@mantine/core";
import { IconUser, IconFlask, IconClipboard, IconPin } from "@tabler/icons-react";

const HierarchyItem = ({ icon: Icon, label, children, borderColor }) => (
  <Box ml="xs" style={{ borderLeft: `3px solid gray` }}>
    <Flex align="center" gap="5px">
      <Box bg="gray" h="3px" w="10px"></Box>
      <Icon size={15} />
      <Text>{label}</Text>
    </Flex>
    {children}
  </Box>
);

const EntityHierarchyRenderer = ({ datasetEntityArray }) => {
  if (!datasetEntityArray?.length) return null;
  console.log("datasetEntityArray", datasetEntityArray);
  return (
    <Stack spacing="md">
      {datasetEntityArray.map((subject) => (
        <Box
          key={subject.subjectId}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "8px",
            marginBottom: "8px",
          }}
        >
          <Flex align="center" gap="xs">
            <IconUser size={15} />
            <Text fw={600}>{subject.subjectId}</Text>
          </Flex>

          {subject.subjectSites?.map((site) => (
            <HierarchyItem
              key={site.siteId}
              icon={IconPin}
              label={site.siteId}
              borderColor="purple"
            />
          ))}

          {subject.subjectPerformances?.map((performance) => (
            <HierarchyItem
              key={performance.performanceId}
              icon={IconClipboard}
              label={performance.performanceId}
              borderColor="teal"
            />
          ))}

          {subject.samples?.map((sample) => (
            <HierarchyItem
              key={sample.sampleId}
              icon={IconFlask}
              label={sample.sampleId}
              borderColor="green"
            >
              {sample.sites?.map((site) => (
                <HierarchyItem
                  key={site.siteId}
                  icon={IconPin}
                  label={site.siteId}
                  borderColor="orange"
                />
              ))}
              {sample.performances?.map((performance) => (
                <HierarchyItem
                  key={performance.performanceId}
                  icon={IconClipboard}
                  label={performance.performanceId}
                  borderColor="blue"
                />
              ))}
            </HierarchyItem>
          ))}
        </Box>
      ))}
    </Stack>
  );
};

export default EntityHierarchyRenderer;
