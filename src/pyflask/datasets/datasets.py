""""
Routes for performing operations on datasets
"""

from flask import abort
import requests

from utils import get_authenticated_ps, get_dataset
from authentication import get_access_token


PENNSIEVE_URL = "https://api.pennsieve.io"

def get_role(pennsieve_account, dataset_name_or_id):
  ps = get_authenticated_ps(pennsieve_account)

  myds = get_dataset(ps, dataset_name_or_id)

  try:
    role =  ps._api._get(f"/datasets/{myds.id}/role")["role"]
    return {"role": role}
  except Exception as e:
    if type(e).__name__ == "HTTPError":
      abort(400, e.response.json()["message"])
    abort(500, "An internal server error prevented the request from being fulfilled. Please try again later.")






def get_dataset_by_id(dataset_id):

  token = get_access_token()

  headers = {
      "Accept": "*/*",
      "Content-Type": "application/json",
      "Authorization": f"Bearer {token}"
  }

  r = requests.put(f"{PENNSIEVE_URL}/datasets/{dataset_id}", headers=headers)

  # TODO: log r.text and r.status_code

  r.raise_for_status()

  return r.json()




