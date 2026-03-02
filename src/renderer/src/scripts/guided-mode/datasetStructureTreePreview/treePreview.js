import fileTxt from "/img/txt-file.png";
import filePng from "/img/png-file.png";
import filePdf from "/img/pdf-file.png";
import fileCsv from "/img/csv-file.png";
import fileDoc from "/img/doc-file.png";
import fileXlsx from "/img/excel-file.png";
import fileJpeg from "/img/jpeg-file.png";
import fileOther from "/img/other-file.png";
import "jstree";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

let guidedJstreePreview = document.getElementById("guided-div-dataset-tree-preview");

$(guidedJstreePreview).jstree({
  core: {
    check_callback: true,
    data: {},
  },
  plugins: ["types", "sort"],
  sort: function (a, b) {
    let a1 = this.get_node(a);
    let b1 = this.get_node(b);

    if (a1.icon == b1.icon || (a1.icon.includes("assets") && b1.icon.includes("assets"))) {
      //if the word assets is included in the icon then we can assume it is a file
      //folder icons are under font awesome meanwhile files come from the assets folder
      return a1.text > b1.text ? 1 : -1;
    } else {
      return a1.icon < b1.icon ? 1 : -1;
    }
  },
  types: {
    folder: {
      icon: "fas fa-folder fa-fw",
    },
    "folder open": {
      icon: "fas fa-folder-open fa-fw",
    },
    "folder closed": {
      icon: "fas fa-folder fa-fw",
    },
    "file xlsx": {
      icon: fileXlsx,
    },
    "file xls": {
      icon: fileXlsx,
    },
    "file png": {
      icon: filePng,
    },
    "file PNG": {
      icon: filePng,
    },
    "file pdf": {
      icon: filePdf,
    },
    "file txt": {
      icon: fileTxt,
    },
    "file csv": {
      icon: fileCsv,
    },
    "file CSV": {
      icon: fileCsv,
    },
    "file DOC": {
      icon: fileDoc,
    },
    "file DOCX": {
      icon: fileDoc,
    },
    "file docx": {
      icon: fileDoc,
    },
    "file doc": {
      icon: fileDoc,
    },
    "file jpeg": {
      icon: fileJpeg,
    },
    "file JPEG": {
      icon: fileJpeg,
    },
    "file other": {
      icon: fileOther,
    },
  },
});

$(guidedJstreePreview).on("open_node.jstree", function (event, data) {
  data.instance.set_type(data.node, "folder open");
});
$(guidedJstreePreview).on("close_node.jstree", function (event, data) {
  data.instance.set_type(data.node, "folder closed");
});

export const guidedShowTreePreview = (new_dataset_name, targetElementId) => {
  const folderStructurePreview = document.getElementById(targetElementId);
  $(folderStructurePreview).jstree({
    core: {
      check_callback: true,
      data: {},
    },
    plugins: ["types", "sort"],
    sort: function (a, b) {
      let a1 = this.get_node(a);
      let b1 = this.get_node(b);

      if (a1.icon == b1.icon || (a1.icon.includes("assets") && b1.icon.includes("assets"))) {
        //if the word assets is included in the icon then we can assume it is a file
        //folder icons are under font awesome meanwhile files come from the assets folder
        return a1.text > b1.text ? 1 : -1;
      } else {
        return a1.icon < b1.icon ? 1 : -1;
      }
    },
    types: {
      folder: {
        icon: "fas fa-folder fa-fw",
      },
      "folder open": {
        icon: "fas fa-folder-open fa-fw",
      },
      "folder closed": {
        icon: "fas fa-folder fa-fw",
      },
      "file xlsx": {
        icon: fileXlsx,
      },
      "file xls": {
        icon: fileXlsx,
      },
      "file png": {
        icon: filePng,
      },
      "file PNG": {
        icon: filePng,
      },
      "file pdf": {
        icon: filePdf,
      },
      "file txt": {
        icon: fileTxt,
      },
      "file csv": {
        icon: fileCsv,
      },
      "file CSV": {
        icon: fileCsv,
      },
      "file DOC": {
        icon: fileDoc,
      },
      "file DOCX": {
        icon: fileDoc,
      },
      "file docx": {
        icon: fileDoc,
      },
      "file doc": {
        icon: fileDoc,
      },
      "file jpeg": {
        icon: fileJpeg,
      },
      "file JPEG": {
        icon: fileJpeg,
      },
      "file other": {
        icon: fileOther,
      },
    },
  });
  $(folderStructurePreview).on("open_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder open");
  });
  $(folderStructurePreview).on("close_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder closed");
  });
  const dsJsonObjCopy = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));

  //Add the code_description metadata file to the preview if the code_description path has been declared
  if (window.sodaJSONObj["dataset_metadata"]["code-metadata"]["code_description"]) {
    dsJsonObjCopy["files"]["code_description.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the dataset_description metadata file to the preview if the dataset_description page has been completed
  if (window.sodaJSONObj["completed-tabs"].includes("guided-create-description-metadata-tab")) {
    dsJsonObjCopy["files"]["dataset_description.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the manifest files that have been created to the preview
  for (const manifestFileKey of Object.keys(window.sodaJSONObj["guided-manifest-file-data"])) {
    const hlfStillExistsForManifestFile = Object.keys(dsJsonObjCopy["folders"]).includes(
      manifestFileKey
    );
    if (hlfStillExistsForManifestFile) {
      dsJsonObjCopy["folders"][manifestFileKey]["files"]["manifest.xlsx"] = {
        action: ["new"],
        path: "",
        type: "local",
      };
    }
  }

  //Add the Readme file to the preview if it exists in JSON
  if (window.sodaJSONObj["dataset_metadata"]["README"]) {
    dsJsonObjCopy["files"]["README.txt"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the Samples metadata file to the preview if at least one sample has been added
  if (window.samplesTableData.length > 0) {
    dsJsonObjCopy["files"]["samples.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the Subjects metadata file to the preview if at least one subject has been added
  if (window.subjectsTableData.length > 0) {
    dsJsonObjCopy["files"]["subjects.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the submission metadata file to the preview if the submission metadata page has been completed
  if (window.sodaJSONObj["completed-tabs"].includes("guided-submission-metadata-tab")) {
    dsJsonObjCopy["files"]["submission.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  const guidedJsTreePreviewData = window.create_child_node(
    dsJsonObjCopy,
    new_dataset_name,
    "folder",
    "",
    new_dataset_name,
    false,
    false,
    "",
    "preview"
  );
  $(folderStructurePreview).jstree(true).settings.core.data = guidedJsTreePreviewData;
  $(folderStructurePreview).jstree(true).refresh();
};
