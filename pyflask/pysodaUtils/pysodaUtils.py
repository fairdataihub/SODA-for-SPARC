from pennsieve.api.agent import (
    agent_cmd,
    agent_cmd,
    AgentError,
    socket_address
)
import subprocess
from websocket import create_connection
import socket
import errno
import re
import sys


def clear_queue():

    command = [agent_cmd(), "upload-status", "--cancel-all"]

    return subprocess.run(command, check=True)


def agent_running():
    listen_port = 11235

    try:
        # x = "ws://127.0.0.1:11235"
        # create_connection(x).close()
        # CHANGE BACK
        create_connection(socket_address(listen_port)).close()

    except socket.error as e:

        if e.errno == errno.ECONNREFUSED:  # ConnectionRefusedError for Python 3
            return True
        else:
            raise e
    else:
        raise AgentError(
            "The Pennsieve agent is already running. Learn more about how to solve the issue <a href='https://docs.sodaforsparc.io/docs/common-errors/pennsieve-agent-is-already-running' target='_blank'>here</a>."
        )



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
    
    return subprocess.run(get_agent_installation_location(), check=True)


def get_agent_version():
    """
        Get the version of the Pennsieve agent installed on the computer.
    """
    if not check_agent_installation(): 
        raise FileNotFoundError("Pennsieve agent not installed. Please install the agent before running this function.")
    
    try:
        version = subprocess.check_output([get_agent_installation_location(), "version"], check=True, stderr=STDOUT)
    except Exception as e:
        raise e
    
    
    # decode the response 
    version = version.decode().strip()

    return version



forbidden_characters = '<>:"/\|?*'
def check_forbidden_characters(my_string):
    """
    Check for forbidden characters in file/folder name

    Args:
        my_string: string with characters (string)
    Returns:
        False: no forbidden character
        True: presence of forbidden character(s)
    """
    regex = re.compile(f"[{forbidden_characters}]")
    return regex.search(my_string) is not None or "\\" in r"%r" % my_string


forbidden_characters_bf = '\/:*?"<>'
def check_forbidden_characters_bf(my_string):
    """
    Check for forbidden characters in Pennsieve file/folder name

    Args:
        my_string: string with characters (string)
    Returns:
        False: no forbidden character
        True: presence of forbidden character(s)
    """
    regex = re.compile(f"[{forbidden_characters_bf}]")
    return regex.search(my_string) is not None or "\\" in r"%r" % my_string

