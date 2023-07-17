import os

def get_api_version():
    """
    Returns the version of the API
    """ 
    return {'version': os.getenv('API_VERSION', "11.99.99")}
