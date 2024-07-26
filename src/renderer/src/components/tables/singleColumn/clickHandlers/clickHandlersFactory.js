import {accountsClickHandlers} from "./clickHandlersAccounts/clickHandlerAccounts"


export const getClickHandlerFunctions = (id) => {
    if (id === "account-options-table") {
      return accountsClickHandlers
    }
  };