# This document contains links to key SODA for SPARC data curation workflows.

## Dataset Upload

SODA for SPARC's primary method for uploading datasets is via the main_curate_function found below. This will handle
uploading local dataset files to Pennsieve, as well as merging local files with existing Pennsieve files and folders
according to the desired merge strategy for folders (replace, duplicate, skip, merge) and files ( duplicate, replace, skip).

- [Main curation function](https://github.com/fairdataihub/SODA-for-SPARC/blob/0946337f843b490b77773d5ddceaad56cea37405/pyflask/curate/curate.py#LL2716C47-L2716C47)

If interested in how the curate function validates the dataset files, see the following link for file validation:

- [Local file validation](https://github.com/fairdataihub/SODA-for-SPARC/blob/0946337f843b490b77773d5ddceaad56cea37405/pyflask/curate/curate.py#L670)
- [Pennsieve file validation](https://github.com/fairdataihub/SODA-for-SPARC/blob/0946337f843b490b77773d5ddceaad56cea37405/pyflask/curate/curate.py#L2528)
