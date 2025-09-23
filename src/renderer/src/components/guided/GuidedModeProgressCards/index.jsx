import React from "react";
import useGlobalStore from "../../../stores/globalStore";
import { Paper, Group, Text, Divider, Box } from "@mantine/core";

const GuidedModeProgressCards = () => {
  const guidedModeProgressCardsLoading = useGlobalStore(
    (state) => state.guidedModeProgressCardsLoading
  );
  const guidedModeProgressCardsDataArray = useGlobalStore(
    (state) => state.guidedModeProgressCardsDataArray
  );

  if (guidedModeProgressCardsLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <Paper padding="md" shadow="sm" radius="md" p="sm" flex={1} w="100%" withBorder>
      {JSON.stringify(guidedModeProgressCardsDataArray, null, 2)}
    </Paper>
  );
};

export default GuidedModeProgressCards;
