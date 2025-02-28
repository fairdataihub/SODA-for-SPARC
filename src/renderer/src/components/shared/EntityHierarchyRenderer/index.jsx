import { Stack, Text, Box, Flex, ScrollArea, Button, ActionIcon, Group } from "@mantine/core";
import {
  IconUser,
  IconFlask,
  IconClipboard,
  IconPin,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useMemo, useCallback } from "react";
import { addSubject, deleteSubject } from "../../../stores/slices/datasetEntityStructureSlice";
import useGlobalStore from "../../../stores/globalStore";
import { guidedOpenEntityAdditionSwal, guidedOpenEntityEditSwal } from "./utils";

// Utility for getting the appropriate icon component
const getEntityIcon = (iconType) => {
  const iconSize = 15;
  switch (iconType) {
    case "subject":
      return <IconUser size={iconSize} />;
    case "sample":
      return <IconFlask size={iconSize} color="#74b816" />;
    case "site":
      return <IconPin size={iconSize} color="red" />;
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
  entityData = null,
  entityType = null,
  parentEntityData = null,
  onAdd = null,
  onEdit = null,
  onDelete = null,
}) => {
  const marginLeft = (level - 1) * 8;
  const isAddButton = icon === "add";

  const handleAdd = (e) => {
    e.stopPropagation();
    onAdd && onAdd(parentEntityData);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit && onEdit(entityData, parentEntityData);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete && onDelete(entityData, parentEntityData);
  };

  return (
    <Box ml={`${marginLeft}px`} style={{ borderLeft: "2px solid #ccc" }} py="3px">
      <Flex
        align="center"
        onClick={isAddButton ? handleAdd : undefined}
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
            <IconEdit color="blue" size={18} style={{ cursor: "pointer" }} onClick={handleEdit} />
            <IconTrash
              color="red"
              size={16}
              style={{ marginLeft: "4px", opacity: 0.6, cursor: "pointer" }}
              onClick={handleDelete}
            />
          </>
        )}
      </Flex>
      {children && <Stack gap="0px">{children}</Stack>}
    </Box>
  );
};

