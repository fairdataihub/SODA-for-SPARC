import { Card, Center, Text } from "@mantine/core";
import { IconCirclePlus } from "@tabler/icons-react";
import { useHover } from "@mantine/hooks";

const cardData = {
  "start-new-card": {
    icon: <IconCirclePlus size={40} />,
    text: "Prepare and share a new dataset",
  },
  "import-existing-card": {
    icon: <IconCirclePlus size={40} />,
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
      style={{
        width: 180,
        height: 150,
        cursor: "pointer",
        borderColor: hovered ? "var(--mantine-color-blue-6)" : "var(--mantine-color-gray-3)",
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
      <Text size="md" lh={1.3}>
        {text}
      </Text>
    </Card>
  );
}
