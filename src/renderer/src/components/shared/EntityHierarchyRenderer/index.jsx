import { Stack, Text, Box, Flex } from "@mantine/core";
import { IconUser, IconFlask, IconClipboard, IconPin } from "@tabler/icons-react";

const HierarchyItem = ({ icon: Icon, label, children, level = 1 }) => {
  return (
    <Box ml="xs" style={{ borderLeft: `2px solid #ccc` }}>
      <Flex align="center">
        <Box bg="#ccc" h="2px" w="10px"></Box>
        <Icon size={15} />
        <Text ml="4px" fw={500}>
          {label}
        </Text>
      </Flex>
      <Stack gap="xs" ml="md">
        {children}
      </Stack>
    </Box>
  );
};

const EntityHierarchyRenderer = ({ datasetEntityArray }) => {
  console.log("datasetEntityArray", datasetEntityArray);

  if (!datasetEntityArray?.length) return null;

  return (
    <Stack gap="xs">
      {datasetEntityArray.map((subject) => (
        <Box
          key={subject.subjectId}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
          p="sm"
        >
          {/* Subject */}
          <Flex align="center" gap="xs">
            <IconUser size={15} />
            <Text fw={600}>{subject.subjectId}</Text>
          </Flex>

          {/* Subject Sites */}
          {subject.subjectSites?.map((site) => (
            <HierarchyItem key={site.siteId} icon={IconPin} label={site.siteId} level={2} />
          ))}

          {/* Subject Performances */}
          {subject.subjectPerformances?.map((performance) => (
            <HierarchyItem
              key={performance.performanceId}
              icon={IconClipboard}
              label={performance.performanceId}
              level={2}
            />
          ))}

          {/* Samples */}
          {subject.samples?.map((sample) => (
            <HierarchyItem key={sample.sampleId} icon={IconFlask} label={sample.sampleId} level={2}>
              {/* Sample Sites */}
              {sample.sites?.map((site) => (
                <HierarchyItem key={site.siteId} icon={IconPin} label={site.siteId} level={3} />
              ))}
              {/* Sample Performances */}
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
