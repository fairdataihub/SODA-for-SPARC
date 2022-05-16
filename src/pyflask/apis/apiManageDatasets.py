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

api = Namespace('manage_datasets', description='Routes for handling manage datsets functionality')

pennsieveAPIKeyAndSecret = api.model('PennsieveAPIKeyAndSecret', {
    "success": fields.String(required=True, description="Success or failure"), 
    "keys": fields.String(required=True, description="API key from the Pennsieve platform"),
    "secret": fields.String(required=True, description="Secret from the Pennsieve platform"), 
    "name": fields.String(required=True, description="Name of the user?"),
})


# TODO: Make error responses dynamic; cover all possible status codes
@api.route('')
class PennsieveAPIKeyAndSecret(Resource):
  @api.marshal_with(pennsieveAPIKeyAndSecret, False, 201)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Username or password are incorrect'})

  # get the self, email, password, keyname=SODA_SPARC_API_KEY from the request object 
  def get(self):
    return get_pennsieve_api_key_secret()


getNumberOfFilesAndFoldersLocally =  api.model('GetNumberOfFilesAndFoldersLocally', {
    "success": fields.String(required=True, description="Success or failure"),
    "totalFiles": fields.Integer(required=True, description="Total number of files in the dataset"),
    "totalDir": fields.Integer(required=True, description="Total number of folders in the dataset"),
})

@api.route('/get_number_of_files_and_folders_locally')
class GetNumberOfFilesAndFoldersLocally(Resource):
  @api.marshal_with( getNumberOfFilesAndFoldersLocally, False, 201)
  @api.doc(responses={500: 'There was an internal server error', 200: 'Success'})

  def get(self):
    return get_number_of_files_and_folders_locally()

