"""
Purpose: Given a base excetpion, requests Exception, or Werkzeug Exception, return a user friendly message back to the client. 
"""
from werkzeug.exceptions import HTTPException, InternalServerError, Forbidden, Unauthorized, BadRequest, Locked
from .pennsieveUnexpectedError import raiseUnexpectedPennsieveException
from .httpError import httpError
from namespaces import NamespaceEnum, get_namespace_logger


# TODO: Get a more specific logger for this module 
error_handler_logger = get_namespace_logger(NamespaceEnum.CURATE_DATASETS)


def get_resource_name(err):
    """
    Precondition: Given a requests HTTP Error spawned from a call to the Pennsieve API
    Return: The requested resource in the URL. 
    """
    url = err.request.url

    # if url has '/publication/request' in it, then we know the resource is a publication
    if "/publication/request" in url:
        return "publication_request"



def handle_error(err):
    # check if the exception is a requests HTTP error
    # in these cases we want to raise a new error with a user friendly message - these will be generic but the extra detail doesn't help them anyways
    # IMP: We log the errors here so we can see what is going on


    if httpError(err):
        # log the requests error 
        error_handler_logger.error(err, exc_info=True)
        # check the status code of the exception
        status_code = err.response.status_code
        if status_code == 400:
            resource = get_resource_name(err)
            if resource == "publication_request" and err.request.method == "POST":
                raise BadRequest("Ensure the publication type is valid and that the embargo release date is no more than a year out.")
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
        error_handler_logger.error(err, exc_info=True)
        # raise werkzeug exceptions as is since these are our custom errors that are already translated for 400s, 401s, etc 
        raise err
    else:
        # base exceptions are automatically logged by Flask
        if type(err).__name__  == 'InvalidDataDeliverablesDocument':
            raise BadRequest(str(err)) from err
        # TODO: Increase specificity to botocore to avoid overlaps
        if type(err).__name__ == "NotAuthorizedException":
            raise BadRequest("Invalid username or password or invalid api key and secret. Please try again after reconnecting your account with Pennsieve through SODA for SPARC.") from err
        # the exception is an unexpected generic Python error from a flaw in our code
        raise InternalServerError("SODA for SPARC received an unexpected error while trying to process your request. Please try again later.") from err



