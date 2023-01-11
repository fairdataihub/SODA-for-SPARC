from pennsieve2.pennsieve import Pennsieve
from os import path
import requests
import sys 
import subprocess
from subprocess import STDOUT
from os.path import exists 

import boto3
import requests
from os.path import expanduser, join
from configparser import ConfigParser

userpath = expanduser("~")
configpath = join(userpath, ".pennsieve", "config.ini")
PENNSIEVE_URL = "https://api.pennsieve.io"

def read_from_config(key):
    config = ConfigParser()
    config.read(configpath)
    if "global" not in config:
        raise Exception("Profile has not been set")

    keyname = config["global"]["default_profile"]

    if keyname in config and key in config[keyname]:
        return config[keyname][key]
    return None

def get_access_token():
    # get cognito config 
    r = requests.get(f"{PENNSIEVE_URL}/authentication/cognito-config")
    r.raise_for_status()

    cognito_app_client_id = r.json()["tokenPool"]["appClientId"]
    cognito_region_name = r.json()["region"]

    cognito_idp_client = boto3.client(
    "cognito-idp",
    region_name=cognito_region_name,
    aws_access_key_id="",
    aws_secret_access_key="",
    )
            
    login_response = cognito_idp_client.initiate_auth(
    AuthFlow="USER_PASSWORD_AUTH",
    AuthParameters={"USERNAME": read_from_config("api_token"), "PASSWORD": read_from_config("api_secret")},
    ClientId=cognito_app_client_id,
    )
        
    return login_response["AuthenticationResult"]["AccessToken"]

print(get_access_token())

# client = Pennsieve()
# client.user.switch('soda')
# client.user.reauthenticate()
# client.useDataset("N:dataset:8a2d765f-fa97-4e76-b534-deedb6757571")

PENNSIEVE_URL = "https://api.pennsieve.io"



def create_request_headers(ps):
    """
    Creates necessary HTTP headers for making Pennsieve API requests.
    Input: 
        ps: Pennsieve object for a user that has been authenticated
    """
    return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {ps.getUser()['session_token']}",
    }




def get_manifest_entry_id(m_id):

    # f = client.manifest.listFiles(manifest_id, entry_idx, 1)
    # fields = f.file
    # file_id = str(fields[0])[4:]
    # file_id = file_id.splitlines()[0]
    # return file_id.strip()

    # use a subprocess call to remove the first entry of the given manifest id
    r = subprocess.run(["pennsieve", "manifest", "list", f"{m_id}"], capture_output=True, check=True)
    out = r.stdout
    # print(list)
    out = out.decode().strip()
    # print(list)

    # search for the word STATUS in the list string
    status_idx = out.find("STATUS")

    # slice the string starting at the keyword STATUS to the end
    out = out[status_idx:]

    # iterate through the string until the first number is found
    for i in range(len(out)):
        if out[i].isdigit():
            out = out[i:]
            break
    

    # iterate through the string while the character is a digit
    for i in range(len(out)):
        if not out[i].isdigit():
            out = out[:i]
            break

    print(out)
    return out.strip()


def remove_manifest_entry(manifest_id, file_id):
    """
    Remove the first entry in the manifest. Necessary until the Pennsieve agent is updated to allow entering a target path 
    when creating a manifest file.
    """

    # turn the file_id into a list 
    # file_id = [file_id]
    
    # client.manifest.remove(manifest_id, file_id)
    print(file_id)

    # use a subprocess call to remove the first entry of the given manifest id
    r = subprocess.run(["pennsieve", "manifest", "remove", f"{manifest_id}", f"{file_id}"], capture_output=True)





# ids = get_manifest_entry_id(6, 0)
# print(type(ids))
# remove_manifest_entry(6, ids)


# r = requests.post(f"{PENNSIEVE_URL}/data/delete", headers=create_request_headers(client), json={"things": ["N:package:eaf433a5-ec64-456e-acd3-881ef2784ec3"]})
# r.raise_for_status()


# file_info = client.manifest.listFiles(6, 0, 1)
# print(file_info)
# print(type(file_info))
# print(file_info['file']['id'])

bytes_uploaded_per_file = {}
total_dataset_files = 2
files_uploaded = 0 
total_bytes_uploaded = 0 


