const electron = require("electron");
const ua = require("universal-analytics");
const uuid = require("uuid").v4;
const { JSONStorage } = require("node-localstorage");
const fs = require("fs");
const axios = require("axios");

const { app } = electron;
const nodeStorage = new JSONStorage(app.getPath("userData"));
const configFolderPath = require("path").join(app.getPath("home"), ".soda-config"); // more config files will be placed here
let dnt = false;

const kombuchaURL = "https://analytics-nine-ashen.vercel.app/api/";
const localKombuchaURL = "http://localhost:3000/api/";

// Retrieve the userid value, and if it's not there, assign it a new uuid.
let userId = nodeStorage.getItem("userId");
if (userId === null) {
  userId = uuid();
}

// (re)save the userid, so it persists for the next app session.
nodeStorage.setItem("userId", userId);
console.log(`User ID: ${userId}`);

let usr = ua("UA-171625608-1", userId);
let appStatus = "packaged";
//By default the app id is set for a packaged app
let appId = "f85e3098-d7f6-4a89-988a-eac945fdc320";
const appVersion = app.getVersion();

const kombuchaServer = axios.create({
  baseURL: localKombuchaURL,
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
  appId = "dd958d89-9625-4959-96da-6524d7a82254";
}

// If in the dev environment, send tracking events to the dev branch
if (process.env.NODE_ENV === "development") {
  console.log(process.env.NODE_ENV);
  usr = ua("UA-171625608-2", userId);
  appStatus = "dev";
  appId = "6a03a43e-63a9-4ce8-a4fa-63e27a70dc43";
  dnt = false;
}

if (dnt) {
  console.log("DNT enabled");
  console.log(`App Status: ${appStatus}`);
} else {
  console.log("DNT disabled");
  console.log(`App Status: ${appStatus}`);
}

// Generate new userid on a chance basis
const userIdGeneratorForKombucha = async () => {
  const chance = Math.random();
  // let userId = nodeStorage.getItem("userId");
  let token = nodeStorage.getItem("token");
  let userIdChanged = false;
  let userData = {};

  if (token === null || chance < 0.1) {
    // 10% chance of generating new uuid for userId
    userData = {};
    userIdChanged = true;
  }

  if (userIdChanged) {
    try {
      // return the user id and token
      return await kombuchaServer.post("meta/users", userData);
    } catch (e) {
      console.log(e);
    }
  } else {
    // return the current user id and token
    // sourcery skip: inline-immediately-returned-variable
    let res = {
      data: {
        token: token,
      },
    };
    return res;
  }
};

// Tracking function for Google Analytics
const sendGoogleAnalyticsEvent = (eventData) => {
  usr.event(eventData).send();
};

// Tracking function for Kombucha Analytics
const sendKombuchaAnalyticsEvent = (eventData, userToken) => {
  // console.log("userToken", userToken);
  kombuchaServer
    .post("harvest/events", eventData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
    })
    .catch((error) => {
      // Handle the error
      console.error("Error status: ", error.response.status);
      console.error("Error status text: ", error.response.statusText);
      // console.error(error);
    });
};

// call this from anywhere in the app
const trackEvent = (category, action, label, value, datasetID) => {
  if (!dnt) {
    //20% chance of generating new uuid for userId
    const googleTrackingEventData = {
      ec: category,
      ea: action,
      el: label,
      ev: value,
    };

    sendGoogleAnalyticsEvent(googleTrackingEventData);
    userIdGeneratorForKombucha().then((res) => {
      // console.log("uid", res.data.uid);
      // console.log("token", res.data.token);
      // console.log("value", value)
      let analyticsValue = value;
      let analyticsLabel = label;
      if (analyticsValue === undefined) {
        analyticsValue = "";
      }
      if (analyticsLabel === undefined) {
        analyticsLabel = "";
      }

      console.log(label);
      const kombuchaTrackingEventData = {
        aid: appId,
        category: "analyticsLabel",
        action: action,
        status: category,
        label: analyticsLabel,
        data: {
          value: analyticsValue,
          datasetID: "datasetID",
          datasetName: "test",
        },
      };

      sendKombuchaAnalyticsEvent(kombuchaTrackingEventData, res.data.token);
    });
  }
};

module.exports = { trackEvent };
