import React, { useEffect } from "react";
import useGlobalStore from "../../../../stores/globalStore";
import { updateDefaultBfAccount } from "../../../../stores/slices/defaultBfAccountSlice";

export const AccountField = ({ tabName }) => {
  let defaultBfAccount = useGlobalStore((state) => state.defaultBfAccount) || "None";

  // useEffect(() => {
  const unsubscribe = useGlobalStore.subscribe(
    (state) => state.defaultBfAccount,
    (newDefaultBfAccount) => {
      console.log("New default bf account: ", newDefaultBfAccount);
      defaultBfAccount = newDefaultBfAccount;
    }
  );

  // Cleanup subscription on unmount
  // return () => unsubscribe();
  // }, []);

  const changeAccountName = () => {
    console.log("Here");
    updateDefaultBfAccount("New Account");
  };

  return (
    <div className={`card-container ${tabName}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div
          className={"change-current-account md-change-current-account"}
          style={{ marginLeft: "6px", display: "flex", alignItems: "center", padding: "5px 0px" }}
        >
          <h5
            style={{
              color: "#808080",
              fontSize: "15px",
              minWidth: "135px",
              textAlign: "left",
              paddingRight: "5px",
              marginBottom: "0px"
            }}
          >
            Current account:
          </h5>
          <h5

            style={{
              color: "#000",
              fontWeight: 600,
              fontSize: "15px",
              display: "flex",
              justifyContent: "space-between",
              wordBreak: "break-word",
              textAlign: "left",
              marginTop: "0px",
              marginLeft: "60px"
            }}
          >
            {defaultBfAccount}
          </h5>
        </div>
      </div>
    </div>
  );
};
