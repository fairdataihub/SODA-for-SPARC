from flask_restx import Resource, fields, reqparse
from manageDatasets import ( 
    get_number_of_files_and_folders_locally,
    submit_dataset_progress,
    bf_add_account_api_key,
    bf_account_list,
    bf_dataset_account,
    bf_account_details,
    bf_submit_dataset,
    create_new_dataset,
    ps_rename_dataset,
    ps_add_permission,
    ps_get_users,
    ps_get_permission,
    ps_get_teams,
    ps_add_permission_team,
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
    # check_agent_install,
    SODA_SPARC_API_KEY,
    update_dataset_readme,
    get_dataset_readme,
    get_dataset_tags,
    update_dataset_tags,
    scale_image
)

from pysodaUtils import get_agent_version, start_agent
import time 

from namespaces import get_namespace, NamespaceEnum
from errorHandlers import notBadRequestException, handle_http_error
from authentication import get_cognito_userpool_access_token, bf_add_account_username, create_pennsieve_api_key_secret


##--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## -----------------------------------------------------------------Begin manage_datasets endpoints ------------------------------------------------------------------------
##--------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# retrieve the manage datasets namespace to add the (previously known as) pysoda.py routes to
api = get_namespace(NamespaceEnum.MANAGE_DATASETS)


# the model for the pennsieve api key secret endpoint defines what is returned from the endpoint
pennsieveAPIKeyAndSecret = api.model('PennsieveAPIKeyAndSecret', {
    "success": fields.String(required=True, description="Success or failure"), 
    "key": fields.String(required=True, description="API key from the Pennsieve platform"),
    "secret": fields.String(required=True, description="Secret from the Pennsieve platform"), 
    "name": fields.String(required=True, description="Name of the user?"),
})



@api.route('/pennsieve_api_key_secret')
class PennsieveAPIKeyAndSecret(Resource):

  # the parser for the pennsieve and api key secret endpoint defines the parameters that are accepted in the request
  api_key_parser = reqparse.RequestParser(bundle_errors=True)
  api_key_parser.add_argument('username', type=str, required=True, help='Username of the user', location="json")
  api_key_parser.add_argument('password', type=str, required=True, help='Password of the user', location="json")
  api_key_parser.add_argument('machine_username_specifier', type=str, required=True, help='The machine username specifier', location="json")

  # the response object
  @api.marshal_with(pennsieveAPIKeyAndSecret, False, 201)
  # response types/codes
  @api.doc(responses={500: 'There was an internal server error', 400: 'Username or password are incorrect'})
  # the request parameters
  @api.expect(api_key_parser)
  # get the self, email, password, keyname=SODA_SPARC_API_KEY from the request object 
  def post(self):
    # get the request parameters
    args = self.api_key_parser.parse_args()
    # get the username, password, and api key from the request object
    username = args.get('username')
    password = args.get('password')
    machine_username_specifier = args.get('machine_username_specifier')

    try: 
      results = create_pennsieve_api_key_secret(username, password, machine_username_specifier)
      return results
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e





getNumberOfFilesAndFoldersLocally =  api.model('FilesAndFolders', {
    "totalFiles": fields.Integer(required=True, description="Total number of files in the dataset"),
    "totalDir": fields.Integer(required=True, description="Total number of folders in the dataset"),
})

@api.route('/get_number_of_files_and_folders_locally')
class GetNumberOfFilesAndFoldersLocally(Resource):

  files_folders_parser = reqparse.RequestParser(bundle_errors=True)
  files_folders_parser.add_argument('filepath', type=str, required=True, help='Path to the local dataset folder', location="args")

  @api.marshal_with( getNumberOfFilesAndFoldersLocally, False, 200)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'})
  # the request parameters
  @api.expect(files_folders_parser)
  def get(self):
    # get the filepath from the request object
    data = self.files_folders_parser.parse_args()
    filepath = data.get('filepath')

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

model_status_options = api.model('StatusOptions', {
  'id': fields.String(required=True, description="The id of the dataset"),
  'name': fields.String(required=True, description="The name of the dataset"),
  'displayName': fields.String(required=True, description="The display name of the dataset"),
  'color': fields.String(required=True, description="The color of the dataset"),
  'inUse': fields.Boolean(required=True, description="Whether the dataset is in use"),
})

