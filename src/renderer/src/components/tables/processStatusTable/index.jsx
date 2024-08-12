import { Card, Text, Loader, Progress, Group, Center } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import useGlobalStore from "../../../stores/globalStore";

const ProcessStatusTable = ({ tableId, tableTitle }) => {
  const { currentTask, taskProgress } =
    useGlobalStore((state) => state.progressElementData[tableId]) || {};

  console.log("currentTask", currentTask);
  console.log("taskProgress", taskProgress);

  const isNumberBetween0and100 = (num) => {
    return num > 0 && num < 100;
  };

  console.log("isNumberBetween0and100", isNumberBetween0and100(taskProgress));
  return (
    <Card
      withBorder
      radius="md"
      padding="lg"
      bg="var(--mantine-color-body)"
      style={{ width: "100%" }}
    >
      <Center mt="0px">
        <Text size="lg" fw={700}>
          {tableTitle}
        </Text>
      </Center>
      <Group>
        <Text size="lg" fw={500}>
          Task Progress:
        </Text>
      </Group>
      <Progress
        value={taskProgress}
        mt="md"
        size="lg"
        radius="xl"
        color={taskProgress === 0 ? "gray" : "blue"}
        animated={isNumberBetween0and100(taskProgress)}
      />
      <Text size="lg" fw={500}>
        {taskProgress}% complete
      </Text>
      <Text size="md" fw={300}>
        {currentTask}
      </Text>
    </Card>
  );
};

export default ProcessStatusTable;
