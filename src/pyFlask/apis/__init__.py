from flask_restx import Api
from .api_version import api as version_resource

api = Api(title="Pysoda API", version="5.4.0", description="SODA's API", terms_url="https://www.pysoda.com/terms", contact_url="https://www.pysoda.com/contact", contact_email="sodasparc@gmail.com", license="MIT", license_url="https://opensource.org/licenses/MIT")

api.add_namespace(version_resource)