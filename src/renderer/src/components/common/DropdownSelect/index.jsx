import { Select } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

const DropdownSelect = ({ id }) => {
  const label = useGlobalStore((state) => state[id].label);
  const selectedValue = useGlobalStore((state) => state[id].selectedValue);
  const placeholder = useGlobalStore((state) => state[id].placeholder);
  const options = useGlobalStore((state) => state[id].options);

  const onChange = (value) => {
    useGlobalStore.setState((state) => ({
      ...state,
      [id]: {
        ...state[id],
        selectedValue: value,
      },
    }));
  };

  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={options}
      value={selectedValue}
      onChange={onChange}
    />
  );
};

export default DropdownSelect;
