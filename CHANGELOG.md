# Change Log

All notable changes to SODA will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## v.5.3.4 - 2022-04-25

### Feature additions:

- In Organize Dataset: Lazy loading is now a feature when viewing all imported items in a dataset. This will ease performance when datasets are large (over 500+ items) and can cause issues when rendering on older machines.
- Importing a local dataset will now be handled on the python end to increase performance. A progress bar is also included to show details about import to user.
- On success of importing files/folders there will be a toast display on the bottom right to give user a notification.

### Bug fixes:

- Fixed bug under Step 3 - Organize datasets when users click Next to get to subsequent steps, and when they go back to this step, they cannot navigate in and out the high-level folders anymore.

- Added a SweetAlert loading popup for when users move a large number of files/folders under Step 3 - Organize datasets.

- Fixed bug related to the false warning of "The dataset does not contain valid SPARC folders" due to wrongly saved local dataset paths.

- Fixed UI bug related to the manifest file generator where the live spreadsheet is auto-opened without being prompted to open.

- Fixed bug with illegally formatted metadata files being dropped in Step 4: Metadata files.

- Fixed UI bug where tooltips in the Prepare Metadata section receive a top and a right message on hover.

### Known Issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.
- When uploading a dataset through Upload Local Dataset or Organize Dataset feature to Pennsieve the upload will sometimes freeze. When this occurs it is best to reset the upload and ensure the Pennsieve Agent has been stopped before attempting to upload again. It is also necessary to verify the integrity of uploaded files up to that point. This can be done by simply ensuring all files from folders that have been uploaded are included in the Pennsieve dataset.

## v.5.3.3 - 2022-04-08

### Bug fixes:

- Uploading a local dataset to a new Pennsieve dataset through the Organize Dataset feature no longer pauses indefinitely before the upload begins.

### Known Issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.
- When uploading a dataset through Upload Local Dataset or Organize Dataset feature to Pennsieve the upload will sometimes freeze. When this occurs it is best to reset the upload and ensure the Pennsieve Agent has been stopped before attempting to upload again. It is also necessary to verify the integrity of uploaded files up to that point. This can be done by simply ensuring all files from folders that have been uploaded are included in the Pennsieve dataset.

## v.5.3.2 - 2022-04-01

### Feature additions:

- When Editing Manifest files generated through SODA a user may now utilize a Context Menu to add or remove new columns to the manifest file.
- A user may now import existing manifest files from local datasets.
- A user will have the option to perform other curation tasks after starting a dataset upload/generation. Upon doing so they will see a upload progress bar in the navigation bar.
- User can upload large folders( 1k+ files ) through SODA to Pennsieve.

### Known Issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.
- When uploading a dataset through Upload Local Dataset or Organize Dataset feature to Pennsieve the upload will sometimes freeze. When this occurs it is best to reset the upload and ensure the Pennsieve Agent has been stopped before attempting to upload again. It is also necessary to verify the integrity of uploaded files up to that point. This can be done by simply ensuring all files from folders that have been uploaded are included in the Pennsieve dataset.

## v.5.3.1 - 2022-02-28

### Bug fixes:

- Drag and drop functionality in Organize Datasets now correctly imports multi-selected files and folders.

### Known Issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v.5.3.0 - 2022-02-16

### Feature additions:

- A stand-alone manifest file generation feature has been added. For this feature, users can now generate manifest files for their datasets stored locally or on Pennsieve.
- When importing files/folders duplicates will now prompt user if they would like to skip, replace, or rename them accordingly.

### Bug fixes:

- Fixed issue wherein Submission.xlsx files are not uploaded to Pennsieve in the Prepare Metadata section.
- Fixed issue that prevented dataset_description.xlsx protocols from being editable within the Prepare Metadata section.

### Known Issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v.5.2.1 - 2022-02-01

### Bug fixes:

- Fixed issue where file uploads to Pennsieve would sometimes fail because of an uncleared Pennsieve Client file upload queue.

### Known Issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v.5.2.0 - 2022-01-18

### Bug fixes:

### Feature additions:

- Users can hover over their account and dataset text to edit the selected dataset/account in the account and dataset details card throughout SODA for SPARC.
- Users can submit their dataset to the SPARC Curation Team for pre-publishing review.
- Users can exclude high level metadata files from publishing from within the pre-publishing review process.
- Users can choose to place their dataset under embargo so that after being published their dataset is not immediately made public.
- Users can withdraw their dataset from pre-publishing review.
- Users can link their Pennsieve account to their ORCID iD from within the pre-publishing review process.

