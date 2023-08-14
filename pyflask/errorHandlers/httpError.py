import requests 
from werkzeug.exceptions import InternalServerError, ServiceUnavailable, HTTPException, BadRequest, Unauthorized, Forbidden, Locked, NotFound

def httpError(exception):
    """
    Check if the exception is an HTTP Error from Werkzeug or requests and not a generic Python Exception.
    """
    # NOTE: Currently only look for HTTP type errors from requests and Werkzeug. 
    return type(exception) in [requests.exceptions.HTTPError]