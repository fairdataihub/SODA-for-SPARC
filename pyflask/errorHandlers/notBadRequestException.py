import requests 

def notBadRequestException(exception):
    """
    Check if the exception is a generic exception.
    """
    if type(exception) == requests.exceptions.HTTPError:
        return exception.response.status_code != 401
    return type(exception).__name__ not in ['BadRequest', 'Forbidden', 'Unauthorized']

