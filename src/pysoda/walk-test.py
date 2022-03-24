import os

BUCKET_SIZE = 500

#   "C:\\Users\\CMarroquin\\status-barr-local"
# top down scan through dataset to upload each file/folder
for root, dirs, files in os.walk("/Users/aaronm/Desktop/react-electron", topdown=True):
    print("Root is:", root)
    print("Dirs are: ", dirs)
    print("files are: ", files)

    # upload the directories
    print("Uploading the following directories non-recursively: ", dirs)

    if len(files) > BUCKET_SIZE:
        # bucket the upload
        start_index = end_index =  0
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
                print("Bucketing these files: ", root, upload_bucket)
                print("\n")

                # update the global that tracks the amount of files that have been successfully uploaded
                # main_curation_uploaded_files += BUCKET_SIZE

                # update the start_index to end_index + 1
                start_index = end_index + 1
    else:
        if len(files) > 0:
            print("Uploading all the files in the current directory: ", root, files)
            print("\n")
        else:
            print("No files to upload in this directory")
            print("\n")


