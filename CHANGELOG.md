# Change Log
All notable changes to SODA will be documented in this file.

## v4.1.0 - 2020-04-09

### Feature additions:
- Complete UI overhaul for the Manage Datasets, Prepare Metadata and Disseminate Dataset features to bring the SODA's visuals to be consistent across all features
- Organize a local dataset
    - You are now able to import and organize dataset folders and files directly from your local file system.
    - After organizing the dataset and including your metadata files, you can push your dataset directly to Blackfynn for storage and publishing or save it on your computer for future use.
- Organize a Blackfynn dataset
    - You are now able to import a dataset, directly from Blaackfynn and rename, move and delete files directly from SODA. 
    - Support for importing pre-existing manifest files and metadata files has been included.
    - You will be able to import new files from your computer and deposit it within your Blackfynn dataset as well.
- Save your progress
    - If you are in the middle of organizing a dataset and have to leave the process at any time, you can now save all your current progress and restart from the exact same point at a later time.
- Organize dataset: 
    - You can now start over the dataset organization process at any point from step 3 onward by clicking the Start over button (located next to the Back button).
    - You can now move files and folders to another folder by right-clicking on the items and select Move to. 
    - SODA now allows multiple-selection of files and folders for manipulation. This can be achieved by dragging your mouse pointers over several items or pressing and holding the Ctrl button and select the items.
    - Blackfynn has updated how their backend systems handle file names when you upload to their platform. SODA will take care of all the file names and the generate your manifest files accordingly.
    - When you organize a dataset, you can now generate your manifest files locally to verify their accuracy before you upload to Blackfynn.
    - A preview step is added to the dataset organzation process that gives users a preview of their dataset structure, generate options, and options to edit if applicable. The dataset structure at this step will be shown in a tree view for easy and convenient file track.
     
- Unshare with the Curation team
    - If you have already shared your dataset with the Curation team, you can now remove it from this state with a click of just one button
- Unshare with the SPARC Consoritum
    - If you have already shared your dataset with the SPARC consortium, you can now remove it from this state with a click of just one button

- Search dropdowns: 
    - Multiple dropdowns throughout SODA are now searchable. These dropdowns include the dataset list, PI owner/user/team list, and SPARC award list. 
    
- Updated account management
    - SODA now restricts you to have only one valid account at a time. This account has to be within the SPARC Consortium organization. If you have any Blackfynn API keys from an unsupported organization they will be removed and SODA will prompt you to regenerate a new key set that is within the SPARC Consortium organization.
- Adding Permissions for users
    - Within the dropdowns for selecting users within the SPARC organization, you will now see their email for better clarity.
- Added support for TIFF banner images
    - If you wanted your TIFF image to be the banner image of your dataset, you can now use SODA to automatically convert and set your banner image.


### Bug fixes:
- When uploading a local dataset to an existing Blackfynn folder, the 'skip' folders option now correctly uploads files that were not meant to be skipped.
- Creating a new local folder as your dataset destination now renames the generated folder correctly if a duplicate folder has to be created.
- Squashed a bug where files uploaded to Blackfynn were sometimes not renamed.
- Create dataset_description.xlsx file: Fixed bug where a contributor's affliation has a comma.
- Fixed a bug where when you would upload files to Blackfynn, it would create a duplicate and not replace your old files.
- Added support for files with more than one extension. This fixes a bug where the manifest file was providing the incorrect filetype.


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
