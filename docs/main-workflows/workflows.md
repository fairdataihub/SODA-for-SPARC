# This document contains links to key SODA for SPARC data curation workflows.

## Dataset Upload

SODA for SPARC's primary method for uploading datasets is via the main_curate_function found below. This will handle
uploading local dataset files to Pennsieve, as well as merging local files with existing Pennsieve files and folders
according to the desired merge strategy for folders (replace, duplicate, skip, merge) and files ( duplicate, replace, skip).

- [Main curation function](https://github.com/fairdataihub/SODA-for-SPARC/blob/0946337f843b490b77773d5ddceaad56cea37405/pyflask/curate/curate.py#LL2716C47-L2716C47)

If interested in how the curate function validates the dataset files, see the following link for file validation:

- [Local file validation](https://github.com/fairdataihub/SODA-for-SPARC/blob/0946337f843b490b77773d5ddceaad56cea37405/pyflask/curate/curate.py#L670)
- [Pennsieve file validation](https://github.com/fairdataihub/SODA-for-SPARC/blob/0946337f843b490b77773d5ddceaad56cea37405/pyflask/curate/curate.py#L2528)

## Dataset Validation

SODA for SPARC integrates with the [SPARC Data Sturcture (SDS) Validator](https://github.com/SciCrunch/sparc-curation). SODA for SPARC takes the validation results object and parses it to return the relevant dataset validation results to the user. SODA for SPARC can validate datasets that are stored locally and on Pennsieve, however as the SDS Validator is still in development,
the Pennsieve validation workflow does not run through all Pennsieve pipelines at this moment in time.

- [Start of the dataset validation workflow](https://github.com/fairdataihub/SODA-for-SPARC-Validation-Server/blob/60a9760666bc301e8ca56999423e4bf9ec6f31f7/apis/apiValidator.py#L18)
