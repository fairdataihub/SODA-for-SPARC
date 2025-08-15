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
        backgroundColor: "var(--color-transparent-soda-green)",
        border: "1px solid var(--color-light-green)",
      }}
    >
      {children}
    </Paper>
  );
};

export default SodaGreenPaper;
