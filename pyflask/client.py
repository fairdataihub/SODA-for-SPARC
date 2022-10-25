from pennsieve2.pennsieve import Pennsieve
from os import path
import requests
import sys 
import subprocess
from subprocess import STDOUT
from os.path import exists 

# client = Pennsieve()
# client.user.switch('sodie')
# client.user.reauthenticate()
# client.useDataset("N:dataset:1cb4bf59-2b6d-48c9-8dae-88f722c6e328")



#local_ds = path.join(path.expanduser("~"), "Desktop", "DatasetTemplate")
# manifest = client.manifest.create(local_ds)

# PENNSIEVE_URL = "https://api.pennsieve.io"

# try:
#   r = requests.post(f"{PENNSIEVE_URL}/packages", headers={"Content-Type": "application/json", "Authorization": f"Bearer {client.getUser()['session_token']}",}, 
#                     json={
#                           "name": "caged", 
#                           "dataset": "N:dataset:c38eb185-39ef-426a-b636-b1b9b7b4283a", 
#                           "packageType": "collection", 
#                           "properties": [ { "key": "aa", "value": "Aahhh" }] 
#                           })
#   r.raise_for_status()
#   res = r.json()

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
        return "/usr/local/opt/pennsieve/bin/pennsieve"

    elif sys.platform.startswith("linux"):
        return "/usr/local/bin/pennsieve"

    elif sys.platform in ["win32", "cygwin"]:
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
    
    try:
        version = subprocess.run([get_agent_installation_location(), "version"], capture_output=True, check=True).stdout
    except Exception as e:
        raise e
    
    
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

try:
    get_agent_version()
except Exception as e:
    print(e)

    


