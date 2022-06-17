from pennsieve import Pennsieve
from flask import abort

def get_authenticated_ps(pennsieve_account):
    """
    Returns an authenticated pennsieve client object given a Pennsieve account name
    """
    try:
        ps = Pennsieve(pennsieve_account)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve account")

    return ps