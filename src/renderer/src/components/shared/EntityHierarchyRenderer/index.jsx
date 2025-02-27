import { Stack, Text, Box, Flex, ScrollArea } from "@mantine/core";
import { IconUser, IconFlask, IconClipboard, IconPin, IconEdit } from "@tabler/icons-react";

const HierarchyItem = ({ icon, label, children, level = 1, allowEntityStructureEditing }) => {
  const getIcon = (icon) => {
    switch (icon) {
      case "subject":
        return <IconUser size={15} />;
      case "sample":
        return <IconFlask size={15} color="#74b816" />;
      case "site":
        return <IconClipboard size={15} />;
      case "performance":
        return <IconPin size={15} />;
      default:
        return null;
    }
  };
  return (
    <Box ml="8px" style={{ borderLeft: `2px solid #ccc` }}>
      <Flex align="center">
        <Box bg="#ccc" h="2px" w="10px"></Box>
        {getIcon(icon)}
        <Text ml="4px" fw={500}>
          {label}
        </Text>
        {allowEntityStructureEditing && <IconEdit color="blue" size={18} />}
      </Flex>
      <Stack gap="0px">{children}</Stack>
    </Box>
  );
};

const EntityHierarchyRenderer = ({ datasetEntityArray, allowEntityStructureEditing }) => {
  console.log("datasetEntityArray", datasetEntityArray);

  if (!datasetEntityArray?.length) return null;

  return (
    <ScrollArea h={650} type="auto">
      <Stack gap="xs">
        {allowEntityStructureEditing && <Text>hi</Text>}
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
              {allowEntityStructureEditing && <IconEdit color="blue" size={18} />}
            </Flex>

            {/* Samples */}
            {subject.samples?.map((sample) => (
              <HierarchyItem
                key={sample.sampleId}
                icon="sample"
                label={sample.sampleId}
                level={2}
                allowEntityStructureEditing={allowEntityStructureEditing}
              >
                {/* Sample Sites */}
                {sample.sites?.map((site) => (
                  <HierarchyItem
                    key={site.siteId}
                    icon="site"
                    label={site.siteId}
                    level={3}
                    allowEntityStructureEditing={allowEntityStructureEditing}
                  />
                ))}
                {/* Sample Performances */}
                {sample.performances?.map((performance) => (
                  <HierarchyItem
                    key={performance.performanceId}
                    icon="performance"
                    label={performance.performanceId}
                    borderColor="blue"
                    allowEntityStructureEditing={allowEntityStructureEditing}
                  />
                ))}
              </HierarchyItem>
            ))}

            {/* Subject Sites */}
            {subject.subjectSites?.map((site) => (
              <HierarchyItem
                key={site.siteId}
                icon="site"
                label={site.siteId}
                level={2}
                allowEntityStructureEditing={allowEntityStructureEditing}
              />
            ))}

            {/* Subject Performances */}
            {subject.subjectPerformances?.map((performance) => (
              <HierarchyItem
                key={performance.performanceId}
                icon="performance"
                label={performance.performanceId}
                level={2}
                allowEntityStructureEditing={allowEntityStructureEditing}
              />
            ))}
          </Box>
        ))}
      </Stack>
    </ScrollArea>
  );
};

export default EntityHierarchyRenderer;
