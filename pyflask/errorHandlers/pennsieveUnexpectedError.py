import requests.exceptions 
from werkzeug.exceptions import InternalServerError, ServiceUnavailable

# NOTE: For now we do not make API requests anywhere but Pennsieve. If we change that this needs to be modified to take the URL into account. 
def service_is_down(requestsException):
    # indicates the server is down or did not respond in time 
    return type(requestsException) in [requests.exceptions.ConnectionError, requests.exceptions.Timeout] or (requestsException.response and requestsException.response.statuse_code and requestsException.response.status_code in [503, 504])


def service_500_error(requestsException):
    # indicates the server is up but the request was not processed correctly
    return requestsException.response and requestsException.response.statuse_code and requestsException.response.status_code in [500, 501, 502, 505, 506, 507, 508, 510, 511]


def raisePennsieveDownError(error):
    """
      Check if Pennsieve is down and raise a specific error for the client if it is. 
    """

    # indicates the server is down or did not respond in time 
    # there is variation between  a timeout and a service being unavailable but for our purposes we can treat them the same
    raise InternalServerError("Pennsieve services are not responding to SODA for SPARC at this time. It is possible certain services have become temporarily unavailable. Please try again later.") from error
    
    
def raisePennsieveUnexpectedError(error):
    """
      Check if the given error is a Pennsieve 5xx error and raise a specific error for the client if it is.
    """
    # there is variation between the types of 500s we can get from Pennsieve but for our purposes we can treat them all the same way
    raise InternalServerError("SODA for SPARC received an unexpected error from Pennsieve while trying to process your request. Please try again later.") from error


def raiseUnexpectedPennsieveException(error):
    """
        Raises a new Exception with text explaining there was difficulty communicating with Pennsieve or that the Pennsieve API faced an unexpected error
        if one of the following is true: 
            1. The error is a ConnectionError or Timeout
            2. The error is a 5xx error
        Does nothing otherwise and the given exception can be handled in some other way in the calling code. 
    """
    if service_is_down(error):
        raisePennsieveDownError(error)
    if service_500_error(error):
        raisePennsieveUnexpectedError(error)



