from flask_restx import Namespace
from enum import Enum


# namespaces enums
class NamespaceEnum(Enum):
    MANAGE_DATASETS = "manage_datasets"
    # VALIDATE_DATASET = "validator"
    CURATE_DATASETS = "curate_datasets"
    DISSEMINATE_DATASETS = "disseminate_datasets"
    PREPARE_METADATA = "prepare_metadata"
    ORGANIZE_DATASETS = "organize_datasets"
    STARTUP = "startup"
    TAXONOMY = "taxonomy"
    USER = "user"
    DATASETS = "datasets"
    COLLECTIONS = "collections"
    SKELETON_DATASET = "skeleton_dataset"
    PYSODA_UTILS = "pysoda_utils"


# namespaces dictionary that is given a namespace name as a key and returns the corresponding namespace object as a value
namespaces = { }

def configure_namespaces():
    """
    Create namespaces for each pysoda file: pysoda ( now manage_datasets), prepare_metadata, etc
    """

    manage_datasets_namespace = Namespace(NamespaceEnum.MANAGE_DATASETS.value, description='Routes for handling manage datasets functionality')
    namespaces[NamespaceEnum.MANAGE_DATASETS] = manage_datasets_namespace

    # validate_dataset_namespace = Namespace(NamespaceEnum.VALIDATE_DATASET.value, description='Routes for handling validate dataset functionality')
    # namespaces[NamespaceEnum.VALIDATE_DATASET] = validate_dataset_namespace

    curate_datasets_namespace = Namespace(NamespaceEnum.CURATE_DATASETS.value, description='Routes for handling dataset curation')
    namespaces[NamespaceEnum.CURATE_DATASETS] = curate_datasets_namespace

    disseminate_datasets_namespace = Namespace(NamespaceEnum.DISSEMINATE_DATASETS.value, description='Routes for handling dataset dissemination')
    namespaces[NamespaceEnum.DISSEMINATE_DATASETS] = disseminate_datasets_namespace

    prepare_metadata_namespace = Namespace(NamespaceEnum.PREPARE_METADATA.value, description='Routes for handling metadata preparation')
    namespaces[NamespaceEnum.PREPARE_METADATA] = prepare_metadata_namespace

    organize_datasets_namespace = Namespace(NamespaceEnum.ORGANIZE_DATASETS.value, description='Routes for handling dataset organization')
    namespaces[NamespaceEnum.ORGANIZE_DATASETS] = organize_datasets_namespace

    organize_datasets_namespace = Namespace(NamespaceEnum.STARTUP.value, description='Routes for handling python server startup verification')
    namespaces[NamespaceEnum.STARTUP] = organize_datasets_namespace

    taxonomy_namespace = Namespace(NamespaceEnum.TAXONOMY.value, description='Routes for handling taxonomy functionality')
    namespaces[NamespaceEnum.TAXONOMY] = taxonomy_namespace

    user_namespace = Namespace(NamespaceEnum.USER.value, description='Routes for handling user functionality')
    namespaces[NamespaceEnum.USER] = user_namespace

    datasets_namespace = Namespace(NamespaceEnum.DATASETS.value, description='Routes for handling dataset functionality')
    namespaces[NamespaceEnum.DATASETS] = datasets_namespace

    collections_namespace = Namespace(NamespaceEnum.COLLECTIONS.value, description='Routes for handling collections')
    namespaces[NamespaceEnum.COLLECTIONS] = collections_namespace

    skeleton_dataset_namespace = Namespace(NamespaceEnum.SKELETON_DATASET.value, description='Routes for creating skeleton datasets used for Validation')
    namespaces[NamespaceEnum.SKELETON_DATASET] = skeleton_dataset_namespace

    pysoda_utils_namespace = Namespace(NamespaceEnum.PYSODA_UTILS.value, description='Utility functions for pysoda')
    namespaces[NamespaceEnum.PYSODA_UTILS] = pysoda_utils_namespace



def get_namespace(namespace_name):
    return namespaces[namespace_name]