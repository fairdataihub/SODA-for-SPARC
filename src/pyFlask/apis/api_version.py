from flask_restx import Namespace, Resource, fields
from apiVersion import get_api_version

api = Namespace('api_version', description='Version of the API')

version = api.model('ApiVersion', {
    'version': fields.String(required=True, description='Version of the API')
})


@api.route('')
class ApiVersion(Resource):
    @api.marshal_with(version, False, 200,)
    @api.doc(responses={500: 'There was an internal server error'})
    def get(self):
        return get_api_version()



