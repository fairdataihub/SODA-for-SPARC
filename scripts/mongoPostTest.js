const axios = require("axios");
const uuid = require("uuid").v4;

const uuidNumber = uuid();
console.log(uuidNumber);
const eventData = {
  uid: uuidNumber,
  aid: "SODA-for-SPARC",
  name: "Example App", // Replace with the actual name or value you want to send
};

axios
  .post("http://localhost:3000/api/v1/events", eventData, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer string`,
    },
  })
  .then((response) => {
    // Handle the response
    console.log(response.data);
  })
  .catch((error) => {
    // Handle the error
    console.error(error);
    console.log(uuidNumber);
  });
