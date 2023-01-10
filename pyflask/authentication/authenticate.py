import boto3
import requests
from os.path import expanduser, join
from configparser import ConfigParser

import time

userpath = expanduser("~")
configpath = join(userpath, ".pennsieve", "config.ini")
PENNSIEVE_URL = "https://api.pennsieve.io"

def get_access_token():
    print("Sending congitor request")
    # get cognito config 
    r = requests.get(f"{PENNSIEVE_URL}/authentication/cognito-config")
    r.raise_for_status()

    print("cognito request complete")

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



# get a target key's value from the config file 
def read_from_config(key):
    print("Reading from config")
    config = ConfigParser()
    config.read(configpath)
    if "global" not in config:
        print("Global not in config")
        raise Exception("Profile has not been set")

    keyname = config["global"]["default_profile"]

    if keyname in config and key in config[keyname]:
        return config[keyname][key]
    return None