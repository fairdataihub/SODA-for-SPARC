import { Accordion, Text, List, Group, Table } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import SodaPaper from "../SodaPaper";
import useGlobalStore from "../../../../stores/globalStore";
import ExternalLink from "../../../buttons/ExternalLink";

const dropDownIcons = {
  info: <IconInfoCircle size={18} color="gray" />,
  question: <IconInfoCircle size={18} color="gray" />,
};

const renderDataCategoriesNote = (datasetIncludesCode) => (
  <>
    <SodaPaper>
      <Text fw={600}>Experimental</Text>
      <Text size="sm">
        Data collected from experiments, such as raw or processed measurements, images, recordings,
        or any primary data generated during the study.
      </Text>
    </SodaPaper>
    {datasetIncludesCode && (
      <SodaPaper>
        <Text fw={600}>Code</Text>
        <Text size="sm">
          Scripts, computational models, analysis pipelines, or other software used for data
          processing, analysis, or simulation in the study.
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
    <SodaPaper>
      <Text fw={600}>Protocol</Text>
      <Text size="sm">
        Protocols, standard operating procedures, or step-by-step instructions describing how
        experiments or analyses were performed.
      </Text>
    </SodaPaper>
  </>
);

const DropDownNote = ({ id }) => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const datasetIncludesSubjects = selectedEntities.includes("subjects");
  const datasetIncludesSamples = selectedEntities.includes("samples");
  const datasetIncludesSites = selectedEntities.includes("sites");
  const datasetIncludesCode = selectedEntities.includes("code");

  const configMap = {
    "data-categories-list": {
      dropDownIcon: "info",
      dropDownButtonText: "Learn more about the data categories",
      dropDownNote: renderDataCategoriesNote(datasetIncludesCode),
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
          <Text size="sm">
            The SPARC Dataset Structure (SDS) requires you to denote entities and their
            relationships. This page allows you to add, edit, or remove entities such as subjects,
            samples, and sites. The recommended workflow for this page is:
          </Text>
          <List type="ordered" mt="md">
            {datasetIncludesSubjects && (
              <List.Item>
                <Text size="sm">
                  <strong>Add subjects</strong> - Click the "Add Subject" button, enter some
                  metadata for the subject (at minimum the subject's ID), and click the "Add
                  subject" button at the bottom of the form.
                </Text>
              </List.Item>
            )}
            {datasetIncludesSamples && (
              <List.Item>
                <Text size="sm">
                  <strong>Add samples</strong> - Click the "Add Sample" button underneath the
                  subject that the sample was taken from, enter some metadata for the sample (at
                  minimum the sample's ID), and click the "Add Sample" button at the bottom of the
                  form.
                </Text>
              </List.Item>
            )}
            {datasetIncludesSites && (
              <List.Item>
                <Text size="sm">
                  <strong>Add sites</strong> - Click the "Add site" button underneath the sample the
                  site is from, enter some metadata for the site (at minimum the site's ID), and
                  click the "Add site" button at the bottom of the form.
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
            You must also have <strong>"Owner"</strong> or <strong>"Manager"</strong> permissions on
            the dataset in order for SODA to retrieve it.
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
            You must also have <strong>"Owner"</strong> or <strong>"Manager"</strong> permissions on
            the dataset in order for SODA to retrieve it.
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
  };

  const config = configMap[id];
  if (!config) return null;

  return (
    <Accordion
      variant="separated"
      defaultValue={null} // closed by default
      chevronPosition="right"
      mt="md"
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
