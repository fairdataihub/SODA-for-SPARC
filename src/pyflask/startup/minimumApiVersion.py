"""The version of the API should match the version in the package.json"""
import os


def get_api_version():
    """
    Returns the version of the API
    """

    # test comment
    return {'version': os.getenv('API_VERSION', "15.3.2-beta")}



