import { Card, Center, Text, Tooltip } from "@mantine/core";
import classes from "../cards.module.css";
import { IconCirclePlus, IconFolderDown, IconFileDownload } from "@tabler/icons-react";
import { useHover } from "@mantine/hooks";

const cardData = {
  "download-high-level-folders-btn": {
    icon: <IconFolderDown size={50} color="black" />,
    text: "Download folder structure and metadata files",
    tooltip:
      "This will download a template folder structure and templates for all the high-level metadata fields prescribed in the SPARC Dataset Structure (SDS)",
  },
  "download-manifest-only-btn": {
    icon: <IconFileDownload size={50} color="black" />,
    text: "Download metadata files",
    tooltip:
      "This will download the templates for all the high-level metadata files prescribed in the SPARC Dataset Structure (SDS)",
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

export function CardButton({ id }) {
  const { icon, text, tooltip } = cardData[id];
  const { hovered, ref } = useHover();

  const handleClick = () => {};

  const cardContent = (
    <Card
      withBorder
      radius="md"
      padding="lg"
      ref={ref}
      onClick={handleClick}
      shadow={hovered ? "sm" : "xs"}
      id={id}
      className={classes.card}
      style={{
        width: 180,
        height: 150,
        minHeight: 150,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        cursor: "pointer",
      }}
    >
      <Center mb="sm">{icon}</Center>
      <Text size="md" lh={1.3} fw={450}>
        {text}
      </Text>
    </Card>
  );

  return tooltip ? (
    <Tooltip label={tooltip} position="top" withArrow zIndex={2999} w={400} multiline>
      {cardContent}
    </Tooltip>
  ) : (
    cardContent
  );
}
