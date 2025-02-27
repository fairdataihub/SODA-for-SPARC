import { Stack, Text, Box, Flex, ScrollArea, ActionIcon } from "@mantine/core";
import {
  IconUser,
  IconFlask,
  IconClipboard,
  IconPin,
  IconEdit,
  IconPlus,
} from "@tabler/icons-react";

// Utility function for getting the appropriate icon
const getEntityIcon = (iconType) => {
  switch (iconType) {
    case "subject":
      return <IconUser size={15} />;
    case "sample":
      return <IconFlask size={15} color="#74b816" />;
    case "site":
      return <IconPin size={15} />;
    case "performance":
      return <IconClipboard size={15} />;
    case "add":
      return (
        <ActionIcon variant="light" color="blue" radius="xl" size="sm">
          <IconPlus size={14} />
        </ActionIcon>
      );
    default:
      return null;
  }
};

// HierarchyItem component for rendering nested items
const HierarchyItem = ({
  icon,
  label,
  children,
  level,
  allowEntityStructureEditing,
  isAddButton = false,
  onClick = null,
}) => {
  let ml = 0;
  for (let i = 1; i < level; i++) {
    ml += 8;
  }
  return (
    <Box ml={`${ml}px`} style={{ borderLeft: `2px solid #ccc` }}>
      <Flex
        align="center"
        onClick={isAddButton ? onClick : undefined}
        style={isAddButton ? { cursor: "pointer" } : {}}
      >
        <Box bg="#ccc" h="2px" w="10px"></Box>
        {isAddButton ? getEntityIcon("add") : getEntityIcon(icon)}
        <Text
          ml="4px"
          fw={isAddButton ? 400 : 500}
          size={isAddButton ? "xs" : undefined}
          color={isAddButton ? "dimmed" : undefined}
        >
          {label}
        </Text>
        {!isAddButton && allowEntityStructureEditing && <IconEdit color="blue" size={18} />}
      </Flex>
      {children && <Stack gap="0px">{children}</Stack>}
    </Box>
  );
};

// Main component
const EntityHierarchyRenderer = ({ datasetEntityArray, allowEntityStructureEditing }) => {
  if (!datasetEntityArray?.length) return null;

  return (
    <ScrollArea h={650} type="auto">
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
                {allowEntityStructureEditing && (
                  <HierarchyItem label="Add Site" level={3} isAddButton={true} onClick={() => {}} />
                )}

                {/* Sample Performances */}
                {sample.performances?.map((performance) => (
                  <HierarchyItem
                    key={performance.performanceId}
                    icon="performance"
                    label={performance.performanceId}
                    level={3}
                    allowEntityStructureEditing={allowEntityStructureEditing}
                  />
                ))}
                {allowEntityStructureEditing && (
                  <HierarchyItem
                    label="Add Performance"
                    level={3}
                    isAddButton={true}
                    onClick={() => {}}
                  />
                )}
              </HierarchyItem>
            ))}
            {allowEntityStructureEditing && (
              <HierarchyItem label="Add Sample" level={2} isAddButton={true} onClick={() => {}} />
            )}

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
            {allowEntityStructureEditing && (
              <HierarchyItem
                label="Add Subject Site"
                level={2}
                isAddButton={true}
                onClick={() => {}}
              />
            )}

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
            {allowEntityStructureEditing && (
              <HierarchyItem
                label="Add Subject Performance"
                level={2}
                isAddButton={true}
                onClick={() => {}}
              />
            )}
          </Box>
        ))}
      </Stack>
    </ScrollArea>
  );
};

export default EntityHierarchyRenderer;
