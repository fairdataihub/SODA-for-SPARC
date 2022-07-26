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
            "The Pennsieve agent is already running. Learn more about how to solve the issue <a href='https://github.com/bvhpatel/SODA/wiki/The-Pennsieve-agent-is-already-running' target='_blank'>here</a>."
        )


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

    
def bf_dataset_size():
    """
    Function to get storage size of a dataset on Pennsieve
    """
    global bf
    global myds

    try:
        selected_dataset_id = myds.id
        bf_response = bf._api._get(f"/datasets/{str(selected_dataset_id)}")
        return bf_response["storage"] if "storage" in bf_response.keys() else 0
    except Exception as e:
        raise e
