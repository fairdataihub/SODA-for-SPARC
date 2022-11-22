from pennsieve2.pennsieve import Pennsieve
from os import path
import requests
import sys 
import subprocess
from subprocess import STDOUT
from os.path import exists 

client = Pennsieve()
client.user.switch('soda')
client.user.reauthenticate()
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




def get_manifest_entry_id(manifest_id, entry_idx):

    f = client.manifest.listFiles(manifest_id, entry_idx, 1)
    fields = f.file
    file_id = str(fields[0])[4:]
    file_id = file_id.splitlines()[0]
    return file_id.strip()


def remove_manifest_entry(manifest_id, file_id):
    """
    Remove the first entry in the manifest. Necessary until the Pennsieve agent is updated to allow entering a target path 
    when creating a manifest file.
    """

    # turn the file_id into a list 
    file_id = [file_id]
    
    client.manifest.remove(manifest_id, file_id)


ids = get_manifest_entry_id(6, 0)
print(type(ids))
remove_manifest_entry(6, ids)


# r = requests.post(f"{PENNSIEVE_URL}/data/delete", headers=create_request_headers(client), json={"things": ["N:package:eaf433a5-ec64-456e-acd3-881ef2784ec3"]})
# r.raise_for_status()


# file_info = client.manifest.listFiles(6, 0, 1)
# print(file_info)
# print(type(file_info))
# print(file_info['file']['id'])




#local_ds = path.join(path.expanduser("~"), "Desktop", "DatasetTemplate")
# manifest = client.manifest.create(local_ds)




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

    


