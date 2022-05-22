import logging
from flask_restx import Namespace, Resource, fields

from manageDatasets import ( 
    get_pennsieve_api_key_secret, 
    get_number_of_files_and_folders_locally,
    submit_dataset_progress,
    bf_add_account_api_key,
    bf_add_account_username,
    bf_account_list,
    bf_dataset_account,
    bf_account_details,
    bf_submit_dataset,
    bf_new_dataset_folder,
    bf_rename_dataset,
    bf_add_permission,
    bf_get_users,
    bf_get_permission,
    bf_get_teams,
    bf_add_permission_team,
    bf_add_subtitle,
    bf_get_subtitle,
    bf_get_description,
    bf_add_description,
    bf_get_banner_image,
    bf_add_banner_image,
    bf_get_license,
    bf_add_license,
    bf_get_dataset_status,
    bf_change_dataset_status,
    bf_default_account_load,
    get_username,
    check_agent_install,
    SODA_SPARC_API_KEY,
    bf_submit_dataset_upload_details
)
from namespaces import get_namespace, NamespaceEnum
# import the request object
from flask import request


# TODO: Cover all possible status codes for each route


##--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## -----------------------------------------------------------------Begin manage_datasets endpoints ------------------------------------------------------------------------
##--------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# retrieve the manage datasets namespace to add the (previously known as) pysoda.py routes to
api = get_namespace(NamespaceEnum.MANAGE_DATASETS)


# the model for the pennsieve api key secret endpoint defines what is returned from the endpoint
pennsieveAPIKeyAndSecret = api.model('PennsieveAPIKeyAndSecret', {
    "success": fields.String(required=True, description="Success or failure"), 
    "keys": fields.String(required=True, description="API key from the Pennsieve platform"),
    "secret": fields.String(required=True, description="Secret from the Pennsieve platform"), 
    "name": fields.String(required=True, description="Name of the user?"),
})


# the parser for the pennsieve and api key secret endpoint defines the parameters that are accepted in the request
parser = api.parser()
parser.add_argument('username', type=str, required=True, help='Username of the user')
parser.add_argument('password', type=str, required=True, help='Password of the user')
parser.add_argument('api_key', type=str, required=True, help='API key from the Pennsieve platform')



@api.route('/pennsieve_api_key_secret')
class PennsieveAPIKeyAndSecret(Resource):
  # the response object
  @api.marshal_with(pennsieveAPIKeyAndSecret, False, 201)
  # response types/codes
  @api.doc(responses={500: 'There was an internal server error', 400: 'Username or password are incorrect'})
  # the request parameters
  @api.expect(parser)

  # get the self, email, password, keyname=SODA_SPARC_API_KEY from the request object 
  def get(self):
    return get_pennsieve_api_key_secret()






getNumberOfFilesAndFoldersLocally =  api.model('FilesAndFolders', {
    "totalFiles": fields.Integer(required=True, description="Total number of files in the dataset"),
    "totalDir": fields.Integer(required=True, description="Total number of folders in the dataset"),
})

parser = api.parser()
# parameters for the get_number_of_files_and_folders_locally endpoint
parser.add_argument('filepath', type=str, required=True, help='Path to the local dataset folder')

@api.route('/get_number_of_files_and_folders_locally')
class GetNumberOfFilesAndFoldersLocally(Resource):
  @api.marshal_with( getNumberOfFilesAndFoldersLocally, False, 200)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'})
  # the request parameters
  @api.expect(parser)

  def get(self):
    # get the filepath from the request object
    filepath = request.args.get('filepath')
    api.logger.info(f' get_number_of_files_and_folders_locally --  args -- filepath: {filepath}')

    if filepath is None:
      api.abort(400, "Cannot get number of files and folders locally without a filepath")

    try:
      return get_number_of_files_and_folders_locally(filepath)
    except Exception as e:
      api.abort(500, e.args[0])
    






## the model for the submit_dataset_progress endpoint defines what is returned from the endpoint