## v.5.1.0 - 2021-11-17

### Bug fixes:

### Feature additions:

- Users can upload and edit descriptive digital metadata tags to their dataset. By SPARC guidelines tags are now required before a researcher can publish a dataset.
- Updated the add/edit description digital metadata feature to be more intuitive for users.
- Updated the add/edit digital metadata buttons to distinguish between metadata addition and editing.
- Updated the loading and confirmation Sweet Alert messages to give the user a better idea of the background processes taking place.
- Added interfaces for creating the (optional) CHANGES.txt and README.txt files in SODA.
- Added the functionality to generate metadata files directly on Pennsieve.
- Added the functionality to edit metadata files imported directly from Pennsieve.
- Added interface to import code-related metadata files in SODA.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v5.0.2 - 2021-11-02

### Bug fixes:

- Edited documentation links according to the new changes made to SODA's documentation website.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v5.0.1 - 2021-10-12

### Bug fixes:

- Fixed bug caused by external bug from protocols.io. HTTPs request returning insufficient information was fixed by protocols.io. We integrated the fix on our side.
- Fixed bug that caused "Generate" buttons in the prepare metadata sections from creating tooltips on hover.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v5.0.0 - 2021-10-08

### Feature additions:

- Updated Prepare metadata section to adapt to new SDS 2.0.0 version.
- Added the feature to import existing dataset_description.xlsx file for edits in SODA.
- Added onboarding for submission file.

### Bug fixes:

- Fixed subjects and samples file generation bug with extra optional column added.

### Known issues:

- Temporarily removed support for Protocols.io integration due to code change from Protocols.io.
- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v4.8.0 - 2021-09-27

### Feature additions:

- Added onboarding for subjects and samples tables.
- Added validation checks for verifying the backend and front end app versions.
- Refactored large parts of the code performance improvements.
- Added onboarding for step 3 of the Organize dataset process.

### Bug fixes:

- Importing subjects + samples files have been adapted to new strain/species UI change
- Changed the activation point for illegal character checks.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v4.7.1 - 2021-09-13

### Bug fixes:

- Fixed Airtable Base ID bug for the Airtable login function.
- Added checks more illegal characters for folder names.
- Fixed Contributor Role suggestion dropdown bug that only showed a maximum of 5 items.
- Fixed `Start over` functions for subjects and samples files to adapt to the new Add strains and Add species UI change.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v4.7.0 - 2021-08-31

### Feature additions:

- Changed user interface for `Prepare metadata - Create submission.xlsx file`. This user interface was changed to be even more user-friendly and consistent with the user interface of `Prepare metadata - Create dataset_description.xlsx file`.
- Added user onboarding tutorials to help first time users of the app understand Step 3 of Organizing datasets better.
- Changed strain and species retrieval under Create subjects.xlsx and Create samples.xlsx from input search to button clicks.
- Changed all of the remaining status elements into Sweetalert popups for consistency in the app.
- Added an option to replace metadata files when generating if one already exists at the destination folder.
- Added restrictions to the folder creation user interface to be more in line with the requirements from Pennsieve.

### Bug fixes:

- Switched popover libraries to ensure that hyperlinks are clickable when required.
- Changed table tooltip (Edit/Copy/Delete a subject or sample) in the features: Create subjects.xlsx and Create samples.xlsx to be text-based for clearer instructions for users.
- Fixed a bug with samples file generation where copying fields would cause an error when generating the final file.
- Fixed an issue where libraries were being loaded out of order leading to errors when opening SODA for the first time.
- When uploading a dataset, we have now locked the sidebar to prevent accidental clicks that would take you out of the UI.
- Fixed a bug where loading an award from Airtable would require two attempts.
- Fixed a bug where macOS version of SODA would run the pre-check message everytime the app lost focus.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v4.6.2 - 2021-08-13

### Bug fixes:

- Changed the way SODA populated the dataset_description file - protocols, originating articles/DOIs, and additional links options. Protocols and Originating articles/DOIs DO NOT have a description. Only additional links does. Changed the backend and frontend accordingly to enforce this change.
- Added a warning whenever users import another existing metadata file (subjects, samples, dataset_description) onto SODA.
- Fixed margin bug for Details display (Prepare dataset -> Step 3).
- Added warning for when a user imports an existing metadata file. If any values from the file does not follow SPARC standard values, they will be ignored and not imported onto SODA for edits.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v4.6.1 - 2021-08-06

### Bug fixes:

