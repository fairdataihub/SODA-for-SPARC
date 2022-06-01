from http.client import HTTPException
from flask_restx import Namespace, Resource, fields, reqparse
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
from errorHandlers import notBadRequestException


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
successMessage = api.model('SuccessMessage', {
  'message': fields.String(required=True, description="A message indicating success of the operation."),
  })

# selected_bfaccount, selected_bfdataset, selected_status
parser = reqparse.RequestParser(bundle_errors=True)
parser.add_argument('selected_bfaccount', type=str, required=True, help='The selected bfaccount', location='json')
parser.add_argument('selected_bfdataset', type=str, required=True, help='The selected bfdataset id or name', location='json')
parser.add_argument('selected_status', type=str, required=True, help='The target status for the dataset', location='json')


@api.route('/bf_change_dataset_status')
class BfChangeDatasetStatus(Resource):
  @api.marshal_with(successMessage, False, 200)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'})
  # the request parameters
  @api.expect(parser)
  def put(self):
    # get the selected_bfaccount, selected_bfdataset, selected_status from the request object
    data = request.get_json()
    selected_bfaccount = data['selected_bfaccount']
    selected_bfdataset = data['selected_bfdataset']
    selected_status = data['selected_status']

    api.logger.info(f' bf_change_dataset_status --  args -- selected_bfaccount: {selected_bfaccount} selected_bfdataset: {selected_bfdataset} selected_status: {selected_status}')

    if selected_bfaccount is None or selected_bfdataset is None or selected_status is None:
      api.abort(400, "Cannot change dataset status without a selected_bfaccount, selected_bfdataset, and selected_status")

    try:
      return bf_change_dataset_status(selected_bfaccount, selected_bfdataset, selected_status)
    except Exception as e:
      # something unexpected happened so abort with a 500
      if notBadRequestException(e):
        api.abort(500, e.args[0])
      raise e


# TODO: Add rest of the boilerplate to this route
@api.route('/bf_account_list')
class BfAccountList(Resource):
  def get(self):
    try:
      return bf_account_list()
    except Exception as e:
      api.abort(500, e.args[0])


@api.route('/bf_default_account_load')
class BfDefaultAccountLoad(Resource):
  def get(self):
    try:
      return bf_default_account_load()
    except Exception as e:
      api.abort(500, e.args[0])

@api.route('/bf_get_users')
class BfGetUsers(Resource):
  def get(self):
    try:
      # get the selected account out of the request args
      selected_account = request.args.get('selected_account')
      return bf_get_users(selected_account)
    except Exception as e:
      api.abort(500, e.args[0])

@api.route('/bf_get_teams')
class BfGetTeams(Resource):
  def get(self):
    try:
      # get the selected account out of the request args
      selected_account = request.args.get('selected_account')
      return bf_get_teams(selected_account)
    except Exception as e:
      api.abort(500, e.args[0])

@api.route('/bf_account_details')
class BfAccountDetails(Resource):
  def get(self):
    try:
      # get the selected account out of the request args
      selected_account = request.args.get('selected_account')
      return bf_account_details(selected_account)
    except Exception as e:
      api.abort(500, e.args[0])