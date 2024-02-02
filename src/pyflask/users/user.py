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
from authentication import get_access_token, get_cognito_userpool_access_token, bf_add_account_username, delete_duplicate_keys, clear_cached_access_token
from profileUtils import create_unique_profile_name

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

# TODO: Add formage_agent_profile_name here or where appropriate in the new flow
def create_profile_name(machineUsernameSpecifier, email=None, password=None, token=None, organization_id=None):
    """
      Create a uniquely identifiable profile name for a user. This is used in the config.ini file to associate Pennsieve API Keys with a user and their selected workspace.
      NOTE: API Keys and Secrets are associated with a workspace at time of creation. Due to this we need to create a unqiue profile for each workspace a user has access to.
            The given organization id is used to associate the profile name with a given workspace. 
    """

    if token is None:
       # we are not logged in as the user we want to create a profile name for so get a cognito userpool token for the user 
       token = get_cognito_userpool_access_token(email, password)
       user_info = get_user_information(token)
       organization_id = user_info["preferredOrganization"]
       email_sub = email.split("@")[0]

       return format_agent_profile_name(f"soda-pennsieve-{machineUsernameSpecifier}-{email_sub}-{organization_id.lower()}")


    # get the users email 
    user_info = get_user_information(token)
    email = user_info["email"]

    # create a substring of the start of the email to the @ symbol
    email_sub = email.split("@")[0]

    organizations = get_user_organizations()
    organization = None
    for org in organizations["organizations"]:
        if org["organization"]["id"] == organization_id:
            organization = org["organization"]["name"]

    # create an updated profile name that is unique to the user and their workspace 
    return format_agent_profile_name(f"soda-pennsieve-{machineUsernameSpecifier}-{email_sub}-{organization.lower()}")
             

def set_default_profile(profile_name):
    """
      If the given profile exists and has a valid API Key and Secret set it as the default profile. 
    """
    # check if a valid token with this profile information already exists and use that if so rather than creating another api key and secret 
    ps_k_s = get_profile_api_key_and_secret(profile_name.lower())

    if ps_k_s[0] is None or ps_k_s[1] is None:
      raise Exception(f"No valid api key and secret found for profile {profile_name.lower()}")
    
    # verify that the keys are valid 
    get_access_token(ps_k_s[0], ps_k_s[1])

    # set the default profile to the profile name
    update_config_account_name(profile_name.lower())

def set_preferred_organization(organization_id, email, password, machine_username_specifier):

    # clear the currently cached access token so we can switch workspaces + check if the other workspace access API Key + Secret is valid
    clear_cached_access_token()

    token = get_cognito_userpool_access_token(email, password)

    try:
        # switch to the desired organization
        url = "https://api.pennsieve.io/session/switch-organization"
        headers = {"Accept": "*/*", "Content-Type": "application/json", "Accept-Encoding": "gzip, deflate, br", "Connection": "keep-alive", "Content-Length": "0"}
        url += f"?organization_id={organization_id}&api_key={token}"
        response = requests.request("PUT", url, headers=headers)
        response.raise_for_status()

    except Exception as err:
        new_err_msg = "It looks like you don't have access to your desired organization. An organization is required to upload datasets. Please reach out to the SPARC curation team (email) to get access to your desired organization and try again."
        raise Exception(new_err_msg) from err
    

    profile_name = create_unique_profile_name(token, machine_username_specifier)

    try: 
      set_default_profile(profile_name)
      return 
    except Exception as err:
      logger.info(f"Existing api key and secret for profile {profile_name} are invalid. Creating new api key and secret for profile {profile_name}")

    # the access token for the new workspace is invalid and therefore the cache needs to be cleared so we can store a new one
    clear_cached_access_token()

    # TODO: Determine where to move this and the below duplicate key deletion methods. Perhaps the bottom one stays and this one moves up before checking for existing keys. 
    # any users coming from versions of SODA < 12.0.2 will potentially have duplicate SODA-Pennsieve API keys on their Pennsieve profile we want to clean up for them
    delete_duplicate_keys(token, "SODA-Pennsieve")

    # for now remove the old api key and secret associated with this profile name if one already exists
    delete_duplicate_keys(token, profile_name)
    
    # get an api key and secret for programmatic access to the Pennsieve API
    url = "https://api.pennsieve.io/token/"

    payload = {"name": profile_name}
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
    
    # create the new profile for the user, associate the api key and secret with the profile, and set it as the default profile
    bf_add_account_username(profile_name, key, secret)


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