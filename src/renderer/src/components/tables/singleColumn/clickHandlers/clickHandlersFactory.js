import {accountsClickHandlers} from "./clickHandlersAccounts/clickHandlerAccounts"


export const getClickHandlerFunctions = (id) => {
    if (id === "account-options-table") {
      return accountsClickHandlers
    } else {
      return () => console.log("No click handler found for this table")
    }
  };