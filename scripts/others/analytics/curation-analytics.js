/*
    Purpose: Logging analytics for our 'main_curation_function' used to generate datasets in Organize Dataset feature is becoming too complicated
             to justify keeping it outside of its own functions. 

*/

const logSelectedUpdateExistingDatasetOptions = (origin) => {
  Array.from(document.querySelectorAll(".generate-preview")).forEach((card) => {
    let header = card.querySelector("h5");
    if (header.textContent.includes("folders")) {
      let action = "";
      let instruction = card.querySelector("p");
      if (instruction.textContent === "Replace") {
        action = kombuchaEnums.Action.REPLACE_ITEM;
      } else if (instruction.textContent === "Merge") {
        action = kombuchaEnums.Action.MERGE_ITEMS;
      } else if (instruction.textContent === "Skip") {
        action = kombuchaEnums.Action.SKIP_ITEMS;
      }

      // log the folder instructions to analytics
      ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.PREPARE_DATASETS,
        action,
        kombuchaEnums.Label.FOLDERS,
        {
          value: 1,
          origin: origin,
        }
      );
    } else if (header.textContent.includes("existing files")) {
      let action = "";
      let instruction = card.querySelector("p");
      if (instruction.textContent === "Replace") {
        action = kombuchaEnums.Action.REPLACE_ITEM;
      } else if (instruction.textContent === "Merge") {
        action = kombuchaEnums.Action.MERGE_ITEMS;
      } else if (instruction.textContent === "Skip") {
        action = kombuchaEnums.Action.SKIP_ITEMS;
      } else if (instruction.textContent === "Duplicate") {
        action = kombuchaEnums.Action.DUPLICATE_ITEMS;
      }

      ipcRenderer.send(
        "track-kombucha",
        "Success",
        kombuchaEnums.Category.PREPARE_DATASETS,
        action,
        kombuchaEnums.Label.FILES,
        {
          value: 1,
          origin: origin,
        }
      );
    }
  });
};

// Function created for Generate Dataset events
/*
    Purpose: Create an event data object to be sent to Kombucha for logging generate dataset events in the Organize Dataset, 
             and Guided Mode generate features.
*/
const createEventData = (value, destination, origin, dataset_name) => {
  if (destination === "Pennsieve") {
    return {
      value: value,
      dataset_id: defaultBfDatasetId,
      dataset_name: dataset_name,
      origin: origin,
      destination: destination,
    };
  }

  return {
    value: value,
    dataset_name: dataset_name,
    origin: origin,
    destination: destination,
  };
};

module.exports = {
  createEventData,
  logSelectedUpdateExistingDatasetOptions,
};
