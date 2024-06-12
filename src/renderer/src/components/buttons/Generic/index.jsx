import { Button } from "@mantine/core";

const GenericButton = ({ id, variant, size, color, text }) => {
  return (
    <Button id={id} variant={variant} size={size} color={color}>
      {text}
    </Button>
  );
};

export default GenericButton;
