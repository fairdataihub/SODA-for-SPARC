import UserDetailsCardField from "./userDetailsCardField";
import React from "react";

const UserDetailsCard = ({ id, tabName, fields }) => {
  console.log(fields);
  return (
    <div
      id={id}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        marginTop: "15px",
        height: "auto",
        boxShadow: "0px 0px 10px #d5d5d5",
        padding: "15px 25px",
        borderRadius: "5px",
      }}
    >
      {fields.map((field, index) => {
        return (
          <UserDetailsCardField
            key={index}
            index={index}
            tabName={tabName}
            field={field}
          ></UserDetailsCardField>
        );
      })}
    </div>
  );
};

export default UserDetailsCard;
