## Background

Under this feature, SODA lets you quickly and accurately prepare the dataset_description metadata file which is mandatory for all SPARC datasets. SODA provides a convenient interface, which is more intuitive than the Excel spreadsheet template. It also makes use of information from your dataset on Blackfynn and the SPARC Airtable sheet to help you populate some of the fields easily. The expected structure of this file, generated automatically by SODA, is explained in our corresponding ["How to" page](https://github.com/bvhpatel/SODA/wiki/How-to-structure-the-dataset-description-metadata-file) if you would like to learn about it.

## How to
The interface divides the dataset decription in four convenient sections to facilitate your task. Go through them successively and populate the various fields as indicated:

* Dataset Info (high-level information about your dataset):
  1. Name: Descriptive title for the dataset. Since this field should match exactly with your dataset on Blackfynn, SODA let you select it from your list of Blackfynn datasets (see ["Connect to your Blackfynn account"](https://github.com/bvhpatel/SODA/wiki/Connect-to-your-Blackfynn-account) section). 
  2. Description: Brief description of the study and the dataset. This is populated automatically from your dataset description on Blackfynn for your convenience (see ["Add metadata to dataset"](https://github.com/bvhpatel/SODA/wiki/Add-metadata-to-dataset) feature for adding a description). 
  3. Keywords: A set of 3-5 keywords (other than those used in the name and description) that will help in searching your dataset once published
  4. Number of subjects: Number of unique subjects in this dataset, should match subjects metadata file. Must be greater or equal to 1. 
  5. Number of samples: Number of unique samples in this dataset, should match samples metadata file. Set to zero if there are no samples.

<p align="center">
<img src="https://github.com/bvhpatel/SODA/raw/master/docs/documentation/Prepare-metadata/Dataset_description/dataset-info.gif" width="650">
</p>

* Contributor Info (information about the contributors to your dataset):

  1. SPARC Award: Select the SPARC award associated with your dataset
  2. Other funding sources: Specify other funding sources, if any. Hit 'Enter' on your keyboard after typing each. Leave empty if none.
  3. Acknowledgments: Specify any acknowledgments beyond funding and contributors. Leave empty if none.
  4. Contributor Information: 
     * Provide information about any contributor to the dataset. Note that the "Contributor" list is compiled from the SPARC Airtable sheet based on the SPARC award selected. Select one Contributor to get the ORCID ID, Contributor Affiliation, and Contributor Role populated automatically (if specified in the SPARC Airtable Sheet). Select "Other contributors" in the "Contributors" dropdown list if you'd like to enter a Contributor name manually (although we suggest to enter them directly in the SPARC Airtable - restart SODA to see them in the list). 
     * Check "Is Contact person?" if the contributor is a contact person for the dataset. At least one and only one of the contributors should be the contact person.
     * Click "Add" to add the contributor to SODA's contributor table. Each contributor added to the table will be added to the dataset description file when it is generated.

<p align="center">
<img src="https://github.com/bvhpatel/SODA/raw/master/docs/documentation/Prepare-metadata/Dataset_description/contributor-info-1.gif" width="650">
</p>

* Article(s) and protocol(s) (information about article(s) and protocol(s) related to this dataset):

  1. Link type: Select the nature of the link among 
     * Protocol URL or DOI: URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset
     * Originating Article DOI: DOIs of published articles that were generated from this dataset
     * Additional links: URLs of additional resources used by this dataset (e.g., a link to a code repository)
  2. Link: Enter the link
  3. Link description: Optionally provide a short description of the link.
  4. Click on "Add" to register specified link to SODA's link table. All links and descriptions added to the table will be included in your dataset description file when it is generated.

<p align="center">
<img src="https://github.com/bvhpatel/SODA/raw/master/docs/documentation/Prepare-metadata/Dataset_description/link-info.gif" width="650">
</p>

* Completeness Info (information about potential relation with other dataset(s)):

  1. Completeness of dataset: Is the data set as uploaded complete or is it part of an ongoing study? Select "hasNext" to indicate that you expect more data on different subjects as a continuation of this study. Select “hasChildren” to indicate that you expect more data on the same subjects or samples derived from those subjects. Leave empty if none.
  2. Parent dataset(s): If this is a part of a larger dataset, or references subjects or samples from a parent dataset, select the prior dataset. You need only the last dataset, not all datasets. If samples and subjects are from multiple parent datasets please select them all. Leave empty if none.
  3. Title for complete dataset: Give a provisional title for the entire dataset. Leave empty if not applicable.

<p align="center">
<img src="https://github.com/bvhpatel/SODA/raw/master/docs/documentation/Prepare-metadata/Dataset_description/completeness-info.gif" width="650">
</p>

* After you complete all steps, click on "Generate" to generate your dataset description file. A warning message may show up if any mandatory fields are missing. You may decide to go back and address the issues or generate the file anyway (and address the issues later). 

## Notes

* In the contributors table, you can drag and drop rows to organize contributors in the order that they should appear in the dataset_description file. You can also remove one with the delete button.

<p align="center">
<img src="https://github.com/bvhpatel/SODA/raw/master/docs/documentation/Prepare-metadata/Dataset_description/contributor-info-2.gif" width="650">
</p>
