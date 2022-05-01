from flask_restx import Namespace, Resource, fields

api = Namespace('api_version', description='Version of the API')

version = api.model('ApiVersion', {
    'version': fields.String(required=True, description='Version of the API')
})

API_VERSION = "5.4.0"

@api.route('/ApiVersion')
class ApiVersion(Resource):
    @api.marshal_with(version, False, 200,)
    @api.doc(responses={500: 'Server could not process the request'})
    def get():
        return {'version': API_VERSION}



