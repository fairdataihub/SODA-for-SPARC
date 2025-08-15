import { app } from "electron";
import { v4 as uuid } from "uuid";
import { JSONStorage } from "node-localstorage";
import fs from "fs";
import path from "path";
import axios from "axios";

const nodeStorage = new JSONStorage(app.getPath("userData"));
const configFolderPath = path.join(app.getPath("home"), ".soda-config"); // more config files will be placed here
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

let appStatus = "packaged";
//By default the app id is set for a packaged app
let appId = "f85e3098-d7f6-4a89-988a-eac945fdc320";
const appVersion = app.getVersion();

// Add a .soda-config folder in your home folder
if (!fs.existsSync(configFolderPath)) {
  fs.mkdirSync(configFolderPath);
  dnt = false;
} else {
  let dntFilePath = path.join(configFolderPath, "dnt.soda");
  if (fs.existsSync(dntFilePath)) {
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
  appStatus = "dev";
  appId = "6a03a43e-63a9-4ce8-a4fa-63e27a70dc43";
  dnt = false;
}

if (dnt) {
} else {
}

// Generate new userid on a chance basis
const userIdGeneratorForKombucha = async () => {
  const token = nodeStorage.getItem("kombuchaToken");
  const kombuchaUserCreated = nodeStorage.getItem("kombuchaUserCreated");
  let userIdChanged = false;

  if (token === null || kombuchaUserCreated === null) {
    // if (token === null) {
    // Set the userIdChanged flag to true so that we can generate a new userId
    userIdChanged = true;
  }

  if (userIdChanged) {
    try {
      // store and then return the token
      const res = await kombuchaServer.post("meta/users", {});
      nodeStorage.setItem("kombuchaToken", res.data.token);
      nodeStorage.setItem("userId", res.data.uid);
      nodeStorage.setItem("kombuchaUserCreated", true);
      return res.data.token;
    } catch (e) {}
  }

  // return the current token
  return token;
};

// Send the event data to Kombucha Analytics
const sendKombuchaAnalyticsEvent = async (eventData, userToken) => {
  try {
    kombuchaServer.post("harvest/events", eventData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
    });
  } catch (error) {
    if (error.response.status === 401) {
      try {
        // Token is invalid now so generate a new one with the same userId
        const userId = nodeStorage.getItem("userId");
        const res = await kombuchaServer.post("meta/users", { uid: userId });

        // Save the new token
        nodeStorage.setItem("kombuchaToken", res.data.token);
        // Retry sending the event data with the updated token
        sendKombuchaAnalyticsEvent(eventData, res.data.token);
      } catch (e) {}
    }
  }
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

export { trackEvent, trackKombuchaEvent };
