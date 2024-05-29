import { Text } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

const InternetConnectionStatus = () => {
  const internetConnectionCheckSuccessful = useGlobalStore(
    (state) => state.internetConnectionCheckSuccessful
  );

  const handleCheckInternetConnection = async () => {
    await window.checkInternetConnection();
  };

  return (
    <Text onClick={handleCheckInternetConnection}>
      {internetConnectionCheckSuccessful ? "connected" : "not connected"}
    </Text>
  );
};

export default InternetConnectionStatus;
