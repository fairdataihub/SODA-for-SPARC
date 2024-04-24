from pennsieve2 import Pennsieve

from namespaces import NamespaceEnum, get_namespace_logger

namespace_logger = get_namespace_logger(NamespaceEnum.UPLOAD_MANIFESTS)

def get_verified_files_count(manifest_id):
    """
    Get the number of verified files in an upload manifest. For a file to be verified its status must be 
    one of the following: VERIFIED | FAILED | FINALIZED.
    """

    global namespace_logger
    namespace_logger.info(f"Getting the number of verified files in the manifest with id: {manifest_id}")

    return 0 


def get_upload_manifest_ids():
    """
    Get the ids of all upload manifests that have been initiated.
    """

    global namespace_logger
    namespace_logger.info("Getting the ids of all upload manifests that have been initiated")

    return []


def get_file_paths_by_status(manifest_id, status):
    """
    Get the files in an upload manifest that have a specific status.
    """

    global namespace_logger
    namespace_logger.info(f"Getting the files in the manifest with id: {manifest_id} that have the status: {status}")

    return []