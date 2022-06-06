from flask_restx import Resource, fields, reqparse
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



@api.route('/pennsieve_api_key_secret')
class PennsieveAPIKeyAndSecret(Resource):

  # the parser for the pennsieve and api key secret endpoint defines the parameters that are accepted in the request
  parser = reqparse.RequestParser(bundle_errors=True)
  parser.add_argument('username', type=str, required=True, help='Username of the user')
  parser.add_argument('password', type=str, required=True, help='Password of the user')
  parser.add_argument('api_key', type=str, required=True, help='API key from the Pennsieve platform')

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

# parser = api.parser()
# parameters for the get_number_of_files_and_folders_locally endpoint



@api.route('/get_number_of_files_and_folders_locally')
class GetNumberOfFilesAndFoldersLocally(Resource):

  parser = reqparse.RequestParser(bundle_errors=True)
  parser.add_argument('filepath', type=str, required=True, help='Path to the local dataset folder')

  @api.marshal_with( getNumberOfFilesAndFoldersLocally, False, 200)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'})
  # the request parameters
  @api.expect(parser)

  def get(self):
    # get the filepath from the request object
    data = self.parser.parse_args(strict=True)
    filepath = data['filepath']

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




@api.route('/bf_change_dataset_status')
class BfChangeDatasetStatus(Resource):


  # selected_bfaccount, selected_bfdataset, selected_status
  parser_change_dataset_status = reqparse.RequestParser(bundle_errors=True)
  parser_change_dataset_status.add_argument('selected_bfaccount', type=str, required=True, help='The selected bfaccount.', location='json')
  parser_change_dataset_status.add_argument('selected_bfdataset', type=str, required=True, help='The selected bfdataset id or name.', location='json')
  parser_change_dataset_status.add_argument('selected_status', type=str, required=True, help='The target status for the dataset.', location='json')

  @api.marshal_with(successMessage, False, 200)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Change the status of a dataset.")
  # the request parameters
  @api.expect(parser_change_dataset_status)
  def put(self):
    # get the selected_bfaccount, selected_bfdataset, selected_status from the request object
    data = self.parser_change_dataset_status.parse_args(strict=True)
    selected_bfaccount = data['selected_bfaccount']
    selected_bfdataset = data['selected_bfdataset']
    selected_status = data['selected_status']

    api.logger.info(f' bf_change_dataset_status --  args -- selected_bfaccount: {selected_bfaccount} selected_bfdataset: {selected_bfdataset} selected_status: {selected_status}')

    try:
      return bf_change_dataset_status(selected_bfaccount, selected_bfdataset, selected_status)
    except Exception as e:
      # something unexpected happened so abort with a 500
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e







account_list_model = api.model('AccountList', {
  'accounts': fields.List(fields.String, required=True, description="List of the user's accounts"),
  })

@api.route('/bf_account_list')
class BfAccountList(Resource):
  @api.marshal_with(account_list_model, False, 200)
  @api.doc(responses={500: 'There was an internal server error'}, description="Returns a list of the user's accounts stored in the system.")
  def get(self):
    try:
      return bf_account_list()
    except Exception as e:
      api.abort(500, str(e))







default_account_model = api.model('DefaultAccount', {
  'defaultAccounts': fields.List(fields.String,required=True, description="The default account"),
})

@api.route('/bf_default_account_load')
class BfDefaultAccountLoad(Resource):
  @api.marshal_with(default_account_model, False, 200)
  @api.doc(responses={500: 'There was an internal server error'}, description="Returns the first valid account as the default account. Usually SODA-Pennsieve.")
  def get(self):
    try:
      return bf_default_account_load()
    except Exception as e:
      api.abort(500, str(e))







users_response_model = api.model('Users', {
  'users': fields.List(fields.String, required=True, description="List of the accounts in the user's organization."),
})



@api.route('/bf_get_users')
class BfGetUsers(Resource):

  parser_get_users = reqparse.RequestParser(bundle_errors=True)
  parser_get_users.add_argument('selected_account', type=str, required=True, location='args', help='The account to get associated users for.')


  @api.marshal_with(users_response_model, False, 200)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Returns a list of the users in the given Pennsieve Account's organization.")
  @api.expect(parser_get_users)
  def get(self):
    try:
      # get the selected account out of the request args
      data = self.parser_get_users.parse_args()

      selected_account = data.get('selected_account')

      return bf_get_users(selected_account)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e







