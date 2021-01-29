const electron = require('electron');
const ua = require('universal-analytics');
const { v4: uuid } = require('uuid');
const { JSONStorage } = require('node-localstorage');

const app = electron.app;
console.log(app.getPath('userData'));
const nodeStorage = new JSONStorage(app.getPath('userData'));

// Retrieve the userid value, and if it's not there, assign it a new uuid.
const userId = nodeStorage.getItem('userid') || uuid();
console.log(userId);

// (re)save the userid, so it persists for the next app session.
nodeStorage.setItem('userid', userId);

let usr = ua('UA-171625608-1', userId);
console.log("Packaged App");

let beta_app_version = app.getVersion()
if (beta_app_version.includes("beta"))
{
  usr = ua('UA-171625608-3', userId);
  console.log("Packaged App - Beta");
}

if(process.env.NODE_ENV === 'development')
{
  usr = ua('UA-171625608-2', userId);
  console.log("Development App");
}

function trackEvent(category, action, label, value) {
  usr
    .event({
      ec: category,
      ea: action,
      el: label,
      ev: value,
    })
    .send();
}

module.exports = { trackEvent };