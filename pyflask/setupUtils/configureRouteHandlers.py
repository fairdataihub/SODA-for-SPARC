from apis import (
    manage_datasets_resource, 
    validate_dataset_resource, 
    curate_datasets_resource, 
    disseminate_datasets_resource, 
    prepare_metadata_resource, 
    organize_datasets_resource,
    startup_resource,
    # taxonomy_resource,
    user_resource,
    datasets_resource,
    collections_resource,
    skeleton_dataset_resource
)

def configureRouteHandlers(api):
    """
    Configure the route handlers for the Flask application.
    """
    # api.add_namespace(version_resource)
    api.add_namespace(manage_datasets_resource)
    api.add_namespace(validate_dataset_resource)
    api.add_namespace(curate_datasets_resource)
    api.add_namespace(disseminate_datasets_resource)
    api.add_namespace(prepare_metadata_resource)
    api.add_namespace(organize_datasets_resource)
    api.add_namespace(startup_resource)
    # api.add_namespace(taxonomy_resource)
    api.add_namespace(user_resource)
    api.add_namespace(datasets_resource)
    api.add_namespace(collections_resource)
    api.add_namespace(skeleton_dataset_resource)