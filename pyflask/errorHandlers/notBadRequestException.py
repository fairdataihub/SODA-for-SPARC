import requests 


# expand this to include HTTPErrors that are 5xxs as we now catch Pennsieve 500s and raise them as a specific error that we do not want the calles to overwrite witha  generic 500
# alternatively expand the calle in some way to check for badRequests, then 500s from service we communicate with, then an unepxected error on our side last 
def notBadRequestException(exception):
    """
    Check if the exception is a generic exception.
    """
    if type(exception) == requests.exceptions.HTTPError:
        return exception.response.status_code != 401
    return type(exception).__name__ not in ['BadRequest', 'Forbidden', 'Unauthorized']


