import { Button, Anchor, Text } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";

const ExternalLink = ({ href, buttonText, buttonType, buttonSize }) => {
  if (buttonType === "button") {
    return (
      <Button
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        size={buttonSize || "lg"}
        radius="md"
        variant="light"
        rightSection={<IconExternalLink size={20} />}
      >
        {buttonText}
      </Button>
    );
  }
  if (buttonType === "anchor") {
    return (
      <Anchor
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        size="md"
        ml={6}
        style={{ whiteSpace: "nowrap", color: "#0070f3" }}
      >
        {buttonText}
        <IconExternalLink
          size={18}
          style={{ marginLeft: "3px", marginRight: "3px", marginBottom: "-3px" }}
        />
      </Anchor>
    );
  }
};

export default ExternalLink;
