import { Button } from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";

const IconButton = ({ buttonSize }) => {
  return (
    <Button size={buttonSize || "lg"} radius="md" variant="light">
      <IconEdit size={20} />
    </Button>
  );
};

export default IconButton;
