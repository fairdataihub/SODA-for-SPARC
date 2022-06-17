from pennsieve import Pennsieve
from flask import abort 




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

  