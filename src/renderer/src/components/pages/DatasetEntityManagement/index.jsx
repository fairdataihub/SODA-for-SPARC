import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { TextInput, Button, Text, Stack, Group, Box } from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import { addSubject } from "../../../stores/slices/datasetEntitySelectorSlice";
import { IconUser } from "@tabler/icons-react"; // Add this import

const DatasetEntityManagementPage = () => {
  const [subjectID, setSubjectID] = useState("");
  const entityStructureObj = useGlobalStore((state) => state.entityStructureObj);
  console.log("entityStructureObj", entityStructureObj);

  const handleAddSubject = () => {
    if (subjectID.trim()) {
      addSubject(subjectID.trim());
      setSubjectID("");
    }
  };

  return (
    <GuidedModePage pageHeader="Generate IDs to associate data">
      <GuidedModeSection>
        <Text>
          Provide details about the subjects you collected data from to generate unique IDs for data
          association.
        </Text>
      </GuidedModeSection>
      <GuidedModeSection>
        <Stack spacing="md">
          <Group>
            <TextInput
              placeholder="Enter Subject ID"
              value={subjectID}
              onChange={(e) => setSubjectID(e.target.value)}
            />
            <Button onClick={handleAddSubject}>Add Subject</Button>
          </Group>
          <Box>
            <Text weight={500}>Subjects:</Text> {/* Add the IconUser here */}
            {entityStructureObj?.subjects &&
              Object.keys(entityStructureObj.subjects).map((id) => (
                <Text key={id}>
                  <IconUser />
                  {id}
                </Text>
              ))}
          </Box>
        </Stack>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityManagementPage;
