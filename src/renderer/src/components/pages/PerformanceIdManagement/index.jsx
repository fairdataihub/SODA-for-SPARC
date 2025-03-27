import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { IconPlus, IconTrash, IconClipboard, IconDeviceFloppy, IconX } from "@tabler/icons-react";
import {
  TextInput,
  Text,
  Stack,
  Group,
  Button,
  Box,
  ActionIcon,
  Paper,
  Grid,
  Title,
  ScrollArea,
  Divider,
  Flex,
} from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { DateTimePicker } from "@mantine/dates";

import { setPerformanceFormVisible } from "../../../stores/slices/performancesSlice";

const PerformanceIdManagement = () => {
  const IsPerformanceFormVisible = useGlobalStore((state) => state.IsPerformanceFormVisible);
  return (
    <GuidedModePage pageHeader="Description of Performances">
      <GuidedModeSection>
        <Text mb="md">
          Provide information for each performance of experimental protocol in the interface below.
        </Text>
      </GuidedModeSection>

      <GuidedModeSection>
        <Grid gutter="lg">
          {/* Left Column - Performance List */}
          <Grid.Col span={4}>
            <Paper
              shadow="sm"
              radius="md"
              p="md"
              withBorder
              style={{ position: "sticky", top: "20px" }}
            >
              <Stack gap="xs">
                <Box
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: "#f0f9ff",
                    cursor: "pointer",
                  }}
                  p="sm"
                  onClick={() => {
                    setPerformanceFormVisible(true);
                  }}
                >
                  <Flex align="center" gap="xs">
                    <IconPlus size={15} color="#1c7ed6" />
                    <Text fw={500} c="#1c7ed6">
                      Add Performance
                    </Text>
                  </Flex>
                </Box>
                <Box
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: "#f9f9f9",
                  }}
                  p="md"
                >
                  <Text c="dimmed" ta="center">
                    No performances to display
                  </Text>
                </Box>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Right Column - Form or Details View */}
          <Grid.Col span={8}>
            {IsPerformanceFormVisible ? <Text>Form</Text> : <Text>No form</Text>}
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default PerformanceIdManagement;
