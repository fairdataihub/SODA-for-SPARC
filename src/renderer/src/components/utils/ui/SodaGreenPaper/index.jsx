import { Paper } from "@mantine/core";

const SodaGreenPaper = ({ children }) => {
  return (
    <Paper
      p="sm"
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
