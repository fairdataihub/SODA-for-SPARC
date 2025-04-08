import { Paper } from "@mantine/core";

const SodaPaper = ({ children }) => {
  return (
    <Paper shadow="sm" radius="md" p="md" withBorder mb="md">
      {children}
    </Paper>
  );
};

export default SodaPaper;
