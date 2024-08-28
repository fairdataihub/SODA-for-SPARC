import { AccountField } from "./AccountField";
// import DatasetField from "./DatasetField";
import {WorkspaceField} from "./WorkspaceField";
// import GenericField from "./GenericField";

export const fieldFactory = (field) => {
  if (field === "account") {
    return AccountField;
    // } else if (field === "dataset") {
    //     return DatasetField;
  } else if (field === "workspace") {
    return WorkspaceField;
  } else {
    // generic field
    //return GenericField;
  }
}
