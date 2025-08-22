import useGlobalStore from "../../../stores/globalStore";
import { Checkbox, Text, UnstyledButton, Stack, Badge } from "@mantine/core";
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

  if (!data) {
    return <div>Invalid id: {id}</div>;
  }

  const { title, description, Icon, image, mutuallyExclusiveWithCards = [], comingSoon } = data;
  const checked = useGlobalStore((state) => !!state.checkboxes[id]);
  const isDisabled = !!comingSoon;

  const handleCardClick = () => {
    if (isDisabled) return; // Don't allow clicking if disabled

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
  };

  return (
    <UnstyledButton
      onClick={handleCardClick}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "270px",
        minHeight: "180px",
        padding: "var(--mantine-spacing-lg)",
        border: checked
          ? "2px solid var(--mantine-color-blue-6)"
          : "2px solid var(--mantine-color-gray-3)",
        background: isDisabled
          ? "var(--mantine-color-gray-0)"
          : checked
            ? "var(--mantine-color-blue-0)"
            : "#fff",
        borderRadius: 12,
        boxSizing: "border-box",
        boxShadow: checked ? "0 2px 8px 0 rgba(34,139,230,0.08)" : "none",
        transition: "border 0.2s, background 0.2s",
        opacity: isDisabled ? 0.8 : 1,
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
              color: isDisabled ? "var(--mantine-color-gray-5)" : checked ? "#228be6" : "#868e96",
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
    </UnstyledButton>
  );
};

export default CheckboxCard;