def run_sb_stop_sub(events_dict):
    global files_uploaded
    global total_bytes_uploaded
    #print(evt_dict)

    if events_dict["type"] == 1:  # upload status: file_id, total, current, worker_id
        #logging.debug("UPLOAD STATUS: " + str(events_dict["upload_status"]))
        file_id = events_dict["upload_status"].file_id
        total_bytes_to_upload = events_dict["upload_status"].total
        current_bytes_uploaded = events_dict["upload_status"].current
        worker_id = events_dict["upload_status"].worker_id
        status = events_dict["upload_status"].status



        # get the previous bytes uploaded for the given file id - use 0 if no bytes have been uploaded for this file id yet
        previous_bytes_uploaded = bytes_uploaded_per_file.get(file_id, 0)

        # update the file id's current total bytes uploaded value 
        bytes_uploaded_per_file[file_id] = current_bytes_uploaded

        # calculate the additional amount of bytes that have just been uploaded for the given file id
        total_bytes_uploaded += current_bytes_uploaded - previous_bytes_uploaded

        # check if the given file has finished uploading
        if current_bytes_uploaded == total_bytes_to_upload:
            print("File uploaded")
            files_uploaded += 1
            # main_curation_uploaded_files += 1
            # namespace_logger.info("Files Uploaded: " + str(files_uploaded) + "/" + str(total_dataset_files))
            # namespace_logger.info("Total Bytes

        # check if the upload has finished
        if files_uploaded == total_dataset_files:
            print("Finished")
            # namespace_logger.info("Upload complete")
            # unsubscribe from the agent's upload messages since the upload has finished
            client.unsubscribe(10)




client = Pennsieve()
local_ds = path.join(path.expanduser("~"), "Desktop", "DatasetTemplate")
manifest = client.manifest.create("C:\\Users\\aaron\\upload_dis")
client.manifest.upload(manifest.manifest_id)

client.subscribe(10, False, run_sb_stop_sub)




# r = requests.post(f"{PENNSIEVE_URL}/packages", headers={"Content-Type": "application/json", "Authorization": f"Bearer {client.getUser()['session_token']}",}, 
#                 json={
#                     "name": "nested", 
#                     "dataset": "N:dataset:f36a6c0a-5deb-466e-b404-bab54bc112a1", 
#                     "packageType": "collection", 
#                     "parent": "N:collection:cb129b62-63d3-4db4-a747-064482be0594"
#                     })
# r.raise_for_status()
# res = r.json()

#   print(res)
# except Exception as e:
#   print(e)
#   print(e.response)


# client.manifest.upload(49)
# sub = client.subscribe(10)

# counter = 0
# end_counter = 1000
# msgs = []
# for msg in sub:
#     print(msg)
#     # print(dir(msg))
#     # print("Upload status: ", msg.upload_status)
#     # print("Event info", msg.event_info)
#     # print("Event type", msg.type)
#     # print('Descriptor: ', dir(msg.DESCRIPTOR))
#     # print("Event Response: ", dir(msg.EventResponse))
#     # print("Event response details: ", dir(msg.EventResponse.details))

#     current_bytes_uploaded = msg.upload_status.current 
#     total_bytes_to_upload = msg.upload_status.total

#     if total_bytes_to_upload != 0:
#         if msg.upload_status.total == msg.upload_status.current:
#             counter += 1
#             print(counter)
        

#         if counter == 4:
#             print("Unsubscribing")
#             client.unsubscribe(10)

# print("Done")






def get_agent_installation_location():
    """
        Get the location of the Pennsieve agent installation for Darwin, Linux, and Windows. 
    """
    if sys.platform == "darwin":
        return "/usr/local/bin/pennsieve"

    elif sys.platform.startswith("linux"):
        return "/usr/local/bin/pennsieve"

    elif sys.platform in ["win32", "cygwin"]:
        if exists("C:/Program Files (x86)/Pennsieve/pennsieve.exe"): 
            return "C:/Program Files (x86)/Pennsieve/pennsieve.exe"
        else:
            return "C:/Program Files/Pennsieve/pennsieve.exe"


def check_agent_installation():
    """
    Check if the Pennsieve agent is installed on the computer. 
    """
    return exists(get_agent_installation_location())
        


def start_agent():
    """
    Start the Pennsieve agent. IMP: Run if agent exists.
    """
    if not check_agent_installation(): 
        raise FileNotFoundError("Pennsieve agent not installed. Please install the agent before running this function.")
    
    command = [get_agent_installation_location(), "agent"]

    return subprocess.run(command, check=True)


def get_agent_version():
    """
        Get the version of the Pennsieve agent installed on the computer.
    """
    if not check_agent_installation(): 
        raise FileNotFoundError("Pennsieve agent not installed. Please install the agent before running this function.")
    

    version = subprocess.run([get_agent_installation_location(), "version"], capture_output=True, check=True).stdout

    
    
    # decode the response 
    version = version.decode().strip()

    return version


def agent_up_to_date():
    
    v = get_agent_version()
    
    # search string for 1.2.2
    # TODO: Improve agent version parsing to check for Agent Version and CLI Version separately. Both need to match.
    if "1.2.2" in v:
        print("Agent is up to date")
        return True
    else:
        print("Agent is not up to date")
        return False


# if check_agent_installation():
#     start_agent()



#     if not agent_up_to_date():
#         print("Please update the agent to the latest version.") # provide a link to the latest version of the agent
#     else:
#         print("Continuing to use the agent")

# else:
#     print("Agent not installed")

# try:
#     v = get_agent_version()
#     print(v)
# except Exception as e:
#     print(e)

    


