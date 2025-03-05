import { Stack, Text, Box, Flex, ScrollArea, ActionIcon, Group } from "@mantine/core";
import {
  IconUser,
  IconFlask,
  IconClipboard,
  IconPin,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useMemo, useCallback, useState } from "react";
import {
  addSubject,
  deleteSubject,
  modifySubjectId,
  deleteSampleFromSubject,
  modifySampleId,
  addSiteToSubject,
  deleteSiteFromSubject,
  modifySubjectSiteId,
  deletePerformanceFromSubject,
  modifySubjectPerformanceId,
  deleteSiteFromSample,
  modifySampleSiteId,
  deletePerformanceFromSample,
  modifySamplePerformanceId,
} from "../../../stores/slices/datasetEntityStructureSlice";
import useGlobalStore from "../../../stores/globalStore";
import { guidedOpenEntityAdditionSwal, guidedOpenEntityEditSwal } from "./utils";
import { setSelectedHierarchyEntity } from "../../../stores/slices/datasetContentSelectorSlice";

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
  allowEntitySelection = false,
  entityData = null,
  entityType = null,
  parentEntityData = null,
  onAdd = null,
  onEdit = null,
  onDelete = null,
  onSelect = null,
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

  const handleSelect = (e) => {
    e.stopPropagation();
    if (allowEntitySelection && !isAddButton && onSelect) {
      onSelect(entityData, entityType, parentEntityData);
    }
  };

  return (
    <Box ml={`${marginLeft}px`} style={{ borderLeft: "2px solid #ccc" }} py="3px">
      <Flex
        align="center"
        onClick={isAddButton ? handleAdd : handleSelect}
        style={{
          cursor: isAddButton || (allowEntitySelection && !isAddButton) ? "pointer" : "default",
        }}
        sx={
          allowEntitySelection && !isAddButton
            ? {
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.03)",
                },
              }
            : undefined
        }
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
            <IconEdit
              color="blue"
              size={18}
              style={{ marginLeft: "4px", opacity: 0.6, cursor: "pointer" }}
              onClick={handleEdit}
            />
            <IconTrash
              color="red"
              size={16}
              style={{ opacity: 0.6, cursor: "pointer" }}
              onClick={handleDelete}
            />
          </>
        )}
      </Flex>
      {children && <Stack gap="0px">{children}</Stack>}
    </Box>
  );
};

