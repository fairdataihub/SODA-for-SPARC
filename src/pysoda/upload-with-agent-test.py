import os
from pennsieve import Pennsieve
from pennsieve.log import get_logger
from pennsieve.api.agent import agent_cmd
from pennsieve.api.agent import AgentError, check_port, socket_address
import subprocess
from subprocess import Popen, PIPE, STDOUT


# iterate through directory
path_to_files = "/Users/aaronm/temp-datasets/5000"

# for each file queue up the Pennsieve Agent with Upload
file_paths = []


for root, dirs, files in os.walk(path_to_files, topdown=True):
    # join all files with absolute path
    for file in files:
        file_paths.append(os.path.normpath(os.path.join(path_to_files, file)))


altered_paths = []
for file in file_paths:
    # add string characters to each element
    altered_paths.append(file)

# upload all of the files to the Pennsieve CLI individually
a = altered_paths[0:500]

# print(a)

b = "N:dataset:b36df1dc-792f-45a3-a17d-bf811b91a1f8"
c = "upload-testing"

# print(a)

try:
    sub = subprocess.Popen(
        ["pennsieve", "upload", *a, "--dataset", b, "--folder", c],
        stdout=PIPE,
        stdin=PIPE,
    )
    sub.communicate(input=b"y")[0]
except Exception as e:
    print("Exception")
    print(e)


print("All files should be being queued now")
