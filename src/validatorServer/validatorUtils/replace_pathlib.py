# Purpose: Replace pathlib.py in anaconda3 environment with cpython's pathlib.py for python3.7
# Rationale: When tangling the validator within anaconda3, the pathlib.py module is overwritten with a backported version. It is buggy and does not work as expected.

target_file = '/home/anaconda3/envs/env-validator/lib/python3.7/pathlib.py'

# read contents from file
target_file_input = 'replace_pathlib.py'

# remove the contents of the target file
with open(target_file, 'w') as f:
    f.write('')

# place the contents of the source file into the target file
with open(target_file_input, 'r') as f:
    with open(target_file, 'a') as f2:
        for line in f:
            f2.write(line)



# use github api to get the pathlib.py file on branch 3.7
# url = "https://api.github.com/repos/python/cpython/git/trees/3.7?recursive=1"


# import requests
# resp = requests.get(url)
# print(resp.content)
