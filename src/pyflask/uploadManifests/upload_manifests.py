import math
import re 
from pennsieve2 import Pennsieve
from namespaces import NamespaceEnum, get_namespace_logger


namespace_logger = get_namespace_logger(NamespaceEnum.UPLOAD_MANIFESTS)

def get_verified_files_count(manifest_id, total_files):
    """
    Get the number of verified files in an upload manifest. For a file to be verified its status must be 
    one of the following: VERIFIED | FAILED | FINALIZED.
    """

    global namespace_logger
    namespace_logger.info(f"Getting the number of verified files in the manifest with id: {manifest_id}")

    ps = Pennsieve()
    ps.manifest.sync(manifest_id)

    offset = 0
    limit = 1000
    while True:
        file_page = ps.manifest.list_files(manifest_id, offset, limit)
        # regular expression that searches and counts for every string that has "status: VERIFIED|status: FAILED|status: FINALIZED" in the string
        new_files = len(re.findall(r'status: VERIFIED|status: FAILED|status: FINALIZED', str(file_page)))
        remaining_files += new_files

        # If the number of files returned is less than the limit, we've reached the last page
        if new_files < limit:
            break

        # Otherwise, increment the offset by the limit and continue to the next page
        offset += limit

    return remaining_files


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