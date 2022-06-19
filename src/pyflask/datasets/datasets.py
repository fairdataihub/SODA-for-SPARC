""""
Routes for performing operations on datasets
"""

from utils import get_authenticated_ps, get_dataset
from flask import abort


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




