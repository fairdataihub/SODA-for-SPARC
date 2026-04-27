import { Paper, Text, Divider, ScrollArea } from "@mantine/core";

const EntityListContainer = ({
  title, // The title displayed at the top
  children, // The content inside the scrollable box
}) => {
  return (
    <Paper padding="md" shadow="sm" radius="md" p="sm" flex={1} w="100%" withBorder>
      {title && (
        <>
          <Text size="lg" fw={500}>
            {title}
          </Text>
          <Divider my="xs" />
        </>
      )}
      <ScrollArea.Autosize mah={600} type="auto" offsetScrollbars>
        {children}
      </ScrollArea.Autosize>
    </Paper>
  );
};

export default EntityListContainer;
