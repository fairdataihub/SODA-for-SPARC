from flask_restx import Resource, fields, reqparse
from flask import request
from namespaces import get_namespace, NamespaceEnum, get_namespace_logger
from PIL import Image
import os
import requests

api = get_namespace(NamespaceEnum.IMAGE_PROCESSING)
namespace_logger = get_namespace_logger(NamespaceEnum.IMAGE_PROCESSING)




@api.route('/biolucida_login')
class BiolucidaLogin(Resource):
    global namespace_logger
    
    request_model = {
        'username': fields.String(required=True, description="The username to login with"),
        'password': fields.String(required=True, description="The password to login with"),
    }
    response_model = {
        'token': fields.String(required=True, description="The token to use for subsequent requests"),
        'username': fields.String(required=True, description="The username used to login"),
        'status': fields.String(description="Additional message, such as error details")
    }
    
    parser = reqparse.RequestParser(bundle_errors=True)
    parser.add_argument('username', type=str, required=True, help="The username to login with")
    parser.add_argument('password', type=str, required=True, help="The password to login with")

    @api.expect(request_model)
    @api.response(200, 'Login successful', response_model)
    @api.response(400, 'Bad request')
    @api.response(500, 'Internal server error')
    def post(self):
        try:
            data = self.parser.parse_args()
            username = data['username']
            password = data['password']
            namespace_logger.info(f"Logging in to Biolucida with username: {username}")
            res = requests.post('https://sparc.biolucida.net/api/v1/authenticate', data={'username': username, 'password': password, 'token': '1234'})
            namespace_logger.info(f"Login response: {res.json()}")
            return res.json()
        except Exception as e:
            namespace_logger.error(f"Error logging in to Biolucida: {str(e)}")
            api.abort(500, str(e))
    
    
thumbnail_model = api.model('ThumbnailStatus', {
    'image_path': fields.String(required=True, description="Path to the thumbnail image file"),
    'status': fields.String(required=True, description="Success or failure status of thumbnail creation"),
    'message': fields.String(description="Additional message, such as error details")
})
@api.route('/create_image_thumbnails')
class CreateThumbnail(Resource):
    parser_create_image_thumbnails = reqparse.RequestParser(bundle_errors=True)
    parser_create_image_thumbnails.add_argument('raw_image_paths', type=list, required=True, help="List of image paths to create thumbnails for")
    parser_create_image_thumbnails.add_argument('output_path', type=str, required=True, help="Path to save the thumbnails")
    @api.expect(api.model('ThumbnailData', {
        'raw_image_paths': fields.List(fields.String, required=True, description="List of image paths to create thumbnails for"),
        'output_path': fields.String(required=True, description="Path to save the thumbnails"),
    }))
    @api.response(200, 'Thumbnails created successfully', thumbnail_model)
    @api.response(400, 'Bad request')
    @api.response(500, 'Internal server error')
    def get(self):
        try:
            data = self.parser_create_image_thumbnails.parse_args()
            return data
            raw_image_paths = data['raw_image_paths']
            output_path = data['output_path']

            converted_image_data = []
            for raw_image_path in raw_image_paths:
                image_name = os.path.basename(raw_image_path)
                try:
                    with Image.open(raw_image_path) as img:
                        img.thumbnail((128, 128))
                        img.save(os.path.join(output_path, f"{image_name}_thumbnail.jpg"))
                        converted_image_data.append({'image_path': f"{output_path}/{image_name}_thumbnail.jpg", 'status': 'Success'})
                except Exception as e:
                    converted_image_data.append({'image_name': image_name, 'status': 'Failure', 'message': str(e)})

            return converted_image_data

        except Exception as e:
            api.logger.error(f"Error creating thumbnails: {str(e)}")
            api.abort(500, str(e)) 