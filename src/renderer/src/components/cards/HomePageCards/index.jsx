import { Stack } from "@mantine/core";
import HeroCard from "../HeroCard";

const heroCardIds = ["button-homepage-guided-mode", "button-homepage-freeform-mode"];

const HomePageCards = () => (
  <Stack align="center" gap="md" my="lg">
    {heroCardIds.map((id) => (
      <HeroCard key={id} id={id} />
    ))}
  </Stack>
);

export default HomePageCards;
