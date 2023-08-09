"""
Purpose: Given a base excetpion, requests Exception, or Werkzeug Exception, return a user friendly message back to the client. 
"""
from werkzeug.exceptions import HTTPException, InternalServerError, Forbidden, Unauthorized, BadRequest, Locked
from .pennsieveUnexpectedError import raiseUnexpectedPennsieveException
from .httpError import httpError


# keys: status_code, method, resource=None
# error_message_table = {
#     "400": {

#     }
    
# }


def handle_error(err):
    # check if the exception is a requests HTTP error
    # in these cases we want to raise a new error with a user friendly message - these will be generic but the extra detail doesn't help them anyways
    # IMP: We log the errors here so we can see what is going on
    if httpError(err):
        # check the status code of the exception
        status_code = err.response.status_code
        if status_code == 400:
            # raise this error to the client
            raise err
        # check if the status code is a 401 
        elif status_code == 401:
            # check the method of the request 
            if err.request.method == "GET":
                # create a new error message with the text 'Not authorized to access this resource. Please try again later.'
                raise Unauthorized("Not authorized to access this resource. Please try again after verifying your credentials with Pennsieve.") from err
            # check if the method of the request is a POST
            elif err.request.method in ["POST", "PUT", "PATCH", "DELETE"]:
                raise Unauthorized("Not authorized to modify this resource. Please try again after verifying your credentials with Pennsieve.") from err
        # check if the status code is a 403
        elif status_code == 403:
            # check the method of the request 
            if err.request.method == "GET":
                # create a new error message with the text 'Not authorized to access this resource. Please try again later.'
                raise Forbidden("You do not have permission to access this resource.") from err
            # check if the method of the request is a POST
            elif err.request.method in ["POST", "PUT", "PATCH", "DELETE"]:
                raise Forbidden("You do not have permission to modify this resource.") from err
        # check if the status code is a 404
        elif status_code == 404:
            # check the method of the request 
            # IMP: Send back a 400 as a 404 raised from Flask treats the 404 as if the SODA server route does not exist and not the Pennsieve resource
            # create a new error message with the text 'Not authorized to access this resource. Please try again later.'
            raise BadRequest("The requested resource does not exist.") from err
        # check if the status code is a 423
        elif status_code == 423:
            # check the method of the request 
            if err.request.method == "GET":
                # create a new error message with the text 'Not authorized to access this resource. Please try again later.'
                raise Locked("The requested resource is currently locked.") from err
            # check if the method of the request is a POST
            elif err.request.method in ["POST", "PUT", "PATCH", "DELETE"]:
                raise Locked("The requested resource is currently locked for modification.") from err
        # status code is a 5xx [ TODO: Confirm as this is a big assumption ]
        else:
            raiseUnexpectedPennsieveException(err)
            # if it wasn't one of the expected Pennsieve errors, raise the error directly 
            raise err
    elif isinstance(err, HTTPException):
        # raise werkzeug exceptions as is since these are our custom errors that are already translated for 400s, 401s, etc 
        raise err
    else:
        # the exception is an unexpected generic Python error from a flaw in our code
        raise InternalServerError("SODA for SPARC received an unexpected error while trying to process your request. Please try again later.") from err



