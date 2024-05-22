import { Text } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

const InternetConnectionStatus = () => {
  const internetConnectionStatus = useGlobalStore((state) => state.internetConnectionStatus);

  const handleCheckInternetConnection = async () => {
    await window.checkInternetConnection();
  };

  return (
    <Text onClick={handleCheckInternetConnection}>
      {internetConnectionStatus ? "connected" : "not connected"}
    </Text>
  );
};

export default InternetConnectionStatus;
