/*
Purpose: Creates a session ID that is used for tracking which dataset upload session a Google Analytics call with the Action 'Organize Dataset - Step 7 - *' belongs to. 
         This is made necessary by the Pennsieve Agent's freezing during a dataset upload; which prevents us from 
         being able to log the amount of files and their size because the user closes SODA in response. More than that we could never activate an analytics call without knowing when 
         the Agent has frozen. This is something that the Pennsieve team has a milestone to fix however, so we will not want to work with this. 
*/
const { v4: uuid } = require("uuid");

const datasetUploadSession = {
  id: undefined,
  startSession: function () {
    this.id = uuid();
  },
};

module.exports = { datasetUploadSession };
