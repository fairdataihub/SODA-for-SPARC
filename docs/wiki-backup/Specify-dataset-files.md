## Background

All SPARC datasets must follow the top level SPARC folder structure imposed by the [SPARC Dataset Structure](https://docs.google.com/presentation/d/1EQPn1FmANpPsFt3CguU-JOQVMMlJsNXluQAK_gb2qVg/edit#slide=id.p1). This top level folder structure is shown in the figure below. If your data organization doesn't follow this structure inherently, you can create it virtually with SODA then either generate it locally on your computer or directly on Blackfynn (to avoid duplicating files locally). 

<p align="center">
<img src="https://github.com/bvhpatel/SODA/raw/master/docs/documentation/Prepare-dataset/Specify-files/SPARC-dataset-structure.PNG" width="650">
<br/> 
  <i> Overview of the top level folder structure required for all SPARC datasets (taken from the <a href="https://docs.google.com/presentation/d/1EQPn1FmANpPsFt3CguU-JOQVMMlJsNXluQAK_gb2qVg/edit#slide=id.p1">instructions</a> prepared by the SPARC Curation Team). </i>
</img>
</p>

## How to 

1. Specify the files/folders that you want to include in each SPARC folder by dragging and dropping them on the desired row of the SODA table or simply use the file/folder browsing buttons. Checkout the tooptip located in each row to learn what files are expected to be added in each of the SPARC folders. The paths of the files/folders you decide to include will be shown in a table. SODA will then use this table to generate your dataset when you reach the "Generate dataset" step.

<p align="center">
<img src="https://github.com/bvhpatel/SODA/raw/master/docs/documentation/Prepare-dataset/Specify-files/specify-files.gif" width="650">
</p>

2. Buttons located below the table allow users to complete the following actions quickly:
* **Save Table:** Save the tables from "Specify dataset files" and "Specify metadata files" in a CSV format progress file for continuing later. 
* **Import Table:** Import progress file you saved previously and continue organizing your dataset.
* **Clear Table:** Remove all paths and descriptions from the table .
* **Preview:** Get a preview of the dataset to see what it will look like once generated. The preview is created in a folder named 'Preview' and located in the 'SODA' folder on the user's computer. The files in the preview are mock files (0 kb) with only name and extension corresponding to the actual files specified in the tables under the 'Specify dataset files' and 'Specify metadata files' features.

## Notes

* Click on "Delete row" to remove any item from the table.
* Click on "Edit description" to include a description (available for files only) which will then be added to the corresponding manifest file if generated with SODA.
* Click on a header of the table to collapse the corresponding file/folder paths if you want a cleaner-looking workspace.
* If you include a folder in the table, only the path to the folder will be shown but all files/folders in that folder will be included when the dataset is generated.