const EntityHierarchyRenderer = ({
  datasetEntityArray = [],
  allowEntityStructureEditing = false,
}) => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);

  // Define all entity operations within the component

  // Subject operations
  const handleAddSubjects = useCallback(() => {
    return guidedOpenEntityAdditionSwal({ entityType: "subjects" });
  }, []);

  const handleEditSubject = useCallback((subject) => {
    return guidedOpenEntityEditSwal("subject", subject);
  }, []);

  const handleDeleteSubject = useCallback((subject) => {
    return deleteSubject(subject.subjectId);
  }, []);

  // Sample operations
  const handleAddSample = useCallback((subject) => {
    console.log(`Add sample to subject: ${subject.subjectId}`);
    return guidedOpenEntityAdditionSwal({ entityType: "samples", subjectId: subject.subjectId });
  }, []);

  const handleEditSample = useCallback((sample, subject) => {
    console.log(`Edit sample ${sample.sampleId} of subject ${subject.subjectId}`);
    // Implement your sample editing logic here
  }, []);

  const handleDeleteSample = useCallback((sample, subject) => {
    console.log(`Delete sample ${sample.sampleId} from subject ${subject.subjectId}`);
    // Implement your sample deletion logic here
  }, []);

  // Subject site operations
  const handleAddSubjectSite = useCallback((subject) => {
    console.log(`Add site to subject: ${subject.subjectId}`);
    // Implement your subject site addition logic here
  }, []);

  const handleEditSubjectSite = useCallback((site, subject) => {
    console.log(`Edit site ${site.siteId} of subject ${subject.subjectId}`);
    // Implement your subject site editing logic here
  }, []);

  const handleDeleteSubjectSite = useCallback((site, subject) => {
    console.log(`Delete site ${site.siteId} from subject ${subject.subjectId}`);
    // Implement your subject site deletion logic here
  }, []);

  // Subject performance operations
  const handleAddSubjectPerformance = useCallback((subject) => {
    console.log(`Add performance to subject: ${subject.subjectId}`);
    // Implement your subject performance addition logic here
  }, []);

  const handleEditSubjectPerformance = useCallback((performance, subject) => {
    console.log(`Edit performance ${performance.performanceId} of subject ${subject.subjectId}`);
    // Implement your subject performance editing logic here
  }, []);

  const handleDeleteSubjectPerformance = useCallback((performance, subject) => {
    console.log(
      `Delete performance ${performance.performanceId} from subject ${subject.subjectId}`
    );
    // Implement your subject performance deletion logic here
  }, []);

  // Sample site operations
  const handleAddSampleSite = useCallback(({ sample, subject }) => {
    console.log(`Add site to sample ${sample.sampleId} of subject ${subject.subjectId}`);
    // Implement your sample site addition logic here
  }, []);

  const handleEditSampleSite = useCallback((site, { sample, subject }) => {
    console.log(
      `Edit site ${site.siteId} of sample ${sample.sampleId} of subject ${subject.subjectId}`
    );
    // Implement your sample site editing logic here
  }, []);

  const handleDeleteSampleSite = useCallback((site, { sample, subject }) => {
    console.log(
      `Delete site ${site.siteId} from sample ${sample.sampleId} of subject ${subject.subjectId}`
    );
    // Implement your sample site deletion logic here
  }, []);

  // Sample performance operations
  const handleAddSamplePerformance = useCallback(({ sample, subject }) => {
    console.log(`Add performance to sample ${sample.sampleId} of subject ${subject.subjectId}`);
    // Implement your sample performance addition logic here
  }, []);

  const handleEditSamplePerformance = useCallback((performance, { sample, subject }) => {
    console.log(
      `Edit performance ${performance.performanceId} of sample ${sample.sampleId} of subject ${subject.subjectId}`
    );
    // Implement your sample performance editing logic here
  }, []);

  const handleDeleteSamplePerformance = useCallback((performance, { sample, subject }) => {
    console.log(
      `Delete performance ${performance.performanceId} from sample ${sample.sampleId} of subject ${subject.subjectId}`
    );
    // Implement your sample performance deletion logic here
  }, []);

  // Memoize derived values to avoid recalculation
  const {
    showSamples,
    showSubjectSites,
    showSampleSites,
    showSubjectPerformances,
    showSamplePerformances,
  } = useMemo(
    () => ({
      showSamples: selectedEntities?.includes("samples") || false,
      showSubjectSites: selectedEntities?.includes("subject-sites") || false,
      showSampleSites: selectedEntities?.includes("sample-sites") || false,
      showSubjectPerformances: selectedEntities?.includes("subject-performances") || false,
      showSamplePerformances: selectedEntities?.includes("sample-performances") || false,
    }),
    [selectedEntities]
  );

  // We can check if we should show empty state after all hooks are called
  const shouldShowEmptyState = !datasetEntityArray?.length && !allowEntityStructureEditing;

  // Render empty state
  if (shouldShowEmptyState) {
    return <Text>No entity structure data available.</Text>;
  }

  return (
    <ScrollArea h={650} type="auto">
      {allowEntityStructureEditing && (
        <Group position="right" width="100%" my="sm">
          <Button onClick={handleAddSubjects} leftIcon={<IconPlus size={16} />}>
            Add Subjects
          </Button>
        </Group>
      )}

      <Stack gap="xs">
        {datasetEntityArray?.map((subject) => (
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
                  <IconEdit
                    color="blue"
                    size={18}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleEditSubject(subject)}
                  />
                  <IconTrash
                    color="red"
                    size={16}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleDeleteSubject(subject)}
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
                  entityData={sample}
                  entityType="sample"
                  parentEntityData={subject}
                  onEdit={() => handleEditSample(sample, subject)}
                  onDelete={() => handleDeleteSample(sample, subject)}
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
                        entityData={site}
                        entityType="site"
                        parentEntityData={{ sample, subject }}
                        onEdit={() => handleEditSampleSite(site, { sample, subject })}
                        onDelete={() => handleDeleteSampleSite(site, { sample, subject })}
                      />
                    ))}
                  {allowEntityStructureEditing && showSampleSites && (
                    <HierarchyItem
                      label={`Add site to ${sample.sampleId}`}
                      icon="add"
                      level={3}
                      parentEntityData={{ sample, subject }}
                      onAdd={handleAddSampleSite}
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
                        entityData={performance}
                        entityType="performance"
                        parentEntityData={{ sample, subject }}
                        onEdit={() => handleEditSamplePerformance(performance, { sample, subject })}
                        onDelete={() =>
                          handleDeleteSamplePerformance(performance, { sample, subject })
                        }
                      />
                    ))}
                  {allowEntityStructureEditing && showSamplePerformances && (
                    <HierarchyItem
                      label={`Add performance to ${sample.sampleId}`}
                      icon="add"
                      level={3}
                      parentEntityData={{ sample, subject }}
                      onAdd={handleAddSamplePerformance}
                    />
                  )}
                </HierarchyItem>
              ))}
            {allowEntityStructureEditing && showSamples && (
              <HierarchyItem
                label={`Add sample(s) to ${subject.subjectId}`}
                icon="add"
                level={2}
                parentEntityData={subject}
                onAdd={handleAddSample}
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
                  entityData={site}
                  entityType="site"
                  parentEntityData={subject}
                  onEdit={() => handleEditSubjectSite(site, subject)}
                  onDelete={() => handleDeleteSubjectSite(site, subject)}
                />
              ))}
            {allowEntityStructureEditing && showSubjectSites && (
              <HierarchyItem
                label={`Add site to ${subject.subjectId}`}
                icon="add"
                level={2}
                parentEntityData={subject}
                onAdd={handleAddSubjectSite}
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
                  entityData={performance}
                  entityType="performance"
                  parentEntityData={subject}
                  onEdit={() => handleEditSubjectPerformance(performance, subject)}
                  onDelete={() => handleDeleteSubjectPerformance(performance, subject)}
                />
              ))}
            {allowEntityStructureEditing && showSubjectPerformances && (
              <HierarchyItem
                label={`Add performance to ${subject.subjectId}`}
                icon="add"
                level={2}
                parentEntityData={subject}
                onAdd={handleAddSubjectPerformance}
              />
            )}
          </Box>
        ))}
      </Stack>
    </ScrollArea>
  );
};

export default EntityHierarchyRenderer;
