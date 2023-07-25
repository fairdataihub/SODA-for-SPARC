const electron = require("electron");
const uuid = require("uuid").v4;
const { JSONStorage } = require("node-localstorage");
const fs = require("fs");
const axios = require("axios");

const { app } = electron;
const nodeStorage = new JSONStorage(app.getPath("userData"));
const configFolderPath = require("path").join(app.getPath("home"), ".soda-config"); // more config files will be placed here
let dnt = false;

const kombuchaURL = "https://kombucha.fairdataihub.org/api/";
const localKombuchaURL = "http://localhost:3000/api/";

// Create an axios instance for the kombucha server
const kombuchaServer = axios.create({
  baseURL: kombuchaURL,
  timeout: 0,
});

// Retrieve the userid value, and if it's not there, assign it a new uuid.
let userId;
try {
  userId = nodeStorage.getItem("userId");
} catch (e) {
  userId = null;
}
if (userId === null) {
  userId = uuid();
}

// (re)save the userid, so it persists for the next app session.
nodeStorage.setItem("userId", userId);
console.log(`User ID: ${userId}`);

let appStatus = "packaged";
//By default the app id is set for a packaged app
let appId = "f85e3098-d7f6-4a89-988a-eac945fdc320";
const appVersion = app.getVersion();

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
  appStatus = "beta";
  appId = "dd958d89-9625-4959-96da-6524d7a82254";
}

// If in the dev environment, send tracking events to the dev branch
if (process.env.NODE_ENV === "development") {
  console.log(process.env.NODE_ENV);
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
  const token = nodeStorage.getItem("kombuchaToken");
  let userIdChanged = false;

  if (token === null) {
    console.log("Generating new user id");
    userIdChanged = true;
  }

  if (userIdChanged) {
    try {
      // store and then return the token
      const res = await kombuchaServer.post("meta/users", {});
      nodeStorage.setItem("kombuchaToken", res.data.token);
      nodeStorage.setItem("userId", res.data.userId);
      return res.data.token;
    } catch (e) {
      console.log(e);
    }
  }

  // return the current token
  return token;
};

// Send the event data to Kombucha Analytics
const sendKombuchaAnalyticsEvent = async (eventData, userToken) => {
  kombuchaServer
    .post("harvest/events", eventData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
    })
    .catch(async (error) => {
      // Handle the error
      console.error("Error status: ", error.response.status);
      console.error("Error status text: ", error.response.statusText);
      if (error.response.status === 401) {
        console.log("Token expired");
        // Token is invalid now so generate a new one with the same userId
        const userId = nodeStorage.getItem("userId");
        const res = await kombuchaServer.post("meta/users", { uid: userId });
        console.log("res", res);

        // Save the new token
        nodeStorage.setItem("kombuchaToken", res.data.token);
        // Retry sending the event data with the updated token
        sendKombuchaAnalyticsEvent(eventData, res.data.token);
      }
    });
};

// Tracking function for Kombucha Analytics
const trackKombuchaEvent = (category, action, label, status, eventData) => {
  if (!dnt) {
    userIdGeneratorForKombucha().then((token) => {
      const kombuchaTrackingEventData = {
        aid: appId,
        category: category,
        action: action,
        status: status,
        label: label,
        data: eventData,
      };
      console.log("sending data to kombucha");
      sendKombuchaAnalyticsEvent(kombuchaTrackingEventData, token);
    });
  }
};

// call this from anywhere in the app
// Tracking function for Google Analytics
const trackEvent = (category, action, label, value, datasetID) => {
  if (!dnt) {
    //20% chance of generating new uuid for userId
    const googleTrackingEventData = {
      ec: category,
      ea: action,
      el: label,
      ev: value,
    };

  }
};

module.exports = { trackEvent, trackKombuchaEvent };
