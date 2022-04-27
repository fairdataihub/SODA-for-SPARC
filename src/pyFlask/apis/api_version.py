from flask_restx import Namespace, Resource, fields

api = Namespace('api_version', description='Version of the API')

version = api.model('Version', {
    'version': fields.String(required=True, description='Version of the API')
})

