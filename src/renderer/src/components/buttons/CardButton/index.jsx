import { Card, Center, Text } from "@mantine/core";
import { IconCirclePlus, IconFolderDown, IconFileDownload } from "@tabler/icons-react";
import { useHover } from "@mantine/hooks";

const cardData = {
  "download-high-level-folders-btn": {
    icon: <IconFolderDown size={50} color="teal" />,
    text: "Download folder structure and metadata files",
  },
  "download-manifest-only-btn": {
    icon: <IconFileDownload size={50} color="teal" />,
    text: "Download metadata files",
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
  const { icon, text } = cardData[id];
  const { hovered, ref } = useHover();

  const handleClick = () => {
    console.log("Card clicked:", id);
  };

  return (
    <Card
      withBorder
      radius="md"
      padding="lg"
      ref={ref}
      onClick={handleClick}
      shadow={hovered ? "sm" : "xs"}
      id={id}
      style={{
        width: 180,
        height: 150,
        cursor: "pointer",
        borderColor: hovered ? "var(--mantine-color-blue-6)" : "var(--mantine-color-gray-4)",
        backgroundColor: hovered ? "var(--mantine-color-blue-0)" : "#fff",
        transition: "border 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s",
        transform: hovered ? "translateY(-2px)" : "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Center mb="sm">{icon}</Center>
      <Text size="md" lh={1.3} fw={450}>
        {text}
      </Text>
    </Card>
  );
}
