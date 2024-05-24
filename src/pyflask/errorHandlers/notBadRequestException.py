import requests 

def notBadRequestException(exception):
    """
    Check if the exception is a generic exception.
    """
    if type(exception) == requests.exceptions.HTTPError:
        return exception.response.status_code not in [400, 401, 403, 423, 404]
    return type(exception).__name__ not in ['BadRequest', 'Forbidden', 'Unauthorized', 'NotFound', 'Conflict']

