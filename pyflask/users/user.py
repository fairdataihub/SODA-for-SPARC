import requests
from os.path import join, expanduser, exists
from configparser import ConfigParser
from configUtils import format_agent_profile_name
from constants import PENNSIEVE_URL
from utils import (
    create_request_headers,
    connect_pennsieve_client,
    authenticate_user_with_client,
    get_profile_api_key_and_secret
)
from namespaces import NamespaceEnum, get_namespace_logger
from flask import abort
from profileUtils import create_unique_profile_name
from authentication import get_access_token, get_cognito_userpool_access_token, bf_add_account_username, delete_duplicate_keys, clear_cached_access_token, create_profile_name


logger = get_namespace_logger(NamespaceEnum.USER)



def integrate_orcid_with_pennsieve(access_code):
  """
  Given an OAuth access code link a user's ORCID ID to their Pennsieve account.
  This is required in order to publish a dataset for review with the SPARC Consortium.
  """

  if access_code == "" or access_code is None:
    abort(400, "Cannot integrate your ORCID iD to Pennsieve without an access code.")

  token = get_access_token()
    
  try:
    jsonfile = {"authorizationCode": access_code}
    r = requests.post(f"{PENNSIEVE_URL}/user/orcid", json=jsonfile, headers=create_request_headers(token))
    r.raise_for_status()

    return r.json()
  except Exception as e:
    # If status is 400 then the orcid is already linked to users account
    if r.status_code == 400:
      abort(409, "ORCID iD is already linked to your Pennsieve account.")
    abort(400, "Invalid access code")

  
def get_user():
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






           

def set_default_profile(profile_name):
    """
      If the given profile exists and has a valid API Key and Secret set it as the default profile. 
    """
    # check if a valid token with this profile information already exists and use that if so rather than creating another api key and secret 
    ps_k_s = get_profile_api_key_and_secret(profile_name.lower())
    logger.info(f"Existing api key and secret for profile {profile_name.lower()}: {ps_k_s}")

    if ps_k_s[0] is None or ps_k_s[1] is None:
      raise Exception(f"No valid api key and secret found for profile {profile_name.lower()}")
    
    # verify that the keys are valid 
    get_access_token(ps_k_s[0], ps_k_s[1])

    # set the default profile to the profile name
    update_config_account_name(profile_name.lower())
    logger.info(f"Reused existing valid api key and secret for profile {profile_name}") 

def set_preferred_organization(organization_id, email, password, machine_username_specifier):

    token = get_cognito_userpool_access_token(email, password)

    try:
        # switch to the desired organization
        url = "https://api.pennsieve.io/session/switch-organization"
        headers = {"Accept": "*/*", "Content-Type": "application/json", "Accept-Encoding": "gzip, deflate, br", "Connection": "keep-alive", "Content-Length": "0"}
        url += f"?organization_id={organization_id}&api_key={token}"
        logger.info(f"URL: {url}")
        response = requests.request("PUT", url, headers=headers)
        response.raise_for_status()

    except Exception as err:
        new_err_msg = "It looks like you don't have access to your desired organization. An organization is required to upload datasets. Please reach out to the SPARC curation team (email) to get access to your desired organization and try again."
        raise Exception(new_err_msg) from err
    

  
    formatted_profile_name = create_profile_name(machine_username_specifier, email, password, token, organization_id)

    logger.info(f"Switched to organization {organization_id}")
    logger.info(f"New profile name: {formatted_profile_name}") 

    try: 
      set_default_profile(formatted_profile_name)
      return 
    except Exception as err:
      logger.info(f"Existing api key and secret for profile {formatted_profile_name} are invalid. Creating new api key and secret for profile {formatted_profile_name}")

    # TODO: Determine where to move this and the below duplicate key deletion methods. Perhaps the bottom one stays and this one moves up before checking for existing keys. 
    # any users coming from versions of SODA < 12.0.2 will potentially have duplicate SODA-Pennsieve API keys on their Pennsieve profile we want to clean up for them
    delete_duplicate_keys(token, "SODA-Pennsieve")

    # for now remove the old api key and secret associated with this profile name if one already exists
    delete_duplicate_keys(token, formatted_profile_name)
    
    # get an api key and secret for programmatic access to the Pennsieve API
    url = "https://api.pennsieve.io/token/"

    payload = {"name": formatted_profile_name}
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

    
    try:
      # create the new profile for the user, associate the api key and secret with the profile, and set it as the default profile
      bf_add_account_username(formatted_profile_name, key, secret)
    except Exception as e:
      raise e
    
    # clear the cached access token 
    clear_cached_access_token()


    






userpath = expanduser("~")
configpath = join(userpath, ".pennsieve", "config.ini")
def update_config_account_name(accountname):
  # format the keyname to lowercase and replace '.' with '_'
  formatted_account_name = format_agent_profile_name(accountname)

  if exists(configpath):
      config = ConfigParser()
      config.read(configpath)

  if not config.has_section("global"):
      config.add_section("global")
      config.set("global", "default_profile", formatted_account_name)
  else:
      config["global"]["default_profile"] = formatted_account_name

  with open(configpath, "w") as configfile:
      config.write(configfile)