import { Stack, Text, Box, Flex, ScrollArea, ActionIcon } from "@mantine/core";
import {
  IconUser,
  IconFlask,
  IconClipboard,
  IconPin,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { deleteSubject } from "../../../stores/slices/datasetEntityStructureSlice";
import useGlobalStore from "../../../stores/globalStore";

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
  onClick = null,
  onDelete = null,
}) => {
  let ml = 0;
  for (let i = 1; i < level; i++) {
    ml += 8;
  }

  // Determine if this is an "Add" button based on the label
  const isAddButton = icon === "add";

  return (
    <Box ml={`${ml}px`} style={{ borderLeft: `2px solid #ccc` }} py="3px">
      <Flex
        align="center"
        onClick={isAddButton ? onClick : undefined}
        style={isAddButton ? { cursor: "pointer" } : {}}
      >
        <Box bg="#ccc" h="2px" w="10px"></Box>
        {getEntityIcon(isAddButton ? "add" : icon)}
        <Text
          ml="4px"
          fw={isAddButton ? 400 : 500}
          size={isAddButton ? "xs" : undefined}
          c={isAddButton ? "dimmed" : undefined}
        >
          {label}
        </Text>
        {!isAddButton && allowEntityStructureEditing && (
          <>
            <IconEdit color="blue" size={18} />
            <IconTrash
              color="red"
              size={16}
              style={{
                marginLeft: "4px",
                opacity: 0.6,
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete();
              }}
            />
          </>
        )}
      </Flex>
      {children && <Stack gap="0px">{children}</Stack>}
    </Box>
  );
};

// Main component
const EntityHierarchyRenderer = ({ datasetEntityArray, allowEntityStructureEditing }) => {
  console.log("datasetEntityArray", datasetEntityArray);
  if (!datasetEntityArray?.length) return null;
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  console.log("selectedEntities", selectedEntities);
  // Handler functions for deleting entities
  const handleDeleteSample = (subjectIndex, sampleId) => {
    console.log(`Delete sample ${sampleId} from subject at index ${subjectIndex}`);
    // Implement actual deletion logic
  };

  const handleDeleteSite = (subjectIndex, sampleId, siteId) => {
    console.log(
      `Delete site ${siteId} from sample ${sampleId} of subject at index ${subjectIndex}`
    );
    // Implement actual deletion logic
  };

  const handleDeletePerformance = (subjectIndex, sampleId, performanceId) => {
    console.log(
      `Delete performance ${performanceId} from sample ${sampleId} of subject at index ${subjectIndex}`
    );
    // Implement actual deletion logic
  };

  const handleDeleteSubjectSite = (subjectIndex, siteId) => {
    console.log(`Delete site ${siteId} from subject at index ${subjectIndex}`);
    // Implement actual deletion logic
  };

  const handleDeleteSubjectPerformance = (subjectIndex, performanceId) => {
    console.log(`Delete performance ${performanceId} from subject at index ${subjectIndex}`);
    // Implement actual deletion logic
  };

  return (
    <ScrollArea h={650} type="auto">
      <Stack gap="xs">
        {datasetEntityArray.map((subject, subjectIndex) => (
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
              {allowEntityStructureEditing && (
                <>
                  <IconEdit color="blue" size={18} />
                  <IconTrash
                    color="red"
                    size={16}
                    onClick={() => {
                      deleteSubject(subject.subjectId);
                    }}
                  />
                </>
              )}
            </Flex>

            {/* Samples */}

            {subject.samples?.map((sample) => (
              <HierarchyItem
                key={sample.sampleId}
                icon="sample"
                label={sample.sampleId}
                level={2}
                allowEntityStructureEditing={allowEntityStructureEditing}
                onDelete={() => handleDeleteSample(subjectIndex, sample.sampleId)}
              >
                {/* Sample Sites */}
                {sample.sites?.map((site) => (
                  <HierarchyItem
                    key={site.siteId}
                    icon="site"
                    label={site.siteId}
                    level={3}
                    allowEntityStructureEditing={allowEntityStructureEditing}
                    onDelete={() => handleDeleteSite(subjectIndex, sample.sampleId, site.siteId)}
                  />
                ))}
                {allowEntityStructureEditing && (
                  <HierarchyItem
                    label={`Add site to ${sample.sampleId}`}
                    icon="add"
                    level={3}
                    onClick={() => {}}
                  />
                )}

                {/* Sample Performances */}
                {sample.performances?.map((performance) => (
                  <HierarchyItem
                    key={performance.performanceId}
                    icon="performance"
                    label={performance.performanceId}
                    level={3}
                    allowEntityStructureEditing={allowEntityStructureEditing}
                    onDelete={() =>
                      handleDeletePerformance(
                        subjectIndex,
                        sample.sampleId,
                        performance.performanceId
                      )
                    }
                  />
                ))}
                {allowEntityStructureEditing && (
                  <HierarchyItem
                    label={`Add performance to ${sample.sampleId}`}
                    icon="add"
                    level={3}
                    onClick={() => {}}
                  />
                )}
              </HierarchyItem>
            ))}
            {allowEntityStructureEditing && (
              <HierarchyItem
                label={`Add sample to ${subject.subjectId}`}
                icon="add"
                level={2}
                onClick={() => {}}
              />
            )}

            {/* Subject Sites */}
            {subject.subjectSites?.map((site) => (
              <HierarchyItem
                key={site.siteId}
                icon="site"
                label={site.siteId}
                level={2}
                allowEntityStructureEditing={allowEntityStructureEditing}
                onDelete={() => handleDeleteSubjectSite(subjectIndex, site.siteId)}
              />
            ))}
            {allowEntityStructureEditing && (
              <HierarchyItem
                label={`Add site to ${subject.subjectId}`}
                icon="add"
                level={2}
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
                onDelete={() =>
                  handleDeleteSubjectPerformance(subjectIndex, performance.performanceId)
                }
              />
            ))}
            {allowEntityStructureEditing && (
              <HierarchyItem
                label={`Add performance to ${subject.subjectId}`}
                icon="add"
                level={2}
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
