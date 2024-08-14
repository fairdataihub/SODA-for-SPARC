import { fieldFactory } from "./fields/userDetailsCardFieldFactory";

const UserDetailsCardField = ({ index, tabName, field }) => {
  console.log("The field is: ", field);
  const Field = fieldFactory(field);
  console.log(Field);
  let fieldComponent = Field(tabName);
  return fieldComponent;
};

export default UserDetailsCardField;
