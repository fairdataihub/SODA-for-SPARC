import useGlobalStore from "../../../stores/globalStore";
import { Checkbox, Text, Stack, Badge, Card, Center, ActionIcon, Button } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import classes from "../cards.module.css";
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
    comingSoon,
    checked,
    simpleButtonType,
    additionalClasses,
  } = cardData[id];
  const isDisabled = !!comingSoon;
  const { hovered, ref } = useHover();

  const handleClick = () => {
    if (isDisabled) return;

    if (!checked) {
      setCheckboxCardChecked(id);
    }
  };

  const isCompact = !description;
  if (simpleButtonType) {
    // Use green for Yes, red for No
    const color = simpleButtonType === "Positive" ? "green" : "red";
    return (
      <Button
        id={id}
        variant={checked ? "filled" : "outline"}
        color={color}
        onClick={handleClick}
        disabled={isDisabled}
        mx="xs"
        my="sm"
        size="md"
        className={additionalClasses}
      >
        {title}
      </Button>
    );
  }
  if (checked) {
    console.log("classes.cardSelected:", classes.cardSelected);
    console.log("checked:", checked);
  }
  return (
    <Card
      id={id}
      ref={ref}
      onClick={handleClick}
      shadow={checked ? "sm" : "xs"}
      radius="md"
      padding="lg"
      m="sm"
      withBorder
      className={`${classes.card} ${checked ? classes.cardSelected : ""} ${additionalClasses}`}
      style={{
        width: isCompact ? 180 : 270,
        height: isCompact ? 150 : "auto",
        minHeight: isCompact ? 150 : 180,
        opacity: isDisabled ? 0.8 : 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
    >
      {comingSoon && (
        <Badge
          color="blue"
          variant="filled"
          size="sm"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 3,
          }}
        >
          Coming Soon
        </Badge>
      )}
      {!isCompact && (
        <Checkbox
          checked={checked}
          disabled={isDisabled}
          onChange={(e) => {
            e.stopPropagation();
            if (isDisabled) return;

            if (checked) {
              setCheckboxCardUnchecked(id);
            } else {
              // First uncheck any mutually exclusive cards
              mutuallyExclusiveWithCards.forEach((cardId) => {
                setCheckboxCardUnchecked(cardId);
              });
              // Then check this card
              setCheckboxCardChecked(id);
            }
          }}
          tabIndex={-1}
          styles={{ input: { cursor: isDisabled ? "not-allowed" : "pointer" } }}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            marginBottom: 0,
            zIndex: 2,
          }}
        />
      )}
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
        </Center>
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
