from os import getenv 
# import API from flask_restx
from flask_restx import Api

def configureAPI():
    return Api(version=getenv("API_VERSION"), title="Pysoda API", description="SODA's API")
