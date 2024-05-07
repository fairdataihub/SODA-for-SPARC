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
            res = requests.post('https://sparc.biolucida.net/api/v1/authenticate', data={'username': username, 'password': password, 'token': 'unused_but_required'})
            namespace_logger.info(f"Login response: {res.json()}")
            namespace_logger.info(f"Login status code: {res.status_code}")
            access_token = res.json()['token']
            namespace_logger.info(f"Access token: {access_token}")    
            return res.json()
        except Exception as e:
            namespace_logger.error(f"Error logging in to Biolucida: {str(e)}")
            api.abort(500, str(e))


@api.route('/biolucida_image_upload')
class BiolucidaImageUpload(Resource):
    global namespace_logger

    request_model = {
        'token': fields.String(required=True, description="The token to use for authentication"),
        'collection_name': fields.String(required=True, description="The name of the collection to upload the image to"),
        'files_to_upload': fields.List(fields.String, required=True, description="The list of files to upload")
    }

    response_model = {
        'status': fields.String(description="Additional message, such as error details")
    }

    parser = reqparse.RequestParser(bundle_errors=True)
    parser.add_argument('token', type=str, required=True, help="The token to use for authentication")
    parser.add_argument('collection_name', type=str, required=True, help="The name of the collection to upload the image to")
    parser.add_argument('files_to_upload', type=list, help="The list of files to upload")

    @api.expect(request_model)
    @api.response(200, 'Image uploaded', response_model)
    @api.response(400, 'Bad request')
    @api.response(500, 'Internal server error')
    def post(self):
        try:
            namespace_logger.info("Received request to upload image to Biolucida")
            data = self.parser.parse_args()
            token = data['token']
            namespace_logger.info(f"Token for request: {token}")
            collection_name = data['collection_name']
            files_to_upload = data['files_to_upload']

            headers = {
                'token': token
            }

            data = {
                'filesize': '100',
                'chunk_size': '100',
                'filename': 'test',
            }
            namespace_logger.info(f"Init request headers: {headers}")
            namespace_logger.info(f"Init request payload: {data}")

            res = requests.post('https://sparc.biolucida.net/api/v1/upload/init', headers=headers, data=data)
            namespace_logger.info(f"Upload init response: {res}")
            namespace_logger.info(f"Upload init text: {res.text}")
            namespace_logger.info(f"Upload init status code: {res.status_code}")
            namespace_logger.info(f"Handling res based on status code: {res.status_code}")
            if (res.status_code != 200):
                namespace_logger.error(f"FAILED Error uploading image to Biolucida: {res}")
                namespace_logger.error(f"FAILED BioLucida API status code: {res.status_code}")
                api.abort(500, res)
            else:
                namespace_logger.info(f"SUCCESS Upload image response: {res}")
                namespace_logger.info(f"SUCCESS Upload image status code: {res.status_code}")
                namespace_logger.info(f"SUCCESS Upload image text: {res.text}")
                return res.json()
        except Exception as e:
            namespace_logger.error(f"Error uploading image to Biolucida: {str(e)}")
            api.abort(500, str(e))




@api.route('/biolucida_create_collection')
class BiolucidaLogin(Resource):
    global namespace_logger
    
    request_model = {
        'token': fields.String(required=True, description="The token to use for authentication"),
        'collection_name': fields.String(required=True, description="The name of the collection to create"),
    }
    response_model = {
        'status': fields.String(description="Additional message, such as error details")
    }
    
    parser = reqparse.RequestParser(bundle_errors=True)
    parser.add_argument('token', type=str, required=True, help="The token to use for authentication")
    parser.add_argument('collection_name', type=str, required=True, help="The name of the collection to create")

    @api.expect(request_model)
    @api.response(200, 'Collection created', response_model)
    @api.response(400, 'Bad request')
    @api.response(500, 'Internal server error')

    def post(self):
        try:
            data = self.parser.parse_args()
            token = data['token']
            collection_name = data['collection_name']
            namespace_logger.info(f"Creating collection in Biolucida: {collection_name}")
            headers = {
                'token': token
            }
            payload={
                'name': collection_name,
                'parent_id': 0,
                'owner': ''
            }
            res = requests.post('https://sparc.biolucida.net/api/v1/collections/create', headers=headers, data=payload)
            namespace_logger.info(f"Create collection response: {res.json()}")
            return res.json()
        except Exception as e:
            namespace_logger.error(f"Error creating collection in Biolucida: {str(e)}")
            api.abort(500, str(e))


@api.route('/biolucida_create_folder')
class BiolucidaCreateFolder(Resource):
    global namespace_logger
    
    request_model = {
        'folder_name': fields.String(required=True, description="The name of the folder to create"),
        'token': fields.String(required=True, description="The token to use for authentication"),
    }
    response_model = {
        'status': fields.String(description="Additional message, such as error details")
    }
    
    parser = reqparse.RequestParser(bundle_errors=True)
    parser.add_argument('folder_name', type=str, required=True, help="The name of the folder to create")
    parser.add_argument('token', type=str, required=True, help="The token to use for authentication")

    @api.expect(request_model)
    @api.response(200, 'Folder created', response_model)
    @api.response(400, 'Bad request')
    @api.response(500, 'Internal server error')
    def post(self):
        try:
            data = self.parser.parse_args()
            folder_name = data['folder_name']
            token = data['token']
            namespace_logger.info(f"Creating folder in Biolucida: {folder_name}")
            res = requests.post('https://sparc.biolucida.net/api/v1/folder', data={'folder_name': folder_name, 'token': token})
            namespace_logger.info(f"Create folder response: {res.json()}")
            
            return res.json()
        except Exception as e:
            namespace_logger.error(f"Error creating folder in Biolucida: {str(e)}")
            api.abort(500, str(e))
    
    
