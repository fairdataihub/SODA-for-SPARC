import requests
from os.path import join, expanduser, exists
from configparser import ConfigParser


# def integrate_orcid_with_pennsieve(access_code, pennsieve_account):
#   """
#   Given an OAuth access code link a user's ORCID ID to their Pennsieve account.
#   This is required in order to publish a dataset for review with the SPARC Consortium.
#   """

#   if access_code == "" or access_code is None:
#     abort(400, "Cannot integrate your ORCID iD to Pennsieve without an access code.")

#   # verify Pennsieve account
#   try:
#     bf = Pennsieve(pennsieve_account)
#   except Exception as e:
#      abort(400, "Error: Please select a valid Pennsieve account")
    
  
#   try:
#     bf._api._post("/user/orcid", json={"authorizationCode":access_code})
#   except Exception as e:
#     print(e)
#     abort(400, "Invalid access code")

  
# def get_user(selected_account):
#   """
#   Get a user's information.
#   """

#   ps = get_authenticated_ps(selected_account)

#   try:
#     return ps._api._get("/user")
#   except Exception as e:
#     abort(500, e.response.json()["message"])



def get_user_information(token):
  """
  Get a user's information from Pennsieve.
  """

  PENNSIEVE_URL = "https://api.pennsieve.io"

  headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }

  r = requests.get(f"{PENNSIEVE_URL}/user", headers=headers)

  r.raise_for_status()

  return r.json()



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