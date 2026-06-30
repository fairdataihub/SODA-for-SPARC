import { Flex, Card, Box, Text, ColorSwatch, Center, Group, Tooltip } from "@mantine/core";
import { left } from "@popperjs/core";
import SodaGreenPaper from "../../utils/ui/SodaGreenPaper";

import {
  IconChevronUp,
  IconChevronDown,
  IconFolder,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import { useState, useCallback } from "react";

const folderCardConfig = {
  primary: {
    title: "primary",
    required: true,
    labelText:
      "The primary folder holds all data files for experimental subjects/samples. Data is processed and analysis ready.",
  },
  derivative: {
    title: "derivative",
    required: false,
    labelText: "Contains data derived from the data in the primary folder.",
  },
  source: {
    title: "source",
    required: false,
    labelText: "The source folder holds unaltered, raw files from an experiment.",
  },
  protocol: {
    title: "protocol",
    labelText: "Place files that describe the experimental protocols used to gather your data.",
  },
  docs: {
    title: "docs",
    required: false,
    labelText: "Contains all supporting documents for your dataset.",
  },
  code: {
    title: "code",
    required: false,
    labelText: "Place any code used in the generation of your data here.",
  },
};

const metadataCardConfig = {
  dataset_description: {
    title: "dataset_description.xlsx",
    required: true,
    labelText: "Contains metadata describing the dataset.",
  },
  manifest: {
    title: "manifest.xlsx",
    required: true,
    labelText: "Contains metadata describing the files in your dataset.",
  },
  submission: {
    title: "submission.xlsx",
    required: true,
    labelText: "Contains metadata describing the submission and related milestones.",
  },
  samples: {
    title: "samples.xlsx",
    required: false,
    labelText: "Contains metadata describing the samples involved in the data collection.",
  },
  subjects: {
    title: "subjects.xlsx",
    required: false,
    labelText: "Contains metadata describing the subjects involved in the data collection.",
  },
  sites: {
    title: "sites.xlsx",
    required: false,
    labelText:
      "Contains metadata describing data collected at particular locations on a subject or sample.",
  },
  resources: {
    title: "resources.xlsx",
    required: false,
    labelText:
      "Contains metadata describing resources used in data collection, such as reagents, equipment, software, etc.",
  },
  performances: {
    title: "performances.xlsx",
    required: false,
    labelText:
      "Contains ometadata describing from multiple performances of a trial/session/visit using the same experimental protocol.",
  },
  code_description: {
    title: "code_description.xlsx",
    required: false,
    labelText: "Contains metadata describing the code used in the generaiton of the data.",
  },
  README: {
    title: "README.md",
    required: false,
    labelText: "Contains information aimed at new users on how to use the dataset.",
  },
};

const DatasetStructureVisualAid = () => {
  const [expanded, setExpanded] = useState({});
  const toggleExpanded = (key) => {
    setExpanded((prev) => ({ ...prev, [0]: !prev[0] }));
  };

  return (
    <Box>
      <div style={{ width: "100%", margin: "auto" }}>
        <Flex direction="row" justify="flex-end" p="md" columnGap="sm" mr="3.2rem" mt="1rem">
          <Flex direction="row" justify="flex-start">
            <IconFolder /> <label style={{ marginLeft: ".2rem", marginTop: ".3rem" }}>Folder</label>
          </Flex>
          <Flex direction="row" justify="flex-start">
            <IconFileSpreadsheet />{" "}
            <label style={{ marginLeft: ".2rem", marginTop: ".3rem" }}>Metadata File</label>
          </Flex>
          <Flex direction="row">
            <ColorSwatch color="#A8D08D" />{" "}
            <label style={{ marginLeft: ".2rem", marginTop: ".3rem" }}>Required</label>
          </Flex>
        </Flex>
      </div>
      <Flex
        mih={50}
        w="100%"
        gap="md"
        justify="center"
        align="center"
        direction="row"
        wrap="wrap"
        mt="lg"
      >
        {Object.entries(folderCardConfig).map(([key, config], value) => {
          return (
            <Card
              key={key}
              withBorder
              shadow="sm"
              bg={config.required ? "#A8D08D" : "white"}
              w="15rem"
              h="13rem"
            >
              <Flex direction="column">
                <Card.Section withBorder inheritPadding py="md">
                  <IconFolder />
                </Card.Section>
                <Card.Section withBorder inheritPadding py="md">
                  <Text fw={500}>{config.title}</Text>
                  <Text fw={100} size="xs" textwrap="wrap">
                    {config.labelText}
                  </Text>
                </Card.Section>
              </Flex>
            </Card>
          );
        })}
      </Flex>

      <Flex
        mih={50}
        gap="md"
        justify="center"
        align="center"
        direction="row"
        wrap="wrap"
        mt="lg"
        w="100%"
      >
        {Object.entries(metadataCardConfig).map(([key, config], value) => {
          return (
            <Card
              key={key}
              withBorder
              shadow="sm"
              bg={config.required ? "#A8D08D" : "white"}
              w="15rem"
              h="13rem"
            >
              <Flex direction="column">
                <Card.Section withBorder inheritPadding py="md">
                  <IconFileSpreadsheet />
                </Card.Section>
                <Card.Section withBorder inheritPadding py="md">
                  <Text fw={500}>{config.title}</Text>
                  <Text fw={100} size="xs" textwrap="wrap">
                    {config.labelText}
                  </Text>
                </Card.Section>
              </Flex>
            </Card>
          );
        })}
      </Flex>
    </Box>
  );
};

export default DatasetStructureVisualAid;
