from flask_restx import Api
from .apiVersion import api as version_resource
from .apiManageDatasets import api as manage_datasets_resource
from os import getenv

api = Api(title="Pysoda API", version=getenv("API_VERSION"), description="SODA's API", terms_url="https://www.pysoda.com/terms", contact_url="https://www.pysoda.com/contact", contact_email="sodasparc@gmail.com", license="MIT", license_url="https://opensource.org/licenses/MIT")

api.add_namespace(version_resource)
api.add_namespace(manage_datasets_resource)
