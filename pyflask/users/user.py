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
from pennsieve2.pennsieve import Pennsieve
from authentication import get_access_token

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



def set_preferred_organization(organization_id):
    try:
        url = "https://api.pennsieve.io/session/switch-organization"

        querystring = {
            "organization_id": organization_id
        }

        token = get_access_token()

        response = requests.put(url, headers=create_request_headers(token), params=querystring)

        response = requests.get(
            f"{PENNSIEVE_URL}/user", headers={"Authorization": f"Bearer {api_key}"}
        )
        response.raise_for_status()
        response = response.json()

        if "preferredOrganization" in response:
            if response["preferredOrganization"] != organization_id:
                error = "It looks like you don't have access to your desired organization. Please reach out to the SPARC curation team (email) to get access to the SPARC workspace and try again."
                raise Exception(error)
        else:
            error = "It looks like you don't have access to your desired organization. This is required to upload datasets. Please reach out to the SPARC curation team (email) to get access to the SPARC workspace and try again."
            raise Exception(error)
    except Exception as error:
        error = "It looks like you don't have access to your desired organization. This is required to upload datasets. Please reach out to the SPARC curation team (email) to get access to the SPARC workspace and try again."
        raise Exception(error)
    


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
  orgs = []
  logger.info(organizations_list)
  for organization in organizations_list:
    orgs.append(organization["organization"]["name"])

  return {"organizations": orgs}



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