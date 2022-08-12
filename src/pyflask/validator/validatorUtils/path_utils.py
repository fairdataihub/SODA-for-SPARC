import os 
import sys 
from pathlib import Path
from sparcur.paths import Path as SparCurPath


def get_home_directory(folder):
    if sys.platform == "win32":
        return str(Path.home()) + "/AppData/Local/" + folder
    elif sys.platform == "linux":
        return str(Path.home()) + "/.config/" + folder
    elif sys.platform == "darwin":
        return str(Path.home()) + "/Library/Application Support/" + folder 


userpath = os.path.expanduser("~")
configpath = os.path.join(userpath, '.pennsieve', 'config.ini')
sodavalidatorpath = os.path.join(userpath, 'SODA', 'SODA_Validator_Dataset')


local_sparc_dataset_location = str(Path.home()) + "/files/sparc-datasets"
parent_folder = SparCurPath(local_sparc_dataset_location).expanduser()