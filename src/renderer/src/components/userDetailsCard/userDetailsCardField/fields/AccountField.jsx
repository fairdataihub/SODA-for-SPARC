import React, { useEffect } from "react";
import useGlobalStore from "../../../../stores/globalStore";
import { updateDefaultBfAccount } from "../../../../stores/slices/defaultBfAccountSlice";

export const AccountField = ({ tabName }) => {
  let defaultBfAccount = useGlobalStore((state) => state.defaultBfAccount) || "None"
  

  useEffect(() => {
    const unsubscribe = useGlobalStore.subscribe(
      (state) => state.defaultBfAccount,
      (newDefaultBfAccount) => {
        defaultBfAccount = newDefaultBfAccount;
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);


  const changeAccountName = () => {
    console.log("Here")
    updateDefaultBfAccount("New Account");
  }

    return (
      <div className={`card-container ${tabName}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            className={"change-current-account md-change-current-account"}
            style={{ marginLeft: "6px", display: "flex", alignItems: "center" }}
          >
            <h5
              style={{
                color: "#808080",
                fontSize: "15px",
                minWidth: "135px",
                textAlign: "left",
                paddingRight: "5px",
              }}
            >
              Current account:
            </h5>
            <h5
              className={"bf-account-span"}
              style={{
                color: "#000",
                fontWeight: 600,
                marginLeft: "8px",
                fontSize: "15px",
                display: "flex",
                justifyContent: "space-between",
                wordBreak: "break-word",
                textAlign: "left",
              }}
            >
              {defaultBfAccount}
            </h5>
            <button onClick={changeAccountName}>Change Account</button>
          </div>
        </div>
      </div>
    );
};
