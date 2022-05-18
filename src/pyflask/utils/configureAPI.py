from os import getenv 
# import API from flask_restx
from flask_restx import Api

def configureAPI(app):
    api = Api(app, title="Pysoda API", version=getenv("API_VERSION"), description="SODA's API", terms_url="https://www.pysoda.com/terms", contact_url="https://www.pysoda.com/contact", contact_email="sodasparc@gmail.com", license="MIT", license_url="https://opensource.org/licenses/MIT")
    return api