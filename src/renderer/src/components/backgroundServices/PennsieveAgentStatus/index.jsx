import { Text, Stack, Button, Group } from "@mantine/core";
import ExternalLink from "../../buttons/ExternalLink";
import useGlobalStore from "../../../stores/globalStore";

const PennsieveAgentStatus = () => {
  const pennsieveAgentInstalled = useGlobalStore((state) => state.pennsieveAgentInstalled);
  const pennsieveAgentUpToDate = useGlobalStore((state) => state.pennsieveAgentUpToDate);
  const pennsieveAgentDownloadURL = useGlobalStore((state) => state.pennsieveAgentDownloadURL);

  if (!pennsieveAgentInstalled) {
    return (
      <Stack>
        <Text>Pennsieve Agent not installed</Text>
        <ExternalLink
          href={pennsieveAgentDownloadURL}
          buttonText="Download the Pennsieve Agent"
          buttonType="button"
        />
      </Stack>
    );
  }

  if (!pennsieveAgentUpToDate) {
    return (
      <Stack>
        <Text>Pennsieve Agent out of date</Text>
        <ExternalLink href={pennsieveAgentDownloadURL} buttonText="Download" buttonType="button" />
      </Stack>
    );
  }

  return <Text>Installed</Text>;
};

export default PennsieveAgentStatus;