- Fixed a bug where manifest file data wasn't being pulled down correctly on Windows.
- Fixed a bug where .tiff images were not being converted by SODA.
- Fixed an issue where multiple sample id imports from the primary folder would not work.
- Fixed a bug where the import primary folder button would dissapear when starting over.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v4.6.0 - 2021-07-19

### Feature additions:

- You can now create your subjects.xlsx and samples.xlsx files directly through SODA.
- Added additional navigation buttons that should allow a user to not have to return to the main menu when a certain function is complete. This workflow follows the step by step guide found [here](https://github.com/bvhpatel/SODA/wiki/Organize-and-submit-SPARC-datasets-with-SODA).
- Added a new warning when uploading a banner image.
- Transformed the existing user interface for the dataset_description.xlsx file. This new interface is changed to be consistent with the newly added subjects.xlsx and samples.xlsx interfaces.

### Bug fixes:

- Fixed a bug where the footer of the app could be mispositioned sometimes.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v4.5.1 - 2021-06-25

### Bug fixes:

- Fixed a bug where trying to connect to Pennsieve with an API key alone would return an error.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v4.5.0 - 2021-06-25

### Feature additions:

- All input and message boxes should now follow the call to action button ordering that is specified in their OS application guidelines.
- Added additional navigation buttons that should allow a user to not have to return to the main menu when a certain function is complete. This workflow follows the step by step guide found [here](https://github.com/bvhpatel/SODA/wiki/Organize-and-submit-SPARC-datasets-with-SODA).

### Bug fixes:

- Fixed a bug where certain message input boxes would take accidental clicks outside the clickable area and clear the input
- The dataset_description file will no longer enforce a 5 keyword limit.
- Fixed a bug where the siebar would open up when exiting a datset curation workflow.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v4.4.0 - 2021-06-03

### Feature additions:

- Added support for more stringent file check with regards to metadata files. This should prevent you from importing files that are not valid.
- Added a button to paste your API keys into the application more easily.
- Added better warnings for when a backend module fails. This should give you more information about the status of SODA and if a restart of the app maybe necessary.
- Adjusted the ordering of message box buttons to better follow OS specific guidelines for Human Interface Design.

### Bug fixes:

- Fixed a potential bug where misspelled high level folders could cause SODA to not pull the correct information from Pennsieve.
- Fixed a bug where launching SODA could randomly cause step 7 of 'Organize Datasets' to not show up when generating a dataset.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v4.3.0 - 2021-05-24

### Feature additions:

- Added support for toast style notifications to better show relevant information. When you open the app, SODA will run through a checklist of items so that you can see if you are missing any components required for the workflow. This includes checking for Pennsieve agent updates and SODA application updates as well.
- You can now use your Pennsieve login details to connect your Pennsieve account to SODA. This will replace the default API key based login. The original login method with API key will remain as a secondary login alternative.
- Added better warning messages to functions that were not descriptive enough so now you will have a better idea of what they do.
- You can now add line breaks for your dataset descriptions when created through SODA.
- SODA now uses a new visual look for showing message boxes and alerts. This would make SODA's UI more consistent.

### Bug fixes:

- Fixed a bug where SODA was unable to update on macOS through the built in buttons. The new update notification will be less intrusive and take up less space on your screen.
- When you request a database from Pennsieve, SODA will now generate a timestamp that is inline with the curation team's requirements.
- Fixed a visual bug where users would have been able to continue through certain datasets on a dataset that did not have a valid name.
- Fixed a visual bug where right clicking on an item in 'Step 3' of our organize datasets would show the context menu in the wrong position.
- Fixed a minor bug where .jpeg files were not requesting their proper icon in the UI.
- Added minor bug fixes with new Pennsieve APIs. As we go forward, performance of key SODA-Pennseive elements should improve.

### Known issues:

- There is a bug with removing dataset permissions using both SODA and Pennsieve. If you want to remove your own permission from a dataset, another user with either 'Manager' or 'Owner' permissions must remove you from the dataset. This is an issue with Pennsieve's backend system and will be updated soon.

## v4.2.1 - 2021-04-23

### Bug fixes:

- Updated Pennsieve python packages to support minor bugfixes and performance improvements.
- Fixed a minor bug in how dataset statistics were being recorded.
- Fixed a bug where the contact person could not be changed when creating the dataset_description metadata file.

## v4.2.0 - 2021-04-21

### Feature additions:

- SODA now supports Pennsieve.
  - With the transition from Blackfynn to Pennsieve complete, SODA now uses the Pennsieve platform as the backend of the app.
  - For the user, the changes should be integrated in with no downtime. All pre-existing functionality of Blackfynn is now supported within SODA. You will only need new API keys for using SODA as well as the Pennsieve agent.

### Bug fixes:

- When creating the manifest files for local review, SODA will now ignore deleted files and folders before creating the manifest file.
- When you rename a file with more than one extension, SODA will correctly identify the name portion of the file and allow you to rename your file accordingly.
- For long file names or files with long paths, the user interface will break the text to control text clipping boundaries.
- Fixed a bug where manifest files with the 'strict Open XML' format and .xlsx extensions were being read incorrectly. SODA will now ignore manifest files that are not saved in the right format and warn you about this issue when you pull a dataset from Pennsieve.
- When uploading on macOS, hidden files like .DS_STORE will currently break the Pennsieve agent upload. To combat this if your folder has these hidden files, SODA will block the upload when you use the 'Manage Datasets - Upload a local folder' feature. If you import a folder, that has these files, within the 'Organize Dataset' process, SODA will filter out these files automatically.
- When showing popups for users, the messages now don't unintentionally move other content out of the way. This should make SODA to be more consistent to use.
- Added a bug fix for the dataset subtitle character count

## v4.1.0 - 2021-04-09

### Feature additions:

- Complete UI overhaul for the Manage Datasets, Prepare Metadata and Disseminate Dataset features to bring the SODA's visuals to be consistent across all features.
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
  - SODA now allows multiple selections of files and folders for manipulation. This can be achieved by dragging your mouse pointers over several items or pressing and holding the Ctrl button and select the items.
  - Blackfynn has updated how their backend systems handle file names when you upload to their platform. SODA will take care of all the file names and generate your manifest files accordingly.
  - When you organize a dataset, you can now generate your manifest files locally to verify their accuracy before you upload them to Blackfynn.
  - A preview step is added to the dataset organization process that gives users a preview of their dataset structure, generate options, and options to edit if applicable. The dataset structure at this step will be shown in a tree view for an easy and convenient file track.
- Unshare with the Curation team
  - If you have already shared your dataset with the Curation team, you can now remove it from this state with a click of just one button
- Unshare with the SPARC Consortium

  - If you have already shared your dataset with the SPARC consortium, you can now remove it from this state with a click of just one button

- Search dropdowns:
  - Multiple dropdowns throughout SODA are now searchable. These dropdowns include the dataset list, PI owner/user/team list, and SPARC award list.
- Updated account management
  - SODA now restricts you to have only one valid account at a time. This account has to be within the SPARC Consortium organization. If you have any Blackfynn API keys from an unsupported organization they will be removed and SODA will prompt you to regenerate a new key set that is within the SPARC Consortium organization.
- Adding Permissions for users
  - Within the dropdowns for selecting users within the SPARC organization, you will now see their email for better clarity.
- Added support for TIFF banner images
  - If you wanted your TIFF image to be the banner image of your dataset, you can now use SODA to automatically convert and set your banner image.
- Added support for in-app updating on macOS

### Bug fixes:

- When uploading a local dataset to an existing Blackfynn folder, the 'skip' folders option now correctly uploads files that were not meant to be skipped.
- Creating a new local folder as your dataset destination now renames the generated folder correctly if a duplicate folder has to be created.
- Squashed a bug where files uploaded to Blackfynn were sometimes not renamed.
- Create dataset_description.xlsx file: Fixed bug where a contributor's affiliations have a comma.
- Fixed a bug where when you would upload files to Blackfynn, it would create a duplicate and not replace your old files.
- Added support for files with more than one extension. This fixes a bug where the manifest file was providing the incorrect file type.

## v3.0.1 - 2020-12-15

### Feature additions:

- Full file organization interface with lower-level folder support (1)
- Revised User Interface for the Prepare dataset -> Organize dataset feature aiming to make it more user-friendly and the curation process easier to follow through (2)
- Added in-app updating for Windows and Linux (Ubuntu)

#### Further notes:

- Feature (1) further explained: Extended the previous interface such that users can create virtual subfolder structures within high-level SPARC folders and specify files to be included in each of them.
- Feature (2) further explained: Changed user interface for the Organize dataset feature such that there are fewer texts and more easy-to-follow steps. It now follows the question-by-question format that guides users through the curation steps. This change aims at creating better interactions between SODA and users, thus making the curation process quicker and easier.

### Major bug fixes:

- Updated Airtable SPARC's table name to reflect the change initiated by SPARC. Prior to the fix, SODA could not connect to the SPARC award data sheet, thus raising an error when users utilize the Prepare metadata feature.
