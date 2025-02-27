import {
  Stack,
  Text,
  Box,
  Flex,
  ScrollArea,
  Button,
  ActionIcon,
  Group,
  TextInput,
} from "@mantine/core";
import {
  IconUser,
  IconFlask,
  IconClipboard,
  IconPin,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { addSubject, deleteSubject } from "../../../stores/slices/datasetEntityStructureSlice";
import useGlobalStore from "../../../stores/globalStore";

// Utility for getting the appropriate icon component
const getEntityIcon = (iconType) => {
  const iconSize = 15;
  switch (iconType) {
    case "subject":
      return <IconUser size={iconSize} />;
    case "sample":
      return <IconFlask size={iconSize} color="#74b816" />;
    case "site":
      return <IconPin size={iconSize} />;
    case "performance":
      return <IconClipboard size={iconSize} />;
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

// Component for rendering nested hierarchy items
const HierarchyItem = ({
  icon,
  label,
  children,
  level = 1,
  allowEntityStructureEditing = false,
  onClick = null,
  onDelete = null,
}) => {
  const marginLeft = (level - 1) * 8;
  const isAddButton = icon === "add";

  return (
    <Box ml={`${marginLeft}px`} style={{ borderLeft: "2px solid #ccc" }} py="3px">
      <Flex
        align="center"
        onClick={isAddButton ? onClick : undefined}
        style={isAddButton ? { cursor: "pointer" } : {}}
      >
        <Box bg="#ccc" h="2px" w="10px" />
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
              style={{ marginLeft: "4px", opacity: 0.6, cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete();
              }}
            />
          </>
        )}
      </Flex>
      {children && <Stack gap="0px">{children}</Stack>}
    </Box>
  );
};

const EntityHierarchyRenderer = ({ datasetEntityArray, allowEntityStructureEditing }) => {
  if (!datasetEntityArray?.length) return null;

  const selectedEntities = useGlobalStore((state) => state.selectedEntities || []);
  const isEntitySelected = (entityType) => selectedEntities.includes(entityType);

  // Determine which sections to show based on global state
  const showSamples = isEntitySelected("samples");
  const showSubjectSites = isEntitySelected("subject-sites");
  const showSampleSites = isEntitySelected("sample-sites");
  const showSubjectPerformances = isEntitySelected("subject-performances");
  const showSamplePerformances = isEntitySelected("sample-performances");

  // Handler functions for deletion
  const handleDeleteSample = (subjectIndex, sampleId) => {
    console.log(`Delete sample ${sampleId} from subject at index ${subjectIndex}`);
    // Implement deletion logic here
  };

  const handleDeleteSite = (subjectIndex, sampleId, siteId) => {
    console.log(
      `Delete site ${siteId} from sample ${sampleId} of subject at index ${subjectIndex}`
    );
    // Implement deletion logic here
  };

  const handleDeletePerformance = (subjectIndex, sampleId, performanceId) => {
    console.log(
      `Delete performance ${performanceId} from sample ${sampleId} of subject at index ${subjectIndex}`
    );
    // Implement deletion logic here
  };

  const handleDeleteSubjectSite = (subjectIndex, siteId) => {
    console.log(`Delete site ${siteId} from subject at index ${subjectIndex}`);
    // Implement deletion logic here
  };

  const handleDeleteSubjectPerformance = (subjectIndex, performanceId) => {
    console.log(`Delete performance ${performanceId} from subject at index ${subjectIndex}`);
    // Implement deletion logic here
  };

  return (
    <ScrollArea h={650} type="auto">
      <Group spacing="xs" align="start" width="100%" my="sm">
        <TextInput flex={1} placeholder={`Enter  name`} value={""} />
        <Button onClick={() => {}}>Add Subject</Button>
      </Group>

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
            {/* Subject Header */}
            <Flex align="center" gap="xs">
              <IconUser size={15} />
              <Text fw={600}>{subject.subjectId}</Text>
              {allowEntityStructureEditing && (
                <>
                  <IconEdit color="blue" size={18} />
                  <IconTrash
                    color="red"
                    size={16}
                    onClick={() => deleteSubject(subject.subjectId)}
                  />
                </>
              )}
            </Flex>

            {/* Samples */}
            {showSamples &&
              subject.samples?.map((sample) => (
                <HierarchyItem
                  key={sample.sampleId}
                  icon="sample"
                  label={sample.sampleId}
                  level={2}
                  allowEntityStructureEditing={allowEntityStructureEditing}
                  onDelete={() => handleDeleteSample(subjectIndex, sample.sampleId)}
                >
                  {/* Sample Sites */}
                  {showSampleSites &&
                    sample.sites?.map((site) => (
                      <HierarchyItem
                        key={site.siteId}
                        icon="site"
                        label={site.siteId}
                        level={3}
                        allowEntityStructureEditing={allowEntityStructureEditing}
                        onDelete={() =>
                          handleDeleteSite(subjectIndex, sample.sampleId, site.siteId)
                        }
                      />
                    ))}
                  {allowEntityStructureEditing && showSampleSites && (
                    <HierarchyItem
                      label={`Add site to ${sample.sampleId}`}
                      icon="add"
                      level={3}
                      onClick={() => {}}
                    />
                  )}

                  {/* Sample Performances */}
                  {showSamplePerformances &&
                    sample.performances?.map((performance) => (
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
                  {allowEntityStructureEditing && showSamplePerformances && (
                    <HierarchyItem
                      label={`Add performance to ${sample.sampleId}`}
                      icon="add"
                      level={3}
                      onClick={() => {}}
                    />
                  )}
                </HierarchyItem>
              ))}
            {allowEntityStructureEditing && showSamples && (
              <HierarchyItem
                label={`Add sample to ${subject.subjectId}`}
                icon="add"
                level={2}
                onClick={() => {}}
              />
            )}

            {/* Subject Sites */}
            {showSubjectSites &&
              subject.subjectSites?.map((site) => (
                <HierarchyItem
                  key={site.siteId}
                  icon="site"
                  label={site.siteId}
                  level={2}
                  allowEntityStructureEditing={allowEntityStructureEditing}
                  onDelete={() => handleDeleteSubjectSite(subjectIndex, site.siteId)}
                />
              ))}
            {allowEntityStructureEditing && showSubjectSites && (
              <HierarchyItem
                label={`Add site to ${subject.subjectId}`}
                icon="add"
                level={2}
                onClick={() => {}}
              />
            )}

            {/* Subject Performances */}
            {showSubjectPerformances &&
              subject.subjectPerformances?.map((performance) => (
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
            {allowEntityStructureEditing && showSubjectPerformances && (
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
