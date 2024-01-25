from .configureNamespaces import  namespaces

def get_namespace_logger(namespace_name):
    "Retrieve the attached logger for a specific namespace. Valid namespaces are those within the NamespaceEnum class"
    try:
        return namespaces[namespace_name].logger
    except KeyError:
        # TODO: General log that we tried to access a namespace that does not exist
        # By default this should send back a 500 error to the user since this will raise an uncaught exception that crashes the server
        # program should stop if we are accessing a namespace that does not exist
        raise KeyError(f"Invalid namespace name: {namespace_name}")
