import useGlobalStore from "../../../../stores/globalStore";
import {
  guidedSkipPage,
  guidedUnSkipPage,
} from "../../../guided-mode/pages/navigationUtils/pageSkipping";
import api from "../../../others/api/api";
import { guidedGetCurrentUserWorkSpace } from "../../../guided-mode/workspaces/workspaces";
import { error } from "jquery";
import { isCheckboxCardChecked } from "../../../../stores/slices/checkboxCardSlice";

export const savePagePennsieveDetails = async (pageBeingLeftID) => {
  const errorArray = [];
};
