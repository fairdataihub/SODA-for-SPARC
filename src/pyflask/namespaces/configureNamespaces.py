from flask_restx import Namespace

namespaces = []

def configure_namespaces():
    """
    Create namespaces and their loggers.
    """
    manage_datasets_namespace = Namespace('manage_datasets', description='Routes for handling manage datsets functionality')
    namespaces.append(manage_datasets_namespace)

def get_namespace():
    print("get namespaces called value of namespaces: ", namespaces[0])
    return namespaces[0]