from os import walk
from os.path import join, getsize



def get_dataset_size(path_to_ds):
    """
    This function checks for empty files and folders in the dataset at the path provided.
    Preconditions are that the dataset has no hidden files or empty folders.
    """
    total_file_size = 0
    invalid_dataset_message = ""
    total_files = 0

    try:
        for path, dirs, files in walk(path_to_ds):
            for f in files:
                fp = join(path, f)
                invalid_dataset_message += verify_file(f, fp)
                mypathsize = getsize(fp)
                total_file_size += mypathsize
                total_files += 1
            for d in dirs:
                dp = join(path, d)
                myfoldersize = folder_size(dp)
                if myfoldersize == 0:
                    invalid_dataset_message = invalid_dataset_message + dp + " is empty <br>"

        return total_file_size, invalid_dataset_message, total_files
    except Exception as e:
        raise e


def folder_size(path):
    """
    Provides the size of the folder indicated by path

    Args:
        path: path of the folder (string)
    Returns:
        total_size: total size of the folder in bytes (integer)
    """
    total_size = 0
    start_path = "."  # To get size of current directory
    for path, dirs, files in walk(path):
        for f in files:
            fp = join(path, f)
            total_size += getsize(fp)
    return total_size


def verify_file(file, file_path):
    """
        Verify the file by checking its size and if it is a hidden file. If the file is empty or hidden, then an error message is returned.
        TODO: Verify that we can get the size of empty files. If not go back to if -> elif
    """

    mypathsize = getsize(file_path)
    invalid_dataset_message = ""

    if mypathsize == 0:
        invalid_dataset_message = invalid_dataset_message + file_path + " is 0 KB <br>"

    if file[:1] == ".":
        invalid_dataset_message = (
            invalid_dataset_message
            + file_path
            + " is a hidden file not currently allowed during Pennsieve upload. <br>"
        )

    return invalid_dataset_message