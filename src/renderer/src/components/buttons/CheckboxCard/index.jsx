import useGlobalStore from "../../../stores/globalStore";
import { Checkbox, Text, Stack, Badge, Card, Center, ActionIcon } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import classes from "./CheckboxCard.module.css";
import pennsieveLogo from "../../../assets/img/pennsieveLogo.png";
import {
  setCheckboxCardChecked,
  setCheckboxCardUnchecked,
} from "../../../stores/slices/checkboxCardSlice";

const CheckboxCard = ({ id }) => {
  const cardData = useGlobalStore((state) => state.cardData);
  if (!cardData[id]) return <div>Invalid id: {id}</div>;
  const {
    title,
    description,
    Icon,
    image,
    mutuallyExclusiveWithCards = [],
    comingSoon,
    checked,
    nextElementID,
  } = cardData[id];
  const isDisabled = !!comingSoon;
  const { hovered, ref } = useHover();

  const handleClick = () => {
    if (isDisabled) return;
    if (checked) {
      setCheckboxCardUnchecked(id);
    } else {
      // Uncheck mutually exclusive cards
      mutuallyExclusiveWithCards.forEach((cardId) => {
        setCheckboxCardUnchecked(cardId);
        // Hide their next element if defined
        const otherData = cardData[cardId];
        if (otherData && otherData.nextElementID) {
          const el = document.getElementById(otherData.nextElementID);
          if (el) el.classList.add("hidden");
        }
      });
      setCheckboxCardChecked(id);
      // Show this card's next element if defined
      if (nextElementID) {
        const el = document.getElementById(nextElementID);
        if (el) el.classList.remove("hidden");
      }
    }
  };

  const isCompact = !description;
  return (
    <Card
      ref={ref}
      onClick={handleClick}
      shadow={checked ? "sm" : "xs"}
      radius="md"
      padding="lg"
      mx="sm"
      my="xs"
      withBorder
      className={checked ? "selected" : ""}
      style={{
        width: isCompact ? 180 : 270,
        height: isCompact ? 150 : "auto",
        minHeight: isCompact ? 150 : 180,
        cursor: isDisabled ? "not-allowed" : "pointer",
        borderColor: checked ? "var(--mantine-color-blue-6)" : "var(--mantine-color-gray-3)",
        backgroundColor: isDisabled
          ? "var(--mantine-color-gray-0)"
          : checked
            ? "var(--mantine-color-blue-0)"
            : "#fff",
        opacity: isDisabled ? 0.8 : 1,
        transition: "border 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s",
        transform: hovered && isCompact ? "translateY(-2px)" : "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
      }}
    >
      {image ? (
        <img
          src={image}
          alt={title}
          style={{
            width: 48,
            height: 48,
            marginBottom: 16,
            objectFit: "contain",
            opacity: isDisabled ? 0.5 : 1,
          }}
        />
      ) : (
        Icon && (
          <Center mb={isCompact ? "sm" : 16}>
            <Icon
              size={50}
              style={{
                color: isDisabled
                  ? "var(--mantine-color-gray-5)"
                  : checked
                    ? "var(--mantine-color-blue-6)"
                    : "var(--mantine-color-gray-6)",
              }}
            />
          </Center>
        )
      )}
      {isCompact ? (
        <Text size="md" lh={1.3} fw={450}>
          {title}
        </Text>
      ) : (
        <Stack align="center" gap={4} style={{ width: "100%" }}>
          <Text
            fw={600}
            size="md"
            lh={1.2}
            align="center"
            mb="sm"
            c={isDisabled ? "dimmed" : undefined}
          >
            {title}
          </Text>
          <Text c="dimmed" size="sm" lh={1.2} align="center">
            {description}
          </Text>
        </Stack>
      )}
    </Card>
  );
};

export default CheckboxCard;
