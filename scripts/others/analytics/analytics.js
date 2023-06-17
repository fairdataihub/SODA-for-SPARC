const electron = require("electron");
const ua = require("universal-analytics");
const { v4: uuid } = require("uuid");
const { JSONStorage } = require("node-localstorage");
const fs = require("fs");
const axios = require("axios");

const app = electron.app;
const nodeStorage = new JSONStorage(app.getPath("userData"));
const config_folder_path = require("path").join(app.getPath("home"), ".soda-config"); // more config files will be placed here
let dnt = false;
const url = "http://localhost:3000/api";

const mongoServer = axios.create({
  baseURL: url,
  timeout: 0,
});

// Add a .soda-config folder in your home folder
if (!fs.existsSync(config_folder_path)) {
  fs.mkdirSync(config_folder_path);
  dnt = false;
} else {
  let dnt_file_path = require("path").join(config_folder_path, "dnt.soda");
  if (fs.existsSync(dnt_file_path)) {
    console.log("dnt file exists");
    dnt = true;
  } else {
    dnt = false;
  }
}

// Retrieve the userid value, and if it's not there, assign it a new uuid.
const userId = nodeStorage.getItem("userid") || uuid();

// (re)save the userid, so it persists for the next app session.
nodeStorage.setItem("userid", userId);

let usr = ua("UA-171625608-1", userId);
let app_status = "packaged";

// If app is in beta, send tracking events to the beta analytics branch
let beta_app_version = app.getVersion();
if (beta_app_version.includes("beta")) {
  usr = ua("UA-171625608-3", userId);
  app_status = "beta";
}

// If in the dev environment, send tracking events to the dev branch
if (process.env.NODE_ENV === "development") {
  console.log(process.env.NODE_ENV);
  usr = ua("UA-171625608-2", userId);
  app_status = "dev";
  dnt = false;
}

if (dnt) {
  console.log("DNT enabled");
  console.log(`App Status: ${app_status}`);
} else {
  console.log("DNT disabled");
  console.log(`App Status: ${app_status}`);
}

// Tracking function for Google Analytics
// call this from anywhere in the app
const trackEvent = async (category, action, label, value) => {
  if (!dnt) {
    usr
      .event({
        ec: category,
        ea: action,
        el: label,
        ev: value,
      })
      .send();

    const eventData = {
      ec: category,
      ea: action,
      el: label,
      ev: value,
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
  }
};

module.exports = { trackEvent };
