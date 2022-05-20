from flask_restx import Namespace
from enum import Enum 


# namespaces enums
class NamespaceEnum(Enum):
    MANAGE_DATASETS = "manage_datasets"


# namespaces dictionary that is given a namespace name as a key and returns the corresponding namespace object as a value
namespaces = { }

def configure_namespaces():
    """
    Create namespaces for each pysoda file: pysoda, prepare_metadata, etc
    """
    manage_datasets_namespace = Namespace(NamespaceEnum.MANAGE_DATASETS, description='Routes for handling manage datsets functionality')
    namespaces[NamespaceEnum.MANAGE_DATASETS] = manage_datasets_namespace

def get_namespace(namespace_name):
    return namespaces[namespace_name]