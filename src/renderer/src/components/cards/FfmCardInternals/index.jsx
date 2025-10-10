import { Card, Center, Text, Tooltip, Stack } from "@mantine/core";
import classes from "../cards.module.css";
import { IconCirclePlus, IconFolderDown, IconFileDownload } from "@tabler/icons-react";
import { useHover } from "@mantine/hooks";

const cardData = {
  "dataset-upload-existing-dataset": {
    Icon: IconFolderDown,
    text: "Existing dataset",
  },
  "dataset-upload-new-dataset": {
    Icon: IconFileDownload,
    text: "New dataset",
  },
  "start-new-card": {
    Icon: IconCirclePlus,
    text: "Prepare and share a new dataset",
  },
  "import-existing-card": {
    Icon: IconCirclePlus,
    text: "Import and manage an existing dataset",
  },
};
const FfmCardInternals = ({ id }) => {
  console.log("id in ffm card internals:", id);
  if (!cardData[id]) {
    console.error(`No card data found for id: ${id}`);
    return <div>Invalid FFM Card Internals {id}</div>; // or some fallback UI
  }
  const { Icon, text, tooltip } = cardData[id];
  // For demo, checked is always false. Replace with real checked logic if needed.
  const checked = false;

  /*
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
        </Center>*/

  return (
    <>
      <Center mb="sm">{Icon && <Icon size={50} className="ffm-card-icon" />}</Center>
      <Center mb="sm">
        <Text size="md" lh={1.3} fw={450} h={50}>
          {text}
        </Text>
      </Center>
    </>
  );
};

export default FfmCardInternals;
