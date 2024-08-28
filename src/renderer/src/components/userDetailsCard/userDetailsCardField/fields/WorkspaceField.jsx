import React, { useEffect } from "react";
import useGlobalStore from "../../../../stores/globalStore";
import { updateDefaultWorkspace } from "../../../../stores/slices/defaultWorkspaceSlice";

export const WorkspaceField = ({ tabName }) => {
  let defaultWorkspace = useGlobalStore((state) => state.defaultWorkspace) || "None";

  // useEffect(() => {
  const unsubscribe = useGlobalStore.subscribe(
    (state) => state.defaultWorkspace,
    (newdefaultWorkspace) => {
      defaultWorkspace = newdefaultWorkspace;
    }
  );

  // Cleanup subscription on unmount
  // return () => unsubscribe();
  // }, []);

  const changeWorkspace = () => {
    updateDefaultWorkspace("New Workspace");
  };

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
            Current workspace:
          </h5>
          <h5
            className={"card-right"}
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
            {defaultWorkspace}
          </h5>
        </div>
      </div>
    </div>
  );
};

/*

    field = `
        <div class="card-container ${tabName}">
          <div style="width: 100%; display: flex">
            <h5 class="card-left" style="padding-right: 5px">Current workspace:</h5>
            <div class="change-current-account ds-dd organization" style="margin-left: 12px">
              <h5 class="card-right bf-organization-span" style="width: fit-content">None</h5>

              <svg
                class="svg-change-current-account organization bi bi-pencil-fill"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="#000"
                viewBox="0 0 16 16"
              >
                <path
                  d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"
                />
              </svg>
            </div>
          </div>
          <div class="ui active green inline loader small organization-loader" style="display: none"></div>
        </div>
    `;


*/