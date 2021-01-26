# Change Log
All notable changes to SODA will be documented in this file.

## v3.0.1 - 2020-12-15

### Feature additions:
- Full file organization interface with lower-level folder support (1)
- Revised User Interface for the Prepare dataset -> Organize dataset feature aiming to make it more user-friendly and the curation process easier to follow through (2)
- Added in-app updating for Windows and Linux (Ubuntu)

#### Further notes:
- Feature (1) further explained: Extended the previous interface such that user can create virtual subfolder structures within high-level SPARC folders and specify files to be included in each of them.
- Feature (2) further explained: Changed user interface for the Organize dataset feature such that there are fewer texts and more easy-to-follow steps. It now follows the question-by-question format that guides users through the curation steps. This change aims at creating better interactions between SODA and users, thus making the curation process quicker and easier.

### Major bug fixes:
- Updated Airtable SPARC's table name to reflect the change initiated by SPARC. Prior to the fix, SODA could not connect to SPARC award data sheet, thus raising an error when users utilize the Prepare metadata feature.

## v3.0.2 - To be released

### Bug fixes:
- When uploading a local dataset to an existing Blackfynn folder, the 'skip' folders option now correctly uplaods files that were not meant to be skipped
- Creating a new local folder as your dataset destination now renames the generated folder correctly if a duplicate folder has to be created.
