import { Paper } from "@mantine/core";

const SodaGreenPaper = ({ children }) => {
  return (
    <Paper
      p="sm"
      shadow="sm"
      withBorder
      style={{
        backgroundColor: "#e7f1f0",
        border: "1px solid var(--color-light-green)",
      }}
    >
      {children}
    </Paper>
  );
};

export default SodaGreenPaper;
