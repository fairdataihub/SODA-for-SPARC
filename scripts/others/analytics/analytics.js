const electron = require("electron");
const ua = require("universal-analytics");
const uuid = require("uuid").v4;
const { JSONStorage } = require("node-localstorage");
const fs = require("fs");
const axios = require("axios");
const { node } = require("prop-types");
const { event } = require("jquery");

const app = electron.app;
const nodeStorage = new JSONStorage(app.getPath("userData"));
const configFolderPath = require("path").join(app.getPath("home"), ".soda-config"); // more config files will be placed here
let dnt = false;
const kombuchaURL = "https://analytics-nine-ashen.vercel.app/api/v1";

// Retrieve the userid value, and if it's not there, assign it a new uuid.
let userId = nodeStorage.getItem("userId")
if (userId === null) {
  userId = uuid();
}
// uuid();
// (re)save the userid, so it persists for the next app session.
nodeStorage.setItem("userId", userId);
console.log(`User ID: ${userId}`)

let usr = ua("UA-171625608-1", userId);
let appStatus = "packaged";
const appVersion = app.getVersion();

const mongoServer = axios.create({
  baseURL: kombuchaURL,
  timeout: 0,
});

// Add a .soda-config folder in your home folder
if (!fs.existsSync(configFolderPath)) {
  fs.mkdirSync(configFolderPath);
  dnt = false;
} else {
  let dntFilePath = require("path").join(configFolderPath, "dnt.soda");
  if (fs.existsSync(dntFilePath)) {
    console.log("dnt file exists");
    dnt = true;
  } else {
    dnt = false;
  }
}

// If app is in beta, send tracking events to the beta analytics branch
if (appVersion.includes("beta")) {
  usr = ua("UA-171625608-3", userId);
  appStatus = "beta";
}

// If in the dev environment, send tracking events to the dev branch
if (process.env.NODE_ENV === "development") {
  console.log(process.env.NODE_ENV);
  usr = ua("UA-171625608-2", userId);
  appStatus = "dev";
  dnt = false;
}

if (dnt) {
  console.log("DNT enabled");
  console.log(`App Status: ${appStatus}`);
} else {
  console.log("DNT disabled");
  console.log(`App Status: ${appStatus}`);
}

// Tracking function for Google Analytics
const sendGoogleAnalyticsEvent = (eventData) => {
  usr.event(eventData).send();
};

// Tracking function for Kombucha Analytics
const sendKombuchaAnalyticsEvent = (eventData) => {
  const userToken = nodeStorage.getItem("token");

  mongoServer
    .post("/events", eventData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
    })
    .then((response) => {
      // Handle the response
      console.log(response.data);
    })
    .catch((error) => {
      // Handle the error
      console.error(error);
    });
}

// call this from anywhere in the app
const trackEvent = (category, action, label, value) => {
  if (!dnt) {
    const googleTrackingEventData = {
      ec: category,
      ea: action,
      el: label,
      ev: value,
    };

    const kombuchaTrackingEventData = {
      uid: userId,
      aid: "SODA",
      status: category,
      category: category,
      action: action,
      label: label,
      data: value,
    };

    sendGoogleAnalyticsEvent(googleTrackingEventData);
    sendKombuchaAnalyticsEvent(kombuchaTrackingEventData);
  }
};

module.exports = { trackEvent };