const EntityHierarchyRenderer = ({ allowEntityStructureEditing, allowEntitySelection }) => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);

  // Simple entity selection handler that just logs the selection
  const handleEntitySelect = useCallback((entityData, entityType, parentEntityData) => {
    console.log("Entity selected:", { entityData, entityType, parentEntityData });
    setSelectedHierarchyEntity({ entityData, entityType, parentEntityData });
  }, []);

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

  const handleEditSample = useCallback(async (sample, subject) => {
    console.log(`Edit sample ${sample.sampleId} of subject ${subject.subjectId}`);
    const result = await guidedOpenEntityEditSwal({
      entityType: "sample",
      entityData: sample,
      parentEntityData: subject,
    });

    if (result) {
      modifySampleId(subject.subjectId, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSample = useCallback((sample, subject) => {
    console.log(`Delete sample ${sample.sampleId} from subject ${subject.subjectId}`);
    return deleteSampleFromSubject(subject.subjectId, sample.sampleId);
  }, []);

  // Subject site operations
  const handleAddSubjectSite = useCallback((subject) => {
    console.log(`Add site to subject: ${subject.subjectId}`);
    return guidedOpenEntityAdditionSwal({
      entityType: "sites",
      subjectId: subject.subjectId,
    });
  }, []);

  const handleEditSubjectSite = useCallback(async (site, subject) => {
    console.log(`Edit site ${site.siteId} of subject ${subject.subjectId}`);
    const result = await guidedOpenEntityEditSwal({
      entityType: "site",
      entityData: site,
      parentEntityData: subject,
    });

    if (result) {
      modifySubjectSiteId(subject.subjectId, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSubjectSite = useCallback((site, subject) => {
    console.log(`Delete site ${site.siteId} from subject ${subject.subjectId}`);
    return deleteSiteFromSubject(subject.subjectId, site.siteId);
  }, []);

  // Subject performance operations
  const handleAddSubjectPerformance = useCallback((subject) => {
    console.log(`Add performance to subject: ${subject.subjectId}`);
    guidedOpenEntityAdditionSwal({ entityType: "performances", subjectId: subject.subjectId });
  }, []);

  const handleEditSubjectPerformance = useCallback(async (performance, subject) => {
    console.log(`Edit performance ${performance.performanceId} of subject ${subject.subjectId}`);
    const result = await guidedOpenEntityEditSwal({
      entityType: "performance",
      entityData: performance,
      parentEntityData: subject,
    });

    if (result) {
      modifySubjectPerformanceId(subject.subjectId, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSubjectPerformance = useCallback((performance, subject) => {
    console.log(
      `Delete performance ${performance.performanceId} from subject ${subject.subjectId}`
    );
    return deletePerformanceFromSubject(subject.subjectId, performance.performanceId);
  }, []);

  // Sample site operations
  const handleAddSampleSite = useCallback(({ sample, subject }) => {
    console.log(`Add site to sample ${sample.sampleId} of subject ${subject.subjectId}`);
    guidedOpenEntityAdditionSwal({
      entityType: "sites",
      subjectId: subject.subjectId,
      sampleId: sample.sampleId,
    });
  }, []);

  const handleEditSampleSite = useCallback(async (site, { sample, subject }) => {
    console.log(
      `Edit site ${site.siteId} of sample ${sample.sampleId} of subject ${subject.subjectId}`
    );
    const result = await guidedOpenEntityEditSwal({
      entityType: "site",
      entityData: site,
      parentEntityData: { sample, subject },
    });

    if (result) {
      modifySampleSiteId(subject.subjectId, sample.sampleId, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSampleSite = useCallback((site, { sample, subject }) => {
    console.log(
      `Delete site ${site.siteId} from sample ${sample.sampleId} of subject ${subject.subjectId}`
    );
    return deleteSiteFromSample(subject.subjectId, sample.sampleId, site.siteId);
  }, []);

  // Sample performance operations
  const handleAddSamplePerformance = useCallback(({ sample, subject }) => {
    console.log(`Add performance to sample ${sample.sampleId} of subject ${subject.subjectId}`);
    guidedOpenEntityAdditionSwal({
      entityType: "performances",
      subjectId: subject.subjectId,
      sampleId: sample.sampleId,
    });
  }, []);

  const handleEditSamplePerformance = useCallback(async (performance, { sample, subject }) => {
    console.log(
      `Edit performance ${performance.performanceId} of sample ${sample.sampleId} of subject ${subject.subjectId}`
    );
    const result = await guidedOpenEntityEditSwal({
      entityType: "performance",
      entityData: performance,
      parentEntityData: { sample, subject },
    });

    if (result) {
      modifySamplePerformanceId(subject.subjectId, sample.sampleId, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSamplePerformance = useCallback((performance, { sample, subject }) => {
    console.log(
      `Delete performance ${performance.performanceId} from sample ${sample.sampleId} of subject ${subject.subjectId}`
    );
    return deletePerformanceFromSample(
      subject.subjectId,
      sample.sampleId,
      performance.performanceId
    );
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
  const shouldShowEmptyState = !datasetEntityArray?.length;

  return (
    <Stack gap="xs">
      {allowEntityStructureEditing && (
        <Box
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f0f9ff",
            cursor: "pointer",
          }}
          p="sm"
          onClick={handleAddSubjects}
        >
          <Flex align="center" gap="xs">
            <IconPlus size={15} color="#1c7ed6" />
            <Text fw={500} c="#1c7ed6">
              Add Subjects
            </Text>
          </Flex>
        </Box>
      )}
      <ScrollArea h={650} type="auto">
        <Stack gap="xs">
          {shouldShowEmptyState ? (
            <Box
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
              }}
              p="md"
            >
              <Text c="dimmed" ta="center">
                Use the button above to add subjects.
              </Text>
            </Box>
          ) : (
            datasetEntityArray.map((subject) => (
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
                <Flex
                  align="center"
                  gap="xs"
                  onClick={() =>
                    allowEntitySelection && handleEntitySelect(subject, "subject", null)
                  }
                  style={{
                    cursor: allowEntitySelection ? "pointer" : "default",
                  }}
                  sx={
                    allowEntitySelection
                      ? {
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.03)",
                          },
                        }
                      : undefined
                  }
                >
                  <IconUser size={15} />
                  <Text fw={600}>{subject.subjectId}</Text>
                  {allowEntityStructureEditing && (
                    <>
                      <IconEdit
                        color="blue"
                        size={18}
                        style={{ marginLeft: "4px", opacity: 0.6, cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSubject(subject);
                        }}
                      />
                      <IconTrash
                        color="red"
                        size={16}
                        style={{ opacity: 0.6, cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(subject);
                        }}
                      />
                    </>
                  )}
                </Flex>

                {allowEntityStructureEditing && showSamples && (
                  <HierarchyItem
                    label={`Add sample(s) to ${subject.subjectId}`}
                    icon="add"
                    level={2}
                    parentEntityData={subject}
                    onAdd={handleAddSample}
                  />
                )}

                {/* Samples */}
                {showSamples &&
                  subject.samples?.map((sample) => (
                    <HierarchyItem
                      key={sample.sampleId}
                      icon="sample"
                      label={sample.sampleId}
                      level={2}
                      allowEntityStructureEditing={allowEntityStructureEditing}
                      allowEntitySelection={allowEntitySelection}
                      entityData={sample}
                      entityType="sample"
                      parentEntityData={subject}
                      onEdit={() => handleEditSample(sample, subject)}
                      onDelete={() => handleDeleteSample(sample, subject)}
                      onSelect={handleEntitySelect}
                    >
                      {/* Sample Sites */}
                      {allowEntityStructureEditing && showSampleSites && (
                        <HierarchyItem
                          label={`Add site(s) to ${sample.sampleId}`}
                          icon="add"
                          level={3}
                          parentEntityData={{ sample, subject }}
                          onAdd={handleAddSampleSite}
                        />
                      )}
                      {showSampleSites &&
                        sample.sites?.map((site) => (
                          <HierarchyItem
                            key={site.siteId}
                            icon="site"
                            label={site.siteId}
                            level={3}
                            allowEntityStructureEditing={allowEntityStructureEditing}
                            allowEntitySelection={allowEntitySelection}
                            entityData={site}
                            entityType="site"
                            parentEntityData={{ sample, subject }}
                            onEdit={() => handleEditSampleSite(site, { sample, subject })}
                            onDelete={() => handleDeleteSampleSite(site, { sample, subject })}
                            onSelect={handleEntitySelect}
                          />
                        ))}

                      {allowEntityStructureEditing && showSamplePerformances && (
                        <HierarchyItem
                          label={`Add performance(s) to ${sample.sampleId}`}
                          icon="add"
                          level={3}
                          parentEntityData={{ sample, subject }}
                          onAdd={handleAddSamplePerformance}
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
                            allowEntitySelection={allowEntitySelection}
                            entityData={performance}
                            entityType="performance"
                            parentEntityData={{ sample, subject }}
                            onEdit={() =>
                              handleEditSamplePerformance(performance, { sample, subject })
                            }
                            onDelete={() =>
                              handleDeleteSamplePerformance(performance, { sample, subject })
                            }
                            onSelect={handleEntitySelect}
                          />
                        ))}
                    </HierarchyItem>
                  ))}

                {/* Subject Sites */}
                {showSubjectSites &&
                  subject.subjectSites?.map((site) => (
                    <HierarchyItem
                      key={site.siteId}
                      icon="site"
                      label={site.siteId}
                      level={2}
                      allowEntityStructureEditing={allowEntityStructureEditing}
                      allowEntitySelection={allowEntitySelection}
                      entityData={site}
                      entityType="site"
                      parentEntityData={subject}
                      onEdit={() => handleEditSubjectSite(site, subject)}
                      onDelete={() => handleDeleteSubjectSite(site, subject)}
                      onSelect={handleEntitySelect}
                    />
                  ))}
                {allowEntityStructureEditing && showSubjectSites && (
                  <HierarchyItem
                    label={`Add site(s) to ${subject.subjectId}`}
                    icon="add"
                    level={2}
                    parentEntityData={subject}
                    onAdd={handleAddSubjectSite}
                  />
                )}
                {allowEntityStructureEditing && showSubjectPerformances && (
                  <HierarchyItem
                    label={`Add performance(s) to ${subject.subjectId}`}
                    icon="add"
                    level={2}
                    parentEntityData={subject}
                    onAdd={handleAddSubjectPerformance}
                  />
                )}
                {showSubjectPerformances &&
                  subject.subjectPerformances?.map((performance) => (
                    <HierarchyItem
                      key={performance.performanceId}
                      icon="performance"
                      label={performance.performanceId}
                      level={2}
                      allowEntityStructureEditing={allowEntityStructureEditing}
                      allowEntitySelection={allowEntitySelection}
                      entityData={performance}
                      entityType="performance"
                      parentEntityData={subject}
                      onEdit={() => handleEditSubjectPerformance(performance, subject)}
                      onDelete={() => handleDeleteSubjectPerformance(performance, subject)}
                      onSelect={handleEntitySelect}
                    />
                  ))}
              </Box>
            ))
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
};

export default EntityHierarchyRenderer;
