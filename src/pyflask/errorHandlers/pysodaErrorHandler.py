from pysoda.utils import (
    PennsieveAccountInvalid,
    PennsieveActionNoPermission,
    PennsieveAgentError,
    PropertyNotSetError,
    FailedToFetchPennsieveDatasets,
    EmptyDatasetError,
    LocalDatasetMissingSpecifiedFiles,
    PennsieveDatasetFilesInvalid,
    GenerateOptionsNotSet,
    PennsieveDatasetCannotBeFound,
    PennsieveUploadException,
    PennsieveDatasetNameTaken,
    ConfigProfileNotSet,
    GenericUploadError,
    PennsieveDatasetNameInvalid
)

def handlePysodaErrors(e, api):
    """
    Handle errors related to the Pysoda application.
    """
    if isinstance(e, PennsieveAccountInvalid):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(400, str(e))
    if isinstance(e, PennsieveActionNoPermission):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(400, str(e))
    if isinstance(e, PennsieveAgentError):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(500, str(e))
    if isinstance(e, PropertyNotSetError):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(400, str(e))
    if isinstance(e, FailedToFetchPennsieveDatasets):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(500, str(e))
    if isinstance(e, EmptyDatasetError):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(400, str(e))
    if isinstance(e, LocalDatasetMissingSpecifiedFiles):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(400, str(e))
    if isinstance(e, PennsieveDatasetFilesInvalid):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(400, str(e))
    if isinstance(e, GenerateOptionsNotSet):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(400, str(e))
    if isinstance(e, PennsieveDatasetCannotBeFound):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(400, str(e))
    if isinstance(e, PennsieveUploadException):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(500, str(e))
    if isinstance(e, PennsieveDatasetNameTaken):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(400, str(e))
    if isinstance(e, ConfigProfileNotSet):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(400, str(e))
    if isinstance(e, GenericUploadError):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(500, str(e))
    if isinstance(e, PennsieveDatasetNameInvalid):
        # Handle OSError separately
        api.logger.info("Error message details: ", str(e))
        api.abort(400, str(e))