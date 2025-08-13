import { Accordion, Text, List, Group, Table } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import SodaPaper from "../SodaPaper";
import useGlobalStore from "../../../../stores/globalStore";

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
                <Text>
                  <strong>Add subjects</strong> - Click the "Add Subject" button, enter some
                  metadata for the subject (at minimum the subject's ID), and click the "Add
                  subject" button at the bottom of the form.
                </Text>
              </List.Item>
            )}
            {datasetIncludesSamples && (
              <List.Item>
                <Text>
                  <strong>Add samples</strong> - Click the "Add Sample" button underneath the
                  subject that the sample was taken from, enter some metadata for the sample (at
                  minimum the sample's ID), and click the "Add Sample" button at the bottom of the
                  form.
                </Text>
              </List.Item>
            )}
            {datasetIncludesSites && (
              <List.Item>
                <Text>
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
    "license-explanations": {
      dropDownIcon: "info",
      dropDownButtonText: "Learn more about the licenses",
      dropDownNote: (
        <List spacing="sm">
          <List.Item>
            <strong>CDLA-Permissive-1.0 – Community Data License Agreement – Permissive</strong> —
            Allows data use, modification, and redistribution with minimal restrictions.
          </List.Item>
          <List.Item>
            <strong>CDLA-Sharing-1.0 – Community Data License Agreement – Sharing</strong> — Allows
            use and modification, but derivative works must be shared under the same license.
          </List.Item>
          <List.Item>
            <strong>ODbL – Open Data Commons Open Database License</strong> — Allows sharing,
            modification, and commercial use of databases, with attribution and share-alike
            requirements.
          </List.Item>
          <List.Item>
            <strong>ODC-By – Open Data Commons Attribution License</strong> — Allows reuse of
            databases with attribution to the source.
          </List.Item>
          <List.Item>
            <strong>PDDL – Open Data Commons Public Domain Dedication and License</strong> — Places
            databases fully in the public domain for unrestricted use.
          </List.Item>
          <List.Item>
            <strong>CC-0 – Creative Commons Zero 1.0 Universal</strong> — Waives all rights and
            places the work in the public domain.
          </List.Item>
          <List.Item>
            <strong>CC-BY – Creative Commons Attribution</strong> — Allows reuse and modification,
            but credit to the original creator is required.
          </List.Item>
          <List.Item>
            <strong>CC-BY-SA – Creative Commons Attribution-ShareAlike</strong> — Allows reuse and
            modification with credit, but derivative works must use the same license.
          </List.Item>
          <List.Item>
            <strong>CC-BY-NC-SA – Creative Commons Attribution-NonCommercial-ShareAlike</strong> —
            Allows reuse and modification with credit, but derivative works must be non-commercial
            and use the same license.
          </List.Item>
          <List.Item>
            <strong>Apache-2.0 – Apache License 2.0</strong> — A permissive open-source license
            allowing use, modification, and distribution, with attribution and patent grant.
          </List.Item>
          <List.Item>
            <strong>GPL – GNU General Public License</strong> — A strong copyleft license requiring
            derivative works to also be licensed under GPL.
          </List.Item>
          <List.Item>
            <strong>LGPL – GNU Lesser General Public License</strong> — Similar to GPL but allows
            linking to non-(L)GPL software under certain conditions.
          </List.Item>
          <List.Item>
            <strong>MIT – MIT License</strong> — A permissive license allowing nearly unrestricted
            reuse with attribution.
          </List.Item>
          <List.Item>
            <strong>MPL-2.0 – Mozilla Public License 2.0</strong> — A weak copyleft license
            requiring modifications to covered code to be shared under MPL, but allowing combination
            with other licenses.
          </List.Item>
        </List>
      ),
    },
  };

  const config = configMap[id];
  if (!config) return null;

  return (
    <Accordion
      variant="contained"
      defaultValue={null} // closed by default
      chevronPosition="right"
      mt="md"
    >
      <Accordion.Item value="item-1">
        <Accordion.Control>
          <Group spacing="xs" noWrap align="center">
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
