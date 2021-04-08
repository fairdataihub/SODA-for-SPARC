## Background

All SPARC datasets must include several metadata files as defines by the [SPARC Dataset Structure](https://docs.google.com/presentation/d/1EQPn1FmANpPsFt3CguU-JOQVMMlJsNXluQAK_gb2qVg/edit#slide=id.p1). Especially, the following metadata files are typically expected in the high-level dataset folder:
* submission (mandatory, format: xlsx, csv, or json)
* dataset_description (mandatory, format: xlsx, csv, or json)
* subjects (mandatory, format: xlsx, csv, or json)
* samples (dataset dependent, format: xlsx, csv, or json)
* README.txt (optional currently but discussions are on-going to make it mandatory)
* CHANGES.txt (optional)

Moreover, manifest files (mandatory, format: xlsx, csv, or json) are required either in all high-level SPARC folders or in all folders with at least one file (both formats are accepted by the Curation Team). The expected structure of the manifest files, generated automatically by SODA, is explained in our corresponding ["How to" page](https://github.com/bvhpatel/SODA/wiki/How-to-structure-the-manifest-metadata-file) if you would like to learn about it.

In this feature of SODA, you can specify the high-level metadata files to be included in your dataset when generated. You can also request SODA to prepare manifest files automatically and include then when generating your dataset. Note that the submission and dataset_description files could be prepared with SODA easily from the "Prepare Metadata" section.

## How to

### Auto generate manifest files

To generate and include manifest files automatically, simply toggle the "Include auto-generated manifest files" option. Then, when you generate the dataset, a "manifest.xlsx" file will be added to each high-level SPARC folder with the "filename", "timestamp" (time zone accounted for), and "file type" fields automatically populated while the "description" field will be filled with the descriptions provided (if any) in the table during the "Specify dataset files" step. Any existing manifest files (from the user) will be replaced.

### Specify high-level metadata files to be included

Add desired high-level metadata files to be included to the table by dragging and dropping on the header or using the file browser.

<p align="center">
<img src="https://github.com/bvhpatel/SODA/raw/master/docs/documentation/Prepare-dataset/Specify-metadata/specify-metadata.gif" width="650">
</p>

## Notes 

* Save Table button: Save the tables from "Specify dataset files" and "Specify metadata files" in a CSV format progress file for continuing later.
* Preview button: Get a preview of the dataset to see what it will look like once generated with your specified metadata files. 
