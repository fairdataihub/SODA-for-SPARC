# Change Log
All notable changes to SODA will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## v4.3.0 - TBD

### Feature additions:
- Added support for toast style notifications to better show relevant information. When you open the app, SODA will run through a checklist of items so that you can see if you are missing any components required for the workflow. This includes checking for Pennsieve agent updates and SODA application updates as well.
- You can now use your Pennsieve login details to connect your Pennsieve account to SODA. This will replace the default API key based login. The original login method will be present as a secondary login alternative in the meantime.  
- Added better warning messages to functions that were not descriptive enough so now you will have a better idea of what they do.
- You can now add line breaks for your dataset descriptions when created through SODA.
- SODA now uses a new visual look for showing message boxes and alerts. This should make SODA more consistent to use.

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

## v4.2.0 - 2020-04-21

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

## v4.1.0 - 2020-04-09

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
- 
