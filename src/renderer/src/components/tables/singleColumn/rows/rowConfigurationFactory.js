import {singleColumnIconAfterTextRow} from "./iconAfterTextRow"
import {defaultRow} from "./defaultRow"

export const getRowConfiguration = (id) => {
    if (id === "account-options-table") {
        return singleColumnIconAfterTextRow
    } else {
        return defaultRow
    }

}