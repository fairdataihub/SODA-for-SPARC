import { Accordion, Text, List, Group, Table } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import SodaPaper from "../SodaPaper";
import useGlobalStore from "../../../../stores/globalStore";
import ExternalLink from "../../../buttons/ExternalLink";

const dropDownIcons = {
  info: <IconInfoCircle size={18} color="var(--mantine-color-primary-6)" />,
  question: <IconInfoCircle size={18} color="gray" />,
};

const renderDataCategoriesNote = (datasetType, datasetIncludesCode) => (
  <>
    {datasetType === "experimental" && (
      <SodaPaper>
        <Text fw={600}>Experimental</Text>
        <Text size="sm">
          Data collected from experiments, such as raw or processed measurements, images,
          recordings, or any primary data generated during the study.
        </Text>
      </SodaPaper>
    )}
    {datasetIncludesCode && (
      <SodaPaper>
        <Text fw={600}>Code</Text>
        <Text size="sm">
          Scripts, computational models, analysis pipelines, or other software used for data
          processing, analysis, or simulation in the study.
        </Text>
      </SodaPaper>
    )}
    {datasetType === "computational" && (
      <SodaPaper>
        <Text fw={600}>Primary</Text>
        <Text size="sm">
          Data generated or processed through computational methods, such as simulation results,
          model outputs, or tabular data.
        </Text>
      </SodaPaper>
    )}
    {datasetType === "experimental" && (
      <SodaPaper>
        <Text fw={600}>Protocol</Text>
        <Text size="sm">
          Protocols such as standard operating procedures or step-by-step instructions describing
          how experiments or analyses were performed.
        </Text>
      </SodaPaper>
    )}
    {datasetType === "computational" && (
      <SodaPaper>
        <Text fw={600}>Protocol</Text>
        <Text size="sm">
          Protocols such as workflows, step-by-step instructions, or documentation describing how
          your data was generated, processed, or analyzed.
        </Text>
      </SodaPaper>
    )}
    <SodaPaper>
      <Text fw={600}>Documentation</Text>
      <Text size="sm">
        Supporting documents such as README files, data dictionaries, or other materials that help
        users understand and reuse the dataset.
      </Text>
    </SodaPaper>
  </>
);

