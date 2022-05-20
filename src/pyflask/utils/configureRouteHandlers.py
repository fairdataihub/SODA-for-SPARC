from namespaces import get_namespace
from apis import manage_datasets_resource

def configureRouteHandlers(api):
    """
    Configure the route handlers for the Flask application.
    """
    # api.add_namespace(version_resource)
    api.add_namespace(manage_datasets_resource)
    print(api.namespaces)