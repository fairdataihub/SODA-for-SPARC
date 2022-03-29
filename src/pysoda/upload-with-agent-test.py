import os
from pennsieve import Pennsieve
from pennsieve.log import get_logger
from pennsieve.api.agent import agent_cmd
from pennsieve.api.agent import AgentError, check_port, socket_address
import subprocess


# iterate through directory
path_to_files = "C:\\Users\\CMarroquin\\upload-tests\\upload-limit-6000\\fgh"

bf = Pennsieve("SODA-Pennsieve")

# for each file queue up the Pennsieve Agent with Upload
file_paths = []

for (dir, files, something) in os.walk(path_to_files):
    # join all files with absolute path 
    for file in files:
        file_paths.append(os.path.join(path_to_files, file))



# upload all of the files to the Pennsieve CLI individually
for file in file_paths:
    subprocess.run(["pennsieve", file, "--dataset", "N:dataset:b36df1dc-792f-45a3-a17d-bf811b91a1f8", "folder", "upload-testing"])

print("All files should be being queued now")


