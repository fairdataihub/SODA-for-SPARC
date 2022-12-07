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
from os.path import exists 
import os


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
        return "/usr/local/bin/pennsieve"

    elif sys.platform.startswith("linux"):
        return "/usr/local/bin/pennsieve"

    elif sys.platform in ["win32", "cygwin"]:
        win_path = os.path.normpath("C:\Program Files (x86)\Pennsieve\pennsieve.exe")
        if exists(win_path): 
            print("Path exists")
            return win_path
        else:
            print("Non x86 path path")
            return os.path.normpath("C:\Program Files\Pennsieve\pennsieve.exe")

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

    print(get_agent_installation_location())

    command = [get_agent_installation_location(), "agent"]

    print(command)

    return subprocess.run(command, check=True)


def get_agent_version():
    """
        Get the version of the Pennsieve agent installed on the computer.
    """
    # start the agent if it is not running
    start_agent()

    print("Agent started")

    command = [get_agent_installation_location(), "version"]

    version = ""

    while version.find("Error") != -1 or version == "":
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        version = result.stdout

        version = version.decode()

        print(version.find("Error"))

        print(version)
    
    # decode the response 
    version = version.strip()

    return { 'agent_version': version }


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

