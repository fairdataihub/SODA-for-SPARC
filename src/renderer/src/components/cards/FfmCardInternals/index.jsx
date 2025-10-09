import { Card, Center, Text, Tooltip, Stack } from "@mantine/core";
import classes from "../cards.module.css";
import { IconCirclePlus, IconFolderDown, IconFileDownload } from "@tabler/icons-react";
import { useHover } from "@mantine/hooks";

const cardData = {
  "dataset-upload-existing-dataset": {
    icon: <IconFolderDown size={50} color="teal" />,
    text: "Existing dataset",
    tooltip:
      "This will download a template folder structure and templates for all the high-level metadata fields prescribed in the SPARC Dataset Structure (SDS)",
  },
  "dataset-upload-new-dataset": {
    icon: <IconFileDownload size={50} color="teal" />,
    text: "New dataset what happens now when text goes under",
  },
  "start-new-card": {
    icon: <IconCirclePlus size={50} />,
    text: "Prepare and share a new dataset",
  },
  "import-existing-card": {
    icon: <IconCirclePlus size={50} />,
    text: "Import and manage an existing dataset",
  },
};
const FfmCardInternals = ({ id }) => {
  console.log("id in ffm card internals:", id);
  if (!cardData[id]) {
    console.error(`No card data found for id: ${id}`);
    return <div>Invalid FFM Card Internals {id}</div>; // or some fallback UI
  }
  const { icon, text, tooltip } = cardData[id];

  /*
    <Center mb={isCompact ? "sm" : 16}>
            <Icon
              size={50}
              style={{
                color: isDisabled
                  ? "var(--mantine-color-gray-5)"
                  : checked
                    ? "var(--mantine-color-blue-6)"
                    : "var(--mantine-color-black)",
              }}
            />
          </Center>
        )
      )}
      {isCompact ? (
        <Center h={50}>
          <Text size="md" lh={1.3} fw={450} h={50}>
            {title}
          </Text>
        </Center>*/

  const cardContent = (
    <>
      <Center mb="sm">{icon}</Center>
      <Center mb="sm">
        <Text size="md" lh={1.3} fw={450} h={50}>
          {text}
        </Text>
      </Center>
    </>
  );

  return tooltip ? (
    <Tooltip label={tooltip} position="top" withArrow zIndex={2999} w={400} multiline>
      {cardContent}
    </Tooltip>
  ) : (
    cardContent
  );
};

export default FfmCardInternals;
