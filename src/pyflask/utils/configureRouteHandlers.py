from apis import manage_datasets_resource, validate_dataset_resource, curate_datasets_resource, disseminate_datasets_resource

def configureRouteHandlers(api):
    """
    Configure the route handlers for the Flask application.
    """
    # api.add_namespace(version_resource)
    api.add_namespace(manage_datasets_resource)
    api.add_namespace(validate_dataset_resource)
    api.add_namespace(curate_datasets_resource)
    api.add_namespace(disseminate_datasets_resource)
    print(api.namespaces)