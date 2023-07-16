import boto3
import requests
from os.path import expanduser, join, exists
from configparser import ConfigParser
from flask import abort
from os import mkdir

from profileUtils import create_unique_profile_name

userpath = expanduser("~")
configpath = join(userpath, ".pennsieve", "config.ini")
PENNSIEVE_URL = "https://api.pennsieve.io"

from namespaces import NamespaceEnum, get_namespace_logger


def get_access_token(api_key=None, api_secret=None):
    """
    Creates a temporary access token for utilizing the Pennsieve API. Reads the api token and secret from the Pennsieve config.ini file.
    get cognito config . If no target profile name is provided the default profile is used. 
    """
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

    # use the default profile values for auth if no api_key or api_secret is provided
    if api_key is None or api_secret is None:
        api_key = get_profile_name_from_api_key("api_token")
        api_secret = get_profile_name_from_api_key("api_secret")




    login_response = cognito_idp_client.initiate_auth(
    AuthFlow="USER_PASSWORD_AUTH",
    AuthParameters={"USERNAME": api_key, "PASSWORD": api_secret},
    ClientId=cognito_app_client_id,
    )
        

    return login_response["AuthenticationResult"]["AccessToken"]


def get_cognito_userpool_access_token(email, password):
    """
    Creates a temporary access token for utilizing the Pennsieve API. Utilizes email and password to authenticate with the Pennsieve Cognito Userpool 
    which provides higher privileges than the API token and secret flow.
    """
    PENNSIEVE_URL = "https://api.pennsieve.io"

    try:
        response = requests.get(f"{PENNSIEVE_URL}/authentication/cognito-config")
        response.raise_for_status()
        cognito_app_client_id = response.json()["userPool"]["appClientId"]
        cognito_region = response.json()["userPool"]["region"]
        cognito_client = boto3.client(
            "cognito-idp",
            region_name=cognito_region,
            aws_access_key_id="",
            aws_secret_access_key="",
        )
    except Exception as e:
        raise Exception(e) from e

    try:
        login_response = cognito_client.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={"USERNAME": email, "PASSWORD": password},
            ClientId=cognito_app_client_id,
        )
    except Exception as e:
        abort(400, "Username or password was incorrect.")

    try:
        access_token = login_response["AuthenticationResult"]["AccessToken"]
        response = requests.get(
            f"{PENNSIEVE_URL}/user", headers={"Authorization": f"Bearer {access_token}"}
        )
        response.raise_for_status()
    except Exception as e:
        raise e

    return access_token

def get_profile_name_from_api_key(key):
    config = ConfigParser()
    config.read(configpath)
    if "global" not in config:
        raise Exception("Profile has not been set")

    keyname = config["global"]["default_profile"]

    if keyname in config and key in config[keyname]:
        return config[keyname][key]
    return None


def bf_delete_account(keyname):
    """
    Args:
        keyname: name of local Pennsieve account key (string)
    Action:
        Deletes account information from the Pennsieve config file
    """
    config = ConfigParser()
    config.read(configpath)
    config.remove_section(keyname)
    with open(configpath, "w") as configfile:
        config.write(configfile)

    

def bf_delete_default_profile():
    config = ConfigParser()
    config.read(configpath)

    if "global" not in config:
        return 
    
    default_profile_name = config["global"]["default_profile"]
    config.remove_section("global")

    with open(configpath, "w") as configfile:
        config.write(configfile)



def bf_add_account_username(keyname, key, secret):
    """
    Associated with 'Add account' button in 'Login to your Pennsieve account' section of SODA

    Args:
        keyname: Name of the account to be associated with the given credentials (string)
        key: API key (string)
        secret: API Secret (string)
    Action:
        Adds account to the Pennsieve configuration file (local machine)
    """

    temp_keyname = "SODA_temp_generated"
    # first delete the pre-existing default_profile entry , but not the profile itself 

    # lowercase the key name 
    keyname = keyname.lower()
    
    bf_delete_default_profile()
    try:
        keyname = keyname.strip()

        bfpath = join(userpath, ".pennsieve")
        # Load existing or create new config file
        config = ConfigParser()
        if exists(configpath):
            config.read(configpath)
        elif not exists(bfpath):
            mkdir(bfpath)

        # Add agent section
        agentkey = "agent"
        if not config.has_section(agentkey):
            config.add_section(agentkey)
            config.set(agentkey, "port", "9000")
            config.set(agentkey, "upload_workers", "10")
            config.set(agentkey, "upload_chunk_size", "32")


        # ensure that if the profile already exists it has an api_host entry 
        # if config.has_section(keyname):
        #     config.set(keyname, "api_host", PENNSIEVE_URL)

        # Add new account if it does not already exist
        if not config.has_section(keyname):
            config.add_section(keyname)


        config.set(keyname, "api_token", key)
        config.set(keyname, "api_secret", secret)
        # config.set(keyname, "api_host", PENNSIEVE_URL)

        # set profile name in global section
        if not config.has_section("global"):
            config.add_section("global")
            config.set("global", "default_profile", keyname)

        
        with open(configpath, "w") as configfile:
            config.write(configfile)

    except Exception as e:
        raise e

    # Check key and secret are valid, if not delete account from config
    try:
        token = get_access_token()
    except Exception as e:
        bf_delete_account(keyname)
        abort(401, 
            "Please check that key name, key, and secret are entered properly"
        )

    try:
        if not config.has_section("global"):
            config.add_section("global")

        default_acc = config["global"]
        default_acc["default_profile"] = keyname

        with open(configpath, "w+") as configfile:
            config.write(configfile)

        return {"message": f"Successfully added account {keyname}"}

    except Exception as e:
        bf_delete_account(keyname)
        raise e


def delete_duplicate_keys(token, keyname):
    try:
        PENNSIEVE_URL = "https://api.pennsieve.io"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }

        r = requests.get(f"{PENNSIEVE_URL}/token", headers=headers)
        r.raise_for_status()

        tokens = r.json()

        for token in tokens:
            if token["name"] == keyname:
                r = requests.delete(f"{PENNSIEVE_URL}/token/{token['key']}", headers=headers)
                r.raise_for_status()
    except Exception as e:
        raise e


def create_pennsieve_api_key_secret(email, password, machine_username_specifier):

    api_key = get_cognito_userpool_access_token(email, password)

    # TODO: Send in computer and profile of computer from frontend to this endpoint and use it in this function
    profile_name = create_unique_profile_name(api_key, machine_username_specifier)


    delete_duplicate_keys(api_key, "SODA-Pennsieve")
    delete_duplicate_keys(api_key, profile_name)


    url = "https://api.pennsieve.io/token/"

    payload = {"name": f"{profile_name}"}
    headers = {
        "Accept": "*/*",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    response = requests.request("POST", url, json=payload, headers=headers)
    response.raise_for_status()
    response = response.json()


    return { 
        "success": "success", 
        "key": response["key"], 
        "secret": response["secret"], 
        "name": profile_name
    }
