import os

def get_api_version():
    """
    Returns the version of the API
    """
    return {'version': os.getenv('API_VERSION', "13.2.0-beta")}
