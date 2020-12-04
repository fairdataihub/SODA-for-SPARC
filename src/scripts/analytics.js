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

const usr = ua('UA-171625608-1', userId);

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