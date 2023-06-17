const axios = require("axios");

const eventData = {
  name: "Example App", // Replace with the actual name or value you want to send
};

axios
  .post("http://localhost:3000/api/events", eventData)
  .then((response) => {
    // Handle the response
    console.log(response.data);
  })
  .catch((error) => {
    // Handle the error
    console.error(error);
  });