const DropDownNote = ({ id }) => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const datasetIncludesSubjects = selectedEntities.includes("subjects");
  const datasetIncludesSamples = selectedEntities.includes("samples");
  const datasetIncludesSites =
    selectedEntities.includes("subjectSites") || selectedEntities.includes("sampleSites");
  const datasetIncludesCode = selectedEntities.includes("code");
  const datasetType = useGlobalStore((state) => state.datasetType);

  const configMap = {
    "data-categories-list": {
      dropDownIcon: "info",
      dropDownButtonText: `Learn more about the data categories for ${datasetType} datasets`,
      dropDownNote: renderDataCategoriesNote(datasetType, datasetIncludesCode),
    },
    "entity-types-list": {
      dropDownIcon: "info",
      dropDownButtonText: "Learn more about entities and entity types",
      dropDownNote: (
        <>
          <Text size="sm" mb="md">
            In the SPARC Dataset Structure (SDS), an <strong>entity</strong> is a core item in your
            dataset such as a subject, sample, or site, that helps organize and describe your data.
            Based on your selections on the Dataset Content page, you will need to provide assign
            unique IDs for the following entity types:
          </Text>
          {datasetIncludesSubjects && (
            <SodaPaper>
              <Text fw={600}>Subjects</Text>
              <Text size="sm">
                Subjects are living organisms from which data or samples are collected, such as
                mice, rats, or humans. Each subject must be assigned an unique ID (e.g.,
                sub-mouse-1, sub-mouse-2).
              </Text>
            </SodaPaper>
          )}
          {datasetIncludesSamples && (
            <SodaPaper>
              <Text fw={600}>Samples</Text>
              <Text size="sm">
                Samples are biological materials taken from a subject, such as brain tissue or
                blood. Each sample must be assigned an unique ID (e.g., sam-tissue-1, sam-tissue-2)
                and be linked to a subject.
              </Text>
            </SodaPaper>
          )}

          {datasetIncludesSites && (
            <SodaPaper>
              <Text fw={600}>Sites</Text>
              <Text size="sm">
                Sites are specific locations on a subject or sample where data is collected or
                procedures take place, such as a brain region or tissue section. Each site must be
                assigned an unique ID (e.g., site-node-1, site-node-2).
              </Text>
            </SodaPaper>
          )}
        </>
      ),
    },
    "dataset-entity-management-page": {
      dropDownIcon: "info",
      dropDownButtonText: "Learn more about managing the structure of your entities",
      dropDownNote: (
        <>
          <Text mt="md">The recommended workflow for specifying entity IDs on this page is:</Text>
          <List type="ordered" mt="md" withPadding>
            {datasetIncludesSubjects && (
              <List.Item>
                <Text mb="sm">
                  <strong>Specify subject IDs</strong> – For each subject, click the “Add Subject”
                  button, enter metadata for the subject (at minimum the subject ID), then click the
                  blue “Add Subject” button at the top or bottom of the form.
                </Text>
              </List.Item>
            )}

            {datasetIncludesSamples && (
              <List.Item>
                <Text mb="sm">
                  <strong>Specify sample IDs</strong> – For each sample, click the “Add Sample”
                  button under the subject the sample belongs to, enter metadata for the sample (at
                  minimum the sample ID), then click the blue “Add Sample” button at the top or
                  bottom of the form.
                </Text>
              </List.Item>
            )}

            {datasetIncludesSites && (
              <List.Item>
                <Text>
                  <strong>Specify site IDs</strong> – For each site, click the “Add Site” button
                  under the{" "}
                  {selectedEntities.includes("subjectSites") &&
                  selectedEntities.includes("sampleSites")
                    ? "subject or sample"
                    : selectedEntities.includes("subjectSites")
                      ? "subject"
                      : "sample"}{" "}
                  the site belongs to, enter metadata for the site (at minimum the site ID), then
                  click the blue “Add Site” button at the top or bottom of the form.
                </Text>
              </List.Item>
            )}
          </List>
        </>
      ),
    },
    "user-retrieved-datasets-but-missing-desired-dataset": {
      dropDownIcon: "question",
      dropDownButtonText: "Why can't I find my dataset?",
      dropDownNote: (
        <>
          <Text size="sm" mb="sm">
            Only datasets that are empty (have no folders or files) are shown in the dropdown above.
            SODA does not currently support uploading to datasets that are not empty in the "Prepare
            dataset step-by-step" because of potential conflicts with existing data.
          </Text>
          <Text size="sm">
            You must also have <strong>"Owner"</strong> or <strong>"Manager"</strong> or{" "}
            <strong>"Editor"</strong> permissions on the dataset in order for SODA to retrieve it.
          </Text>
        </>
      ),
    },
    "user-doesnt-have-any-empty-datasets": {
      dropDownIcon: "question",
      dropDownButtonText: "Why wasn't SODA able to retrieve any datasets?",
      dropDownNote: (
        <>
          <Text size="sm" mb="sm">
            Only datasets that are empty (have no folders or files) are shown in the dropdown above.
            SODA does not currently support uploading to datasets that are not empty in the "Prepare
            dataset step-by-step" because of potential conflicts with existing data.
          </Text>
          <Text size="sm">
            You must also have <strong>"Owner"</strong> or <strong>"Manager"</strong> or{" "}
            <strong>"Editor"</strong> permissions on the dataset in order for SODA to retrieve it.
          </Text>
        </>
      ),
    },
    "license-selection-help": {
      dropDownIcon: "info",
      dropDownButtonText: "Learn more about the available licenses",
      dropDownNote: (
        <>
          <Text>
            To learn more about the the licenses SODA supports and the permissions they grant,
            please visit{" "}
            <ExternalLink
              href="https://docs.pennsieve.io/docs/common-dataset-licenses"
              buttonText="docs.pennsieve.io/docs/common-dataset-licenses"
              buttonType="anchor"
            />
            .
          </Text>
        </>
      ),
    },
    "data-categories-explanation": {
      dropDownIcon: "info",
      dropDownButtonText: "Learn more about Primary, Source, and Derivative data",
      dropDownNote: (
        <List spacing="sm" mt="sm">
          <List.Item>
            <b>Primary data:</b> Minimally processed data collected directly in your study (e.g.
            time‑series recordings, raw imaging or microscopy data, genomic or tabular outputs).
          </List.Item>
          <List.Item>
            <b>Source data:</b> Unaltered, raw input data or instrument outputs (e.g. raw signals,
            original k‑space MRI data, unprocessed imaging data) that preceded any reconstruction,
            conversion or analysis.
          </List.Item>
          <List.Item>
            <b>Derivative data:</b> Data derived from primary or source data by processing,
            analysis, conversion or annotation (e.g. processed images, segmentation results,
            statistical summaries, converted formats, model outputs).
          </List.Item>
        </List>
      ),
    },
  };

  const config = configMap[id];
  if (!config) return null;

  return (
    <Accordion
      variant="separated"
      defaultValue={null} // closed by default
      chevronPosition="right"
      mt="md"
      styles={{
        chevron: {
          color: "var(--mantine-color-primary-6)",
        },

        panel: { backgroundColor: "var(--mantine-color-primary-0)" },
      }}
    >
      <Accordion.Item value={id}>
        <Accordion.Control>
          <Group spacing="xs" align="center">
            {dropDownIcons[config.dropDownIcon]}
            <Text>{config.dropDownButtonText}</Text>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>{config.dropDownNote}</Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};

export default DropDownNote;
