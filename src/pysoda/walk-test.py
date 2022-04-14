import os

BUCKET_SIZE = 500

#   "C:\\Users\\CMarroquin\\status-barr-local"
# top down scan through dataset to upload each file/folder


folders = {}

path_dataset = "C:\\Users\\CMarroquin\\status-barr-local"

norm_path = os.path.basename(os.path.normpath(path_dataset))

print(norm_path)

# create the root directory on Pennsieve and store it for later
root_folder_name = os.path.basename(norm_path)
# root_pennsieve_folder = myds.create_collection(root_folder_name)
folders[root_folder_name] = "Root Pennsieve Folder"

for dirpath, child_dirs, files in os.walk(path_dataset, topdown=True):
    #  get the current root directory's name not its relative path
    name_of_current_root = os.path.basename(norm_path)

    # get the current folder out of the pennsieve folders storage
    current_folder = folders[name_of_current_root]

    # upload the current directory's child directories
    for child_dir in child_dirs:
        # child_dir_pennsieve = current_folder.create_collection(child_dir)
        # store the folders by their name so they can be accessed when we
        # need to upload their children folders and files into their directory
        folders[child_dir] = "A child folder"

    print("About to do child foldersa")

    print("Here are the files: ", files)

    if len(files) > BUCKET_SIZE:
        # bucket the upload
        start_index = end_index = 0
        # store the aggregate of the amount of files in the folder
        total_files = len(files)

        # while startIndex < files.length
        while start_index < total_files:
            # set the endIndex to startIndex plus 750
            end_index = start_index + BUCKET_SIZE - 1

            # check if the endIndex is out of bounds
            if end_index >= total_files:
                # if so set end index to files.length - 1
                end_index = len(files) - 1

            # get the 750 files between startIndex and endIndex (inclusive of endIndex)
            upload_bucket = files[start_index : end_index + 1]

            # clear the pennsieve queue for successive batches
            # clear_queue()

            # upload the files
            # bf_folder.upload(*upload_bucket)
            print("Bucketing these files: ", dirpath, upload_bucket)
            print("\n")

            # update the global that tracks the amount of files that have been successfully uploaded
            # main_curation_uploaded_files += BUCKET_SIZE

            # update the start_index to end_index + 1
            start_index = end_index + 1
    else:
        if len(files) > 0:
            print("Uploading all the files in the current directory: ", dirpath, files)
            print("\n")
        else:
            print("No files to upload in this directory")
            print("\n")


print("Done")
