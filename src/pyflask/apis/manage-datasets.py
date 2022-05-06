from flask_restx import Namespace, Resource, fields
from manageDatasets import get_pennsieve_api_key_secret

api = Namespace('manage_datasets', description='Routes for handling manage datsets functionality')

pennsieveAPIKeyAndSecret = api.model('PennsieveAPIKeyAndSecret', {
    "success": fields.string(required=True, description="Success or failure"), 
    "keys": fields.string(required=True, description="API key from the Pennsieve platform"),
    "secret": fields.string(required=True, description="Secret from the Pennsieve platform"), 
    "name": fields.string(required=True, description="Name of the user?"),
})


@api.route('')
class api_get_pennsieve_api_key_secret(Resource):
  @api.marshal_with(pennsieveAPIKeyAndSecret, False, 201)
  @api.doc(responses={500: 'There was an internal server error', 400: 'Username or password are incorrect'})

  # get the 
  return get_pennsieve_api_key_secret()