model_get_dataset_status_response = api.model('GetDatasetStatusResponse', {
  'status_options': fields.List(fields.Nested(model_status_options), required=True, description="The status of the dataset"),
  "current_status": fields.String(required=True, description="The current status of the dataset"),
})

@api.route('/bf_dataset_status')
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


  parser_dataset_status = reqparse.RequestParser(bundle_errors=True)
  
  parser_dataset_status.add_argument('selected_account', type=str, required=True, help='The selected bfaccount.', location='args')
  parser_dataset_status.add_argument('selected_dataset', type=str, required=True, help='The selected bfdataset id or name.', location='args')

  @api.marshal_with(model_get_dataset_status_response, False, 200)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Get the status of a dataset and available statuses.")
  @api.expect(parser_dataset_status)
  def get(self):

    # get the selected_bfaccount, selected_bfdataset from the request object
    data = self.parser_dataset_status.parse_args()
    selected_bfaccount = data.get('selected_account')
    selected_bfdataset = data.get('selected_dataset')

    try:
      return bf_get_dataset_status(selected_bfaccount, selected_bfdataset)
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
  @api.doc(responses={500: 'There was an internal server error', 401: "Invalid api key and secret"}, description="Returns a list of the user's accounts stored in the system.")
  def get(self):
    try:
      return bf_account_list()
    except Exception as e:
      # TODO: Refine error handling
      if notBadRequestException(e):
        api.abort(500, str(e))
      api.abort(401, str(e))
      







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

@api.route('/ps_get_users')
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

      return ps_get_users(selected_account)
    except Exception as e:
      # TODO: Refine this app wide to handle requests errors more appropriately
      if notBadRequestException(e):
        api.abort(500, str(e))
      api.abort(401, str(e))






@api.route('/ps_get_teams')
class BfGetTeams(Resource):

  parser_get_teams = reqparse.RequestParser(bundle_errors=True)
  parser_get_teams.add_argument('selected_account', type=str, required=True, location='args', help='The target account to retrieve inter-organization teams for.')

  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Returns JSON containing the teams for the given Pennsieve account.")
  def get(self):
    try:
      # get the selected account out of the request args
      selected_account = self.parser_get_teams.parse_args().get('selected_account')
      
      return ps_get_teams(selected_account)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e