model_bf_get_teams_response = api.model('BfGetTeamsResponse', {'teams': fields.List(fields.String, required=True, description="List of the teams in the user's organization.")})
@api.route('/bf_get_teams')
class BfGetTeams(Resource):

  parser_get_teams = reqparse.RequestParser(bundle_errors=True)
  parser_get_teams.add_argument('selected_account', type=str, required=True, location='args', help='The target account to retrieve inter-organization teams for.')

  @api.marshal_with(model_bf_get_teams_response, False, 200)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Returns a list of the teams in the given Pennsieve Account's organization.")
  def get(self):
    try:
      # get the selected account out of the request args
      selected_account = self.parser_get_teams.parse_args().get('selected_account')
      
      return bf_get_teams(selected_account)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e






model_account_details_response = api.model('AccountDetailsResponse', {
  'account_details': fields.String(required=True, description="The email and organization for the given Pennsieve account."),
})

@api.route('/bf_account_details')
class BfAccountDetails(Resource):

  parser_account_details = reqparse.RequestParser(bundle_errors=True)
  parser_account_details.add_argument('selected_account', type=str, required=True, location='args', help='The target account to retrieve details for.')

  @api.marshal_with(model_account_details_response, False, 200)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Returns the email and organization for the given Pennsieve account.")
  @api.expect(parser_account_details)
  def get(self):
    try:
      # get the selected account out of the request args
      selected_account = self.parser_account_details.parse_args().get('selected_account')
      return bf_account_details(selected_account)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e







model_pennsieve_agent_response = api.model('PennsieveAgentResponse', {
  'agent_version': fields.String(required=True, description="The version number of the installed Pennsieve Agent."),
})

@api.route('/check_agent_install')
class CheckAgentInstall(Resource):
  @api.marshal_with(model_pennsieve_agent_response, False, 200)
  @api.doc(responses={500: 'There was an internal server error', 400: "Pennsieve Agent is not installed"}, description="Returns the Pennsieve Agent version if it is installed.")
  def get(self):
    from pennsieve.api.agent import AgentError
    try:
      return check_agent_install()
    except Exception as e:
      # if the exception is an AgentError, then return a 500 
      if isinstance(e, AgentError):
        api.abort(400, str(e))
      api.abort(500, str(e))








model_account_dataset = api.model('AccountDataset', {
  'id': fields.String(required=True, description="The UUID of the dataset."),
  'name': fields.String(required=True, description="The name of the dataset for the given Pennsieve account."),
  'role': fields.String(required=True, description="The dataset account's role for the dataset"),
})

model_account_datasets_list_response = api.model('AccountDatasetsResponse', {
  'datasets': fields.List(fields.Nested(model_account_dataset), required=True, description="List of the datasets in the user's organization."),
})


@api.route('/bf_dataset_account')
class BfDatasetAccount(Resource):

  parser_dataset_account = reqparse.RequestParser(bundle_errors=True)
  parser_dataset_account.add_argument('selected_account', type=str, required=True, location='args', help='The target account to retrieve datasets for.')

  @api.marshal_with(model_account_datasets_list_response, False, 200)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Returns a list of the datasets the given Pennsieve account has access to.")
  @api.expect(parser_dataset_account)
  def get(self):
    try:
      # get the selected account out of the request args
      selected_account = self.parser_dataset_account.parse_args().get('selected_account')
      return bf_dataset_account(selected_account)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e




model_get_dataset_subtitle_response = api.model('GetDatasetSubtitleResponse', {
  'subtitle': fields.String(required=True, description="The subtitle for the given dataset."),
})


@api.route('/bf_dataset_subtitle')
class DatasetSubtitle(Resource):

  parser_dataset_subtitle = reqparse.RequestParser(bundle_errors=True)
  parser_dataset_subtitle.add_argument('selected_account', type=str, required=True, location='args', help='The target account to retrieve the dataset subitle for.')
  parser_dataset_subtitle.add_argument('selected_dataset', type=str, required=True, location='args', help='The name or id of the dataset to retrieve the subtitle for.')


  @api.marshal_with(model_get_dataset_subtitle_response, False, 200)
  def get(self):
    data = self.parser_dataset_subtitle.parse_args()

    selected_account = data.get('selected_account')
    selected_dataset = data.get('selected_dataset')

    try:
      return bf_get_subtitle(selected_account, selected_dataset)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e

  # parser_add_dataset_subtitle = parser_dataset_subtitle.copy()
  # parser_add_dataset_subtitle.add_argument('input_subtitle', type=str, required=True, location='form', help='The subtitle to add to the dataset.')

  # def put(self): 
  #   # update the dataset subtitle for the selected account and dataset ID
  #   data = self.parser_add_dataset_subtitle.parse_args()

  #   selected_account = data.get('selected_account')
  #   selected_dataset = data.get('selected_dataset')
  #   input_subtitle = data.get('input_subtitle')

  #   try:
  #     return bf_add_subtitle(selected_account, selected_dataset, input_subtitle)
  #   except Exception as e:
  #     if notBadRequestException(e):
  #       api.abort(500, str(e))
  #     raise e