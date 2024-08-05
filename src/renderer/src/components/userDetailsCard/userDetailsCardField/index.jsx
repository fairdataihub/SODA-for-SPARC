import { fieldFactory } from "./fields/userDetailsCardFieldFactory";

const UserDetailsCardField = ({ index, tabName, field }) => {
  const Field = fieldFactory(field);
  let fieldComponent = Field(index, tabName);
  return fieldComponent;
};

export default UserDetailsCardField;
