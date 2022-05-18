from flask_restx import Api
from apis import (version_resource, manage_datasets_resource)
from os import getenv

def configureRouteHandlers(api):
    api.add_namespace(version_resource)
    api.add_namespace(manage_datasets_resource)