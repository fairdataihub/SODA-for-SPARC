import requests 
from werkzeug.exceptions import InternalServerError, ServiceUnavailable, HTTPException, BadRequest, Unauthorized, Forbidden, Locked, NotFound

def httpError(exception):
    """
    Check if the exception is an HTTP Error and not a generic Python Exception.
    """
    # NOTE: Currently only look for HTTP type errors from requests and Werkzeug. 
    print(type(exception))
    return type(exception) in [requests.exceptions.HTTPError, InternalServerError, ServiceUnavailable, HTTPException, BadRequest, Unauthorized, Forbidden, Locked, NotFound]