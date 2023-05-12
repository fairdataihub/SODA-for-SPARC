import requests
from os.path import join, expanduser, exists
from configparser import ConfigParser
from constants import PENNSIEVE_URL
from utils import (
    create_request_headers,
    connect_pennsieve_client,
    authenticate_user_with_client,
)
from namespaces import NamespaceEnum, get_namespace_logger
from flask import abort
from authentication import get_access_token, get_cognito_userpool_access_token, bf_add_account_username, bf_delete_account, bf_delete_default_profile

logger = get_namespace_logger(NamespaceEnum.USER)



def integrate_orcid_with_pennsieve(access_code, pennsieve_account):
  """
  Given an OAuth access code link a user's ORCID ID to their Pennsieve account.
  This is required in order to publish a dataset for review with the SPARC Consortium.
  """

  if access_code == "" or access_code is None:
    abort(400, "Cannot integrate your ORCID iD to Pennsieve without an access code.")

  # verify Pennsieve account
  try:
    ps = connect_pennsieve_client()
    authenticate_user_with_client(ps, pennsieve_account)
  except Exception as e:
     abort(400, "Error: Please select a valid Pennsieve account")
    
  
  try:
    jsonfile = {"authorizationCode": access_code}
    r = requests.post(f"{PENNSIEVE_URL}/user/orcid", json=jsonfile, headers=create_request_headers(ps))
    r.raise_for_status()

    return r.json()
  except Exception as e:
    # If status is 400 then the orcid is already linked to users account
    if r.status_code == 400:
      abort(409, "ORCID iD is already linked to your Pennsieve account.")
    abort(400, "Invalid access code")

  
def get_user(selected_account):
  """
  Get a user's information.
  """
  token = get_access_token()
  try:
    r = requests.get(f"{PENNSIEVE_URL}/user", headers=create_request_headers(token))
    r.raise_for_status()

    return r.json()
  except Exception as e:
    raise Exception(e) from e



def get_user_information(token):
  """
  Get a user's information from Pennsieve.
  """

  PENNSIEVE_URL = "https://api.pennsieve.io"

  headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}",
  }

  try:
    r = requests.get(f"{PENNSIEVE_URL}/user", headers=headers)    
    r.raise_for_status()    
    return r.json()
  except Exception as e:
    raise Exception(e) from e



def set_preferred_organization(organization, email, password, account_name):
    try:
        token = get_cognito_userpool_access_token(email, password)

        # get the organization id from the organization name 
        organizations = get_user_organizations()
        organization_id = None
        for org in organizations["organizations"]:
           if org["organization"]["name"] == organization:
                organization_id = org["organization"]["id"]
                break


        # switch to the desired organization
        url = "https://api.pennsieve.io/session/switch-organization"
        headers = {"Accept": "*/*", "Content-Type": "application/json", "Accept-Encoding": "gzip, deflate, br", "Connection": "keep-alive", "Content-Length": "0"}
        url += f"?organization_id={organization_id}&api_key={token}"
        logger.info(f"URL: {url}")
        response = requests.request("PUT", url, headers=headers)
        response.raise_for_status()

    except Exception as error:
        error = "It looks like you don't have access to your desired organization. An organization is required to upload datasets. Please reach out to the SPARC curation team (email) to get access to your desired organization and try again."
        raise Exception(error)
    

    # get an api key and secret for programmatic access to the Pennsieve API
    try:
        url = "https://api.pennsieve.io/token/"

        payload = {"name": "SODA-Pennsieve"}
        headers = {
            "Accept": "*/*",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }

        response = requests.request("POST", url, json=payload, headers=headers)
        response.raise_for_status()
        response = response.json()
       
        key =  response["key"]
        secret = response["secret"]
    except Exception as e:
        raise e
    

    # store the new api key for the current organization
    try:
      # remove the current default profile if one exists 
      bf_delete_default_profile()
    except Exception as e:
      raise e
    
    
    try:
      # get the users email 
      user_info = get_user_information(token)
      email = user_info["email"]

      # create a substring of the start of the email to the @ symbol
      email_sub = email.split("@")[0]

      # create an updated profile name that is unqiue to the user and their workspace 
      account_name = f"{account_name}-{email_sub}-{organization}"
             
    except Exception as e:
       raise e 
    
    try:
      # create the new profile for the user, associate the api key and secret with the profile, and set it as the default profile
      bf_add_account_username(account_name, key, secret)
    except Exception as e:
      raise e
    


def get_user_organizations():
  """
  Get a user's organizations.
  """
  try:
    token = get_access_token()
  except Exception as e:
     abort(400, "Please select a valid Pennsieve account")


  r = requests.get(f"{PENNSIEVE_URL}/organizations", headers=create_request_headers(token))
  r.raise_for_status()

  organizations_list = r.json()["organizations"]
  logger.info(organizations_list)
  
  return {"organizations": organizations_list}



userpath = expanduser("~")
configpath = join(userpath, ".pennsieve", "config.ini")
def update_config_account_name(accountname):
  if exists(configpath):
      config = ConfigParser()
      config.read(configpath)

  if not config.has_section("global"):
      config.add_section("global")
      config.set("global", "default_profile", accountname)
  else:
      config["global"]["default_profile"] = accountname

  with open(configpath, "w") as configfile:
      config.write(configfile)