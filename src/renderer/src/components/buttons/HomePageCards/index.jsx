import { Button, Card, Text, Stack, Title, ActionIcon } from "@mantine/core";
import { IconArrowRight, IconDatabase, IconUpload } from "@tabler/icons-react";

const cardData = [
  {
    icon: <IconDatabase size={32} />,
    title: "Prepare a Dataset Step-by-Step",
    description:
      "Use this option to organize your dataset step by step according to the SPARC Dataset Structure.",
    buttonLabel: "Start Preparation",
    buttonColor: "blue",
    onClick: () => console.log("Starting Dataset Preparation"),
  },
  {
    icon: <IconUpload size={32} />,
    title: "Upload a SDS Compliant Dataset",
    description: "Use this option to submit your dataset for publication on the SPARC portal.",
    buttonLabel: "Start Upload",
    buttonColor: "green",
    onClick: () => console.log("Starting Dataset Upload"),
  },
];

const HomeCard = ({ icon, title, description, buttonLabel, buttonColor, onClick }) => (
  <Card
    shadow="sm"
    padding="lg"
    radius="md"
    w="700px"
    withBorder
    style={{
      height: "100%",
      cursor: "pointer",
      transition: "all 0.3s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "var(--mantine-shadow-lg)",
      },
    }}
  >
    <Stack align="center" gap="md">
      <ActionIcon size={64} variant="light">
        {icon}
      </ActionIcon>
      <Text size="lg" fw={600} ta="center">
        {title}
      </Text>
      <Text size="sm" c="dimmed" ta="center">
        {description}
      </Text>
      <Button
        size="md"
        variant="light"
        color={buttonColor}
        fullWidth
        rightSection={<IconArrowRight size={20} />}
        onClick={onClick}
      >
        {buttonLabel}
      </Button>
    </Stack>
  </Card>
);

const HomePageCards = () => (
  <Stack align="center" gap="md" my="lg">
    {cardData.map((card, index) => (
      <HomeCard key={index} {...card} />
    ))}
  </Stack>
);

export default HomePageCards;
