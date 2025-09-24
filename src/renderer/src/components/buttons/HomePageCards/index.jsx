import { Button, Card, Text, Stack, Center, ActionIcon } from "@mantine/core";
import { IconArrowRight, IconDatabase, IconUpload } from "@tabler/icons-react";
import { useHover } from "@mantine/hooks";
import classes from "../CheckboxCard/CheckboxCard.module.css";

const cardData = [
  {
    id: "button-homepage-guided-mode",
    icon: <IconDatabase size={32} color="black" />,
    title: "Prepare a Dataset Step-by-Step",
    description:
      "Use this option to organize your dataset step by step according to the SPARC Dataset Structure.",
    buttonLabel: "Start Preparation",
    buttonColor: "blue",
    onClick: () => console.log("Starting Dataset Preparation"),
  },
  {
    id: "button-homepage-freeform-mode",
    icon: <IconUpload size={32} color="black" />,
    title: "Upload a SDS Compliant Dataset",
    description: "Use this option to submit your dataset for publication on the SPARC portal.",
    buttonLabel: "Start Upload",
    buttonColor: "blue",
    onClick: () => window.handleSideBarTabClick("upload-dataset-view", "upload"),
  },
];

const HomeCard = ({ id, icon, title, description, buttonLabel, buttonColor, onClick }) => {
  const { hovered, ref } = useHover();
  return (
    <Card
      id={id}
      ref={ref}
      shadow={hovered ? "md" : "xs"}
      radius="md"
      padding="lg"
      m="sm"
      withBorder
      className={hovered ? classes.selected : ""}
      w="700px"
      style={{
        minHeight: 220,
        borderColor: hovered ? "var(--mantine-color-blue-6)" : "var(--mantine-color-gray-3)",
        backgroundColor: hovered ? "var(--mantine-color-blue-0)" : "#fff",
        opacity: 1,
        transition: "border 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s",
        transform: hovered ? "translateY(-2px)" : "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <Center mb={16}>
        <ActionIcon size={64} variant="light" color={buttonColor} radius="xl">
          {icon}
        </ActionIcon>
      </Center>
      <Stack align="center" gap={4} style={{ width: "100%" }}>
        <Text size="lg" fw={600} ta="center">
          {title}
        </Text>
        <Text size="md" c="dimmed" ta="center" mt="md">
          {description}
        </Text>
      </Stack>
    </Card>
  );
};

const HomePageCards = () => (
  <Stack align="center" gap="md" my="lg">
    {cardData.map((card, index) => (
      <HomeCard key={index} {...card} />
    ))}
  </Stack>
);

export default HomePageCards;
