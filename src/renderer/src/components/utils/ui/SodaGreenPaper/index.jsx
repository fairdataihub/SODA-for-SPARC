import { Paper } from "@mantine/core";

const SodaGreenPaper = ({ children, mt, ml }) => {
  return (
    <Paper
      p="xs"
      mt={mt || "0px"}
      ml={ml || "0px"}
      shadow="sm"
      withBorder
      style={{
        backgroundColor: "var(--mantine-color-primary-1)",
        border: "1px solid var(--mantine-color-primary-1)",
      }}
    >
      {children}
    </Paper>
  );
};

export default SodaGreenPaper;
