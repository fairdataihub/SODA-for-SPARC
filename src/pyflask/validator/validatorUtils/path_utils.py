import os 
import sys 
from pathlib import Path
from sparcur.paths import Path as SparCurPath


def get_home_directory(folder):
    """
        Returns the location of the validator config folder per OS.
    """
    if sys.platform == "win32":
        return str(Path.home()) + "/AppData/Local/" + folder
    elif sys.platform == "linux":
        return str(Path.home()) + "/.config/" + folder
    elif sys.platform == "darwin":
        return str(Path.home()) + "/Library/Application Support/" + folder 


def create_normalized_ds_path(ds_path):
    """
        Given a path to a user's dataset, verify and create a normalized path to the dataset. 
        Necessary for the sparcur.simple.validate function to work.
    """

    # convert the path to absolute from user's home directory
    joined_path = os.path.join(userpath, ds_path.strip())

    if not os.path.isdir(joined_path):
        raise OSError(f"The given directory does not exist: {joined_path}")
    
    return Path(joined_path)


userpath = os.path.expanduser("~")
configpath = os.path.join(userpath, '.pennsieve', 'config.ini')
sodavalidatorpath = os.path.join(userpath, 'SODA', 'SODA_Validator_Dataset')

local_sparc_dataset_location = str(Path.home()) + "/files/sparc-datasets"
parent_folder = SparCurPath(local_sparc_dataset_location).expanduser()


