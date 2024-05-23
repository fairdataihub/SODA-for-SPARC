import { Select } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { setDropdownState } from "../../../stores/slices/dropDownSlice";

const DropdownSelect = ({ id }) => {
  console.log("ID: ", id);
  const { label, selectedValue, placeholder, options } = useGlobalStore(
    (state) => state.dropDownState[id]
  );

  const onChange = (value) => {
    setDropdownState(id, value);
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
