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
