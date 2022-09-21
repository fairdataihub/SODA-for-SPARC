import os

def get_api_version():
    """
    Returns the version of the API
    """
    return {'version': os.getenv('API_VERSION', "9.2.0")}

