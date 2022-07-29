from pennsieve import Pennsieve
from flask import abort 
from utils import get_authenticated_ps




def integrate_orcid_with_pennsieve(access_code, pennsieve_account):
  """
  Given an OAuth access code link a user's ORCID ID to their Pennsieve account.
  This is required in order to publish a dataset for review with the SPARC Consortium.
  """

  if access_code == "" or access_code is None:
    abort(400, "Cannot integrate your ORCID iD to Pennsieve without an access code.")

  # verify Pennsieve account
  try:
    bf = Pennsieve(pennsieve_account)
  except Exception as e:
     abort(400, "Error: Please select a valid Pennsieve account")
    
  
  try:
    bf._api._post("/user/orcid", json={"authorizationCode":access_code})
  except Exception as e:
    print(e)
    abort(400, "Invalid access code")

  





def get_user(selected_account):
  """
  Get a user's information.
  """

  ps = get_authenticated_ps(selected_account)

  try:
    return ps._api._get("/user")
  except Exception as e:
    abort(500, e.response.json()["message"])