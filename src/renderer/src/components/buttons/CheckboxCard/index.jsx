import useGlobalStore from "../../../stores/globalStore";
import { Checkbox, Text, Stack, Badge, Card } from "@mantine/core";
import pennsieveLogo from "../../../assets/img/pennsieveLogo.png";
import {
  setCheckboxCardChecked,
  setCheckboxCardUnchecked,
} from "../../../stores/slices/checkboxCardSlice";
import { IconDeviceDesktop, IconBrowserPlus, IconFolderSymlink } from "@tabler/icons-react";

const dataMap = {
  "generate-dataset-locally": {
    title: "Generate dataset locally",
    description: "Create a local copy of the dataset on your computer",
    Icon: IconDeviceDesktop,
  },
  "generate-dataset-on-pennsieve": {
    title: "Generate dataset on Pennsieve",
    description: "Pennsieve is the official data management platform for the SPARC program.",
    image: pennsieveLogo,
  },
  "generate-on-existing-pennsieve-dataset": {
    title: "Upload to an existing empty dataset on Pennsieve",
    description:
      "Select this option if you have an existing dataset on Pennsieve you would like to use.",
    Icon: IconFolderSymlink,
    mutuallyExclusiveWithCards: ["generate-on-new-pennsieve-dataset"],
  },
  "generate-on-new-pennsieve-dataset": {
    title: "Create a new dataset on Pennsieve",
    description:
      "Select this option if you would like SODA to create a new dataset for you on Pennsieve.",
    Icon: IconBrowserPlus,
    mutuallyExclusiveWithCards: ["generate-on-existing-pennsieve-dataset"],
  },
};

const CheckboxCard = ({ id }) => {
  const data = dataMap[id];
  if (!data) return <div>Invalid id: {id}</div>;

  const { title, description, Icon, image, mutuallyExclusiveWithCards = [], comingSoon } = data;

  const checked = useGlobalStore((state) => !!state.checkboxes[id]);
  const isDisabled = !!comingSoon;

  const handleClick = () => {
    if (isDisabled) return;
    if (checked) {
      setCheckboxCardUnchecked(id);
    } else {
      mutuallyExclusiveWithCards.forEach((cardId) => setCheckboxCardUnchecked(cardId));
      setCheckboxCardChecked(id);
    }
  };

  return (
    <Card
      onClick={handleClick}
      shadow={checked ? "sm" : "xs"}
      radius="md"
      padding="lg"
      withBorder
      style={{
        width: 270,
        minHeight: 180,
        cursor: isDisabled ? "not-allowed" : "pointer",
        borderColor: checked ? "var(--mantine-color-blue-6)" : "var(--mantine-color-gray-3)",
        backgroundColor: isDisabled
          ? "var(--mantine-color-gray-0)"
          : checked
            ? "var(--mantine-color-blue-0)"
            : "#fff",
        opacity: isDisabled ? 0.8 : 1,
        transition: "border 0.2s, background 0.2s",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {comingSoon && (
        <Badge
          color="blue"
          variant="filled"
          size="sm"
          style={{ position: "absolute", top: 8, right: 8, zIndex: 3 }}
        >
          Coming Soon
        </Badge>
      )}

      <Checkbox
        checked={checked}
        disabled={isDisabled}
        onChange={(e) => {
          e.stopPropagation();
          if (isDisabled) return;
          if (checked) {
            setCheckboxCardUnchecked(id);
          } else {
            mutuallyExclusiveWithCards.forEach((cardId) => setCheckboxCardUnchecked(cardId));
            setCheckboxCardChecked(id);
          }
        }}
        tabIndex={-1}
        style={{ position: "absolute", top: 16, left: 16, zIndex: 2 }}
      />

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
          <Icon
            size={48}
            style={{
              marginBottom: 16,
              color: isDisabled
                ? "var(--mantine-color-gray-5)"
                : checked
                  ? "var(--mantine-color-blue-6)"
                  : "var(--mantine-color-gray-6)",
            }}
          />
        )
      )}

      <Stack align="center" gap={4} style={{ width: "100%" }}>
        <Text
          fw={600}
          size="md"
          lh={1}
          align="center"
          mb="sm"
          c={isDisabled ? "dimmed" : undefined}
        >
          {title}
        </Text>
        <Text c="dimmed" size="sm" lh={1.3} align="center">
          {description}
        </Text>
      </Stack>
    </Card>
  );
};

export default CheckboxCard;