model_account_details_response = api.model('AccountDetailsResponse', {
  'email': fields.String(required=True, description="The email and organization for the given Pennsieve account."),
  "organization": fields.String(required=True, description="The organization id for the given Pennsieve account."),
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
    try:
      return get_agent_version()
    except Exception as e:
      # if the exception is an AgentError, then return a 500 
      api.abort(500, str(e))








model_account_dataset = api.model('AccountDataset', {
  'id': fields.String(required=True, description="The UUID of the dataset."),
  'name': fields.String(required=True, description="The name of the dataset for the given Pennsieve account."),
  'role': fields.String(required=True, description="The dataset account's role for the dataset"),
  'intId': fields.Integer(required=True, description="The integer ID of the dataset. Once a dataset is published to Pennsieve this is the only ID that can be used to reference the dataset."),
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
  @api.expect(parser_dataset_subtitle)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Returns the subtitle for the given dataset.")
  def get(self):
    data = self.parser_dataset_subtitle.parse_args()

    selected_account = data.get('selected_account')
    selected_dataset = data.get('selected_dataset')

    try:
      return bf_get_subtitle(selected_account, selected_dataset)
    except Exception as e:
      # if exception is an HTTPError then check if 400 or 500
      if type(e).__name__ == "HTTPError":
        handle_http_error(e)
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e

  parser_add_dataset_subtitle = parser_dataset_subtitle.copy()
  parser_add_dataset_subtitle.add_argument('input_subtitle', type=str, required=True, location='json', help='The subtitle to add to the dataset.')

  @api.marshal_with(successMessage, False, 200)
  @api.expect(parser_add_dataset_subtitle)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request', 403: 'Forbidden'}, description="Adds a subtitle to the given dataset.")
  def put(self): 
    # update the dataset subtitle for the selected account and dataset ID
    data = self.parser_add_dataset_subtitle.parse_args()

    selected_account = data.get('selected_account')
    selected_dataset = data.get('selected_dataset')
    input_subtitle = data.get('input_subtitle')

    try:
      return bf_add_subtitle(selected_account, selected_dataset, input_subtitle)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e







model_get_dataset_description_response = api.model('GetDatasetDescriptionResponse', {
  'description': fields.String(required=True, description="The description for the given dataset."),
})

@api.route('/bf_dataset_description')
class DatasetDescription(Resource):
  
    parser_dataset_description = reqparse.RequestParser(bundle_errors=True)
    parser_dataset_description.add_argument('selected_account', type=str, required=True, location='args', help='The target account to retrieve the dataset description for.')
    parser_dataset_description.add_argument('selected_dataset', type=str, required=True, location='args', help='The name or id of the dataset to retrieve the description for.')

    @api.marshal_with(model_get_dataset_description_response, False, 200)
    @api.expect(parser_dataset_description)
    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Returns the description for the given dataset.")
    def get(self):
      data = self.parser_dataset_description.parse_args()
      selected_account = data.get('selected_account')
      selected_dataset = data.get('selected_dataset')

      try:
        return bf_get_description(selected_account, selected_dataset)
      except Exception as e:
        if notBadRequestException(e):
          api.abort(500, str(e))
        raise e


    parser_add_dataset_description = parser_dataset_description.copy()
    parser_add_dataset_description.add_argument('input_description', type=str, required=True, location='json', help='The description to add to the dataset.')

    @api.marshal_with(successMessage, False, 200)
    @api.expect(parser_add_dataset_description)
    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request', 403: 'Forbidden'}, description="Adds a description to the given dataset.")
    def put(self):
      # update the dataset description for the selected account and dataset ID
      data = self.parser_add_dataset_description.parse_args()

      selected_account = data.get('selected_account')
      selected_dataset = data.get('selected_dataset')
      input_description = data.get('input_description')

      try:
        return bf_add_description(selected_account, selected_dataset, input_description)
      except Exception as e:
        if notBadRequestException(e):
          api.abort(500, str(e))
        raise e







model_get_permissions_team = api.model('GetPermissionsTeam', {
  'team_id': fields.String(required=True, description="The name of the team."),
  'team_role': fields.String(required=True, description="The role of the team."),
})

model_get_permissions_response = api.model('GetPermissionsResponse', {
  'permissions': fields.List(fields.String, required=True, description="A list of the users/organizations/teams and their roles (viewer, manager, owner, etc) for the given dataset."),
  'team_ids': fields.List(fields.Nested(model_get_permissions_team), required=True, description="A list of the team ids for the given dataset."),
})

@api.route('/bf_dataset_permissions')
class DatasetPermissions(Resource):
  parser_dataset_permissions = reqparse.RequestParser(bundle_errors=True)
  parser_dataset_permissions.add_argument('selected_account', type=str, required=True, location='args', help='The target account to retrieve the dataset permissions for.')
  parser_dataset_permissions.add_argument('selected_dataset', type=str, required=True, location='args', help='The name or id of the dataset to retrieve the permissions for.')

 
  @api.marshal_with(model_get_permissions_response, False, 200)
  @api.expect(parser_dataset_permissions)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Returns the permissions for the given dataset. Permissions are a list of the users/organizations/teams and their roles (viewer, manager, owner, etc) for the given dataset. Format: ['organization: org_name, role: viewer', 'user: username, role: manager]")
  def get(self):
    data = self.parser_dataset_permissions.parse_args()

    selected_account = data.get('selected_account')
    selected_dataset = data.get('selected_dataset')

    try:
      return ps_get_permission(selected_account, selected_dataset)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e

  
  parser_add_dataset_permissions = parser_dataset_permissions.copy()
  parser_add_dataset_permissions.add_argument('scope', type=str, required=True, location='args', help='Defines who or what will have their permissions for the dataset changed. Options are: team or user.')
  parser_add_dataset_permissions.add_argument('input_role', type=str, required=True, location='json', help='The permissions to add to the dataset. Can be either: owner, manager, viewer, remove current permissions.')
  parser_add_dataset_permissions.add_argument('name', type=str, required=True, location='args', help='The name of the team or user to change permissions for.')

  @api.marshal_with(successMessage, False, 200)
  @api.expect(parser_add_dataset_permissions)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request', 403: 'Forbidden'}, description="Adds permissions to the given dataset. Permissions are a list of the users/organizations/teams and their roles (viewer, manager, owner, etc) for the given dataset.")
  def patch(self):
    # update the dataset permissions for the selected account and dataset ID
    data = self.parser_add_dataset_permissions.parse_args()

    selected_account = data.get('selected_account')
    selected_dataset = data.get('selected_dataset')
    scope = data.get('scope')
    input_role = data.get('input_role')
    name = data.get('name')

    if scope not in ['team', 'user']:
      api.abort(400, 'Invalid scope. Must be either team or user.')

    if scope == 'team':
      try:
        return ps_add_permission_team(selected_account, selected_dataset, name, input_role)
      except Exception as e:
        if notBadRequestException(e):
          api.abort(500, str(e))
        raise e
    else:
      try:
        return ps_add_permission(selected_account, selected_dataset, name, input_role)
      except Exception as e:
        if notBadRequestException(e):
          api.abort(500, str(e))
        raise e


scale_image_model = api.model("postScaledImage", {
  'scaled_image_path': fields.String(required=True, description="The file path for the scaled image."),
})

@api.route("/bf_banner_image/scale_image")
class scaleBannerImage(Resource):
  parser_image = reqparse.RequestParser(bundle_errors=True)
  parser_image.add_argument('image_file_path', type=str, required=True, location='json', help='The file path of the image to be resized.')

  @api.doc(responses={500: 'There was an internal server error'}, description="Scale an image to be under 5Mb in size.")
  @api.expect(parser_image)
  @api.marshal_with(scale_image_model, False, 200)
  def post(self):
    data = self.parser_image.parse_args()
    image_path = data.get('image_file_path')
    try:
      return scale_image(image_path)
    except Exception as e:
      api.abort(500, str(e))


model_get_banner_image_response = api.model('GetBannerImageResponse', {
  'banner_image': fields.String(required=True, description="AWS URI for the dataset banner image."),
})
@api.route("/bf_banner_image")
class BfBannerImage(Resource):
  parser_banner_image = reqparse.RequestParser(bundle_errors=True)
  parser_banner_image.add_argument('selected_account', type=str, required=True, location='args', help='The target account to retrieve the banner image for.')
  parser_banner_image.add_argument('selected_dataset', type=str, required=True, location='args', help='The name or id of the dataset to retrieve the banner image for.')

  @api.marshal_with(model_get_banner_image_response, False, 200)
  @api.expect(parser_banner_image)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Returns the AWS URI for the dataset banner image.")
  def get(self):
    data = self.parser_banner_image.parse_args()

    selected_account = data.get('selected_account')
    selected_dataset = data.get('selected_dataset')

    try:
      return bf_get_banner_image(selected_account, selected_dataset)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e


  parser_add_banner_image = parser_banner_image.copy()
  parser_add_banner_image.add_argument('input_banner_image_path', type=str, required=True, location='json', help='File path to the local banner image. Will be uploaded to AWS.')

  @api.marshal_with(successMessage, False, 200)
  @api.expect(parser_add_banner_image)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request', 403: 'Forbidden'}, description="Adds a banner image to the given dataset. The banner image will be uploaded to AWS.")
  def put(self):
    # update the dataset banner image for the selected account and dataset ID
    data = self.parser_add_banner_image.parse_args()

    selected_account = data.get('selected_account')
    selected_dataset = data.get('selected_dataset')
    input_banner_image_path = data.get('input_banner_image_path')

    try:
      return bf_add_banner_image(selected_account, selected_dataset, input_banner_image_path)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e


model_get_license_response = api.model('GetLicenseResponse', {
  'license': fields.String(required=True, description="License for the dataset."),
})

@api.route("/bf_license")
class BfLicense(Resource):
  parser_license = reqparse.RequestParser(bundle_errors=True)
  parser_license.add_argument('selected_account', type=str, required=True, location='args', help='The target account to retrieve the license for.')
  parser_license.add_argument('selected_dataset', type=str, required=True, location='args', help='The name or id of the dataset to retrieve the license for.')

  @api.marshal_with(model_get_license_response, False, 200)
  @api.expect(parser_license)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Returns the license for the given dataset.")
  def get(self):
    data = self.parser_license.parse_args()

    selected_account = data.get('selected_account')
    selected_dataset = data.get('selected_dataset')

    try:
      return bf_get_license(selected_account, selected_dataset)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e

  
  parser_add_license = parser_license.copy()
  parser_add_license.add_argument('input_license', type=str, required=True, location='json', help='License for the dataset.')

  @api.marshal_with(successMessage, False, 200)
  @api.expect(parser_add_license)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request', 403: 'Forbidden'}, description="Adds a license to the given dataset.")
  def put(self):
    # update the dataset license for the selected account and dataset ID
    data = self.parser_add_license.parse_args()

    selected_account = data.get('selected_account')
    selected_dataset = data.get('selected_dataset')
    input_license = data.get('input_license')

    try:
      return bf_add_license(selected_account, selected_dataset, input_license)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e







@api.route("/ps_rename_dataset")
class BfRenameDataset(Resource):
  parser_rename_dataset = reqparse.RequestParser(bundle_errors=True)
  parser_rename_dataset.add_argument('selected_account', type=str, required=True, location='args', help='The target account to rename the dataset for.')
  parser_rename_dataset.add_argument('selected_dataset', type=str, required=True, location='args', help='The target account to rename the dataset for.')
  parser_rename_dataset.add_argument('input_new_name', type=str, required=True, location='json', help='The new name for the dataset.')

  @api.expect(parser_rename_dataset)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request', 403: 'Forbidden', 200: 'OK'}, description="Renames the given dataset.")
  def put(self):
    # update the dataset name for the selected account and dataset ID
    data = self.parser_rename_dataset.parse_args()

    selected_account = data.get('selected_account')
    selected_dataset = data.get('selected_dataset')
    input_new_name = data.get('input_new_name')

    try:
      return ps_rename_dataset(selected_account, selected_dataset, input_new_name)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e







model_get_username_response = api.model("GetUsernameResponse", {
  'username': fields.String(required=True, description="The current SODA user's first and last name stored in the Pennsieve system.")
})

@api.route("/account/username")
class BfGetUsername(Resource):

  parser_get_username = reqparse.RequestParser(bundle_errors=True)
  parser_get_username.add_argument('selected_account', type=str, required=True, location='args', help='The target account to rename the dataset for.')

  @api.marshal_with(model_get_username_response, 200, False)
  @api.doc(responses={500: "Internal Server Error", 400: "Bad Request"}, 
           description="Retrieves the current SODA user's first and last name stored on Pennsieve."
          )
  @api.expect(parser_get_username)
  def get(self):
    
    data = self.parser_get_username.parse_args()

    selected_account = data.get("selected_account")

    try:
      return get_username(selected_account)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e

  
  parser_add_username = reqparse.RequestParser(bundle_errors=True)
  parser_add_username.add_argument('keyname', type=str, required=True, location='json', help="Name of the account to be associated with the given credentials.")
  parser_add_username.add_argument('key', type=str, required=True, location='json', help="The API key the user generated on Pennsieve.")
  parser_add_username.add_argument('secret', type=str, required=True, location='json', help="The API secret the user generated on Pennsieve.")


  @api.expect(parser_add_username)
  @api.doc(responses={500: "Internal Server Error", 400: "Bad Request", 401: "Unauthenticated", 403: "Forbidden"}, description="Adds account username to the Pennsieve configuration file.")
  @api.marshal_with(successMessage, 200, False)
  def put(self):

    data = self.parser_add_username.parse_args()

    keyname = data.get('keyname')
    key = data.get('key')
    secret = data.get('secret')


    try:
      return bf_add_account_username(keyname, key, secret)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e







@api.route("/account/api_key")
class BfAddAccountApiKey(Resource):

  parser_add_api_key = reqparse.RequestParser(bundle_errors=True)
  parser_add_api_key.add_argument('keyname', type=str, required=True, location='json', help="Name of the account to be associated with the given credentials.")
  parser_add_api_key.add_argument('key', type=str, required=True, location='json', help="The API key the user generated on Pennsieve.")
  parser_add_api_key.add_argument('secret', type=str, required=True, location='json', help="The API secret the user generated on Pennsieve.")

  @api.expect(parser_add_api_key)
  @api.doc(responses={500: "Internal Server Error", 400: "Bad Request", 401: "Unauthenticated", 403: "Forbidden"}, description="Adds account to the Pennsieve configuration file. Used when connecting account to Pennsieve with an API key and secret.")
  @api.marshal_with(successMessage, 200, False)
  def put(self):

    data = self.parser_add_api_key.parse_args()

    keyname = data.get('keyname')
    key = data.get('key')
    secret = data.get('secret')

    try:
      return bf_add_account_api_key(keyname, key, secret)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e







model_dataset_folder_response = api.model("DatasetFolderResponse", {
  'id': fields.String(required=True, description="The ID of the dataset that has been created."),
  "int_id": fields.Integer(required=True, description="The integer ID of the dataset. Once a dataset is published to Pennsieve this is the only ID that can be used to reference the dataset."),
})

@api.route('/datasets')
class BfCreateDatasetFolder(Resource):
  parser_create_dataset_folder = reqparse.RequestParser(bundle_errors=True)
  parser_create_dataset_folder.add_argument('selected_account', type=str, required=True, location='args', help='The target account to rename the dataset for.')
  parser_create_dataset_folder.add_argument('input_dataset_name', type=str, required=True, location='json', help='The name of the dataset to create.')

  @api.expect(parser_create_dataset_folder)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request', 200: 'OK'}, description="Creates a new dataset on the Pennsieve platform.")
  @api.marshal_with(model_dataset_folder_response, 200, False)
  def post(self):
    # create a new dataset folder for the selected account and dataset ID
    data = self.parser_create_dataset_folder.parse_args()

    selected_account = data.get('selected_account')
    dataset_name = data.get('input_dataset_name')

    try:
      return create_new_dataset(dataset_name, selected_account)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e


  parser_submit_dataset = reqparse.RequestParser(bundle_errors=True)
  parser_submit_dataset.add_argument('selected_account', type=str, required=True, location='args', help='The target account to rename the dataset for.')
  parser_submit_dataset.add_argument('selected_dataset', type=str, required=True, location='args', help='The name of the dataset to create.')
  parser_submit_dataset.add_argument('filepath', type=str, required=True, location='json', help='The local data/dataset folder that will upload to the target dataset.')

  @api.expect(parser_submit_dataset)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request', 200: 'OK'}, description="Add data to an existing dataset entity on the Pennsieve platform.")
  def put(self):


    data = self.parser_submit_dataset.parse_args()

    selected_account = data.get('selected_account')
    selected_dataset = data.get('selected_dataset')
    filepath = data.get('filepath')


    try:
      return bf_submit_dataset(selected_account, selected_dataset, filepath)
    except Exception as e:
      if notBadRequestException(e): 
        api.abort(500, str(e))
      else:
        raise e







model_upload_progress_response = api.model("UploadProgressResponse", {
  'progress': fields.String(required=True, description="The current progress of the upload."),
  'submit_dataset_status': fields.String(required=True, description="The status of the upload."),
  'submit_print_status': fields.String(required=True, description="The status of the print."),
  'total_file_size': fields.Integer(required=True, description="The total size of the file being uploaded."),
  'upload_file_size': fields.Integer(required=True, description="The size of the file being uploaded."),
  'uploaded_files': fields.Integer(required=True, description="The amount of files uploaded."),
  'elapsed_time_formatted': fields.String(required=True, description="The elapsed time of the upload."),
  'files_uploaded_status': fields.String(required=True, description="The amount of files uploaded vs the amount to upload."),
})

@api.route('/datasets/upload_progress')
class BfGetUploadProgress(Resource):

  @api.doc(responses={500: 'There was an internal server error'}, description="Get the progress of the upload.")
  @api.marshal_with(model_upload_progress_response, 200, False)
  def get(self):
    try:
      return submit_dataset_progress()
    except Exception as e:
      api.abort(500, str(e))














model_get_readme_response = api.model("GetReadmeResponse", {
  'readme': fields.String(required=True, description="The readme for the dataset."),
})

@api.route('/datasets/<string:dataset_name_or_id>/readme')
class BfGetDatasetReadme(Resource):
  parser_readme = reqparse.RequestParser(bundle_errors=True)
  parser_readme.add_argument('selected_account', type=str, required=True, location='args', help='The target account to rename the dataset for.')
  parser_readme.add_argument('updated_readme', type=str, required=True, location='json', help='The updated readme content to save.')

  @api.expect(parser_readme)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request', 200: 'OK'}, description="Update the readme for a dataset.")
  @api.marshal_with(successMessage, False, 200)
  def put(self, dataset_name_or_id):
    data = self.parser_readme.parse_args()

    selected_account = data.get('selected_account')
    updated_readme = data.get('updated_readme')

    try:
      return update_dataset_readme(selected_account, dataset_name_or_id , updated_readme)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e



  parser_readme_get = reqparse.RequestParser(bundle_errors=True)
  parser_readme_get.add_argument('selected_account', type=str, required=True, location='args', help='The target account to rename the dataset for.')

  @api.expect(parser_readme_get)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Get the readme for a dataset.")
  @api.marshal_with(model_get_readme_response, False, 200)
  def get(self, dataset_name_or_id):
    data = self.parser_readme_get.parse_args()

    selected_account = data.get('selected_account')

    try:
      return get_dataset_readme(selected_account, dataset_name_or_id)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e







model_get_ds_tags = api.model("GetDsTagsResponse", {
  'tags': fields.List(fields.String, required=True, description="The tags for the dataset."),
})

@api.route('/datasets/<string:dataset_name_or_id>/tags')
class BfGetDatasetTags(Resource):
  
    parser_tags = reqparse.RequestParser(bundle_errors=True)
    parser_tags.add_argument('selected_account', type=str, required=True, location='args', help='The account to get dataset tags for.')

    @api.expect(parser_tags)
    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Get the tags for a dataset.")
    @api.marshal_with(model_get_ds_tags, False, 200)
    def get(self, dataset_name_or_id):
      data = self.parser_tags.parse_args()

      selected_account = data.get('selected_account')

      try:
        return get_dataset_tags(selected_account, dataset_name_or_id)
      except Exception as e:
        if notBadRequestException(e):
          api.abort(500, str(e))
        raise e

    

    parser_tags_put = parser_tags.copy()
    parser_tags_put.add_argument('tags', type=list, required=True, location='json', help='The tags to add to the dataset.')

    @api.expect(parser_tags_put)
    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request', 403: 'Forbidden'}, description="Add tags to a dataset.")
    @api.marshal_with(successMessage, False, 200)
    def put(self, dataset_name_or_id):
      data = self.parser_tags_put.parse_args()

      selected_account = data.get('selected_account')
      tags = data.get('tags')

      try:
        return update_dataset_tags(selected_account, dataset_name_or_id, tags)
      except Exception as e:
        if notBadRequestException(e):
          api.abort(500, str(e))
        raise e






@api.route('/userpool_access_token')
class BfGetUserpoolAccessToken(Resource):
  parser = reqparse.RequestParser(bundle_errors=True)
  parser.add_argument('email', type=str, required=True, location='json', help='The account to get the userpool access token for.')
  parser.add_argument('password', type=str, required=True, location='json', help='The password for the account.')

  @api.expect(parser)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Get a userpool access token.")
  @api.marshal_with(successMessage, False, 200)
  def post(self):
    data = self.parser.parse_args()

    email = data.get('email')
    password = data.get('password')

    try:
      return get_cognito_userpool_access_token(email, password)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e
