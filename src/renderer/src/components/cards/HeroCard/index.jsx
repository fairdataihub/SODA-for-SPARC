import { Card, Text, Stack, Center, ThemeIcon } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { IconDatabase, IconUpload, IconCirclePlus } from "@tabler/icons-react";
import classes from "../cards.module.css";

const heroCardData = [
  {
    id: "button-homepage-guided-mode",
    icon: <IconDatabase size={32} color="black" />,
    title: "Prepare a Dataset Step-by-Step",
    description:
      "Use this option to organize your dataset step by step according to the SPARC Dataset Structure.",
    onClick: () => window.openCurationMode("guided"),
  },
  {
    id: "button-homepage-freeform-mode",
    icon: <IconUpload size={32} color="black" />,
    title: "Upload a SDS Compliant Dataset",
    description: "Use this option to submit your dataset for publication on the SPARC portal.",
    onClick: () => window.openCurationMode("freeform"),
  },
  {
    id: "guided-button-start-new-curation",
    icon: <IconCirclePlus size={32} color="black" />,
    title: "Prepare and share a new dataset",
    description: null,
    onClick: () => document.getElementById("guided-next-button").click(),
    customWidth: "800px",
    customMargin: "0",
    customHeight: 160,
  },
  {
    id: "ffm-button-start-new-curation",
    icon: <IconCirclePlus size={32} color="black" />,
    title: "Start uploading data to a new or existing dataset",
    description: null,
    onClick: () => document.getElementById("guided-next-button").click(),
    customWidth: "800px",
    customMargin: "0",
    customHeight: 160,
  },
];

const HeroCard = ({ id }) => {
  const { hovered, ref } = useHover();
  const card = heroCardData.find((c) => c.id === id);

  if (!card) return null;

  const { icon, title, description, onClick } = card;

  return (
    <Card
      ref={ref}
      id={id}
      padding="0"
      m={card.customMargin || "sm"}
      className={classes.card}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        width: card.customWidth || "700px",
        height: card.customHeight ? `${card.customHeight}px` : "220px",
      }}
      onClick={onClick}
    >
      <Stack align="center" gap="md" style={{ width: "100%", padding: "lg" }}>
        <Center>
          <ThemeIcon size={64} variant="light" radius="xl">
            {icon}
          </ThemeIcon>
        </Center>
        <Stack align="center" gap={4} style={{ width: "100%" }}>
          <Text size="lg" fw={600} ta="center">
            {title}
          </Text>
          {description && (
            <Text size="md" c="dimmed" ta="center">
              {description}
            </Text>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};

export default HeroCard;
