import { Card, Text, Progress, Group, Center, Flex } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

const ProcessStatusTable = ({ tableId, tableTitle, progressText }) => {
  const { currentTask, taskProgress } =
    useGlobalStore((state) => state.progressElementData[tableId]) || {};

  const taskProgressPercentage = Math.round(eval(taskProgress) * 100);

  return (
    <Card withBorder radius="md" padding="lg" style={{ width: "100%" }}>
      <Center>
        <Text size="lg" fw={700}>
          {tableTitle}
        </Text>
      </Center>

      <Flex align="center" gap="sm" mt="md">
        <Progress
          value={taskProgressPercentage}
          size="lg"
          radius="xl"
          color={taskProgressPercentage === 0 ? "gray" : "var(--color-light-green)"}
          animated={taskProgressPercentage !== 100}
          style={{ flex: 1 }}
        />
        <Text size="lg" fw={500} w="40px">
          {taskProgressPercentage}%
        </Text>
      </Flex>

      <Group>
        <Text size="lg" fw={500}>
          {taskProgress} {progressText}
        </Text>
      </Group>

      <Text size="md" fw={300}>
        {currentTask}
      </Text>
    </Card>
  );
};

export default ProcessStatusTable;
