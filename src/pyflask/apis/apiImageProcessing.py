from flask_restx import Resource, fields, reqparse
from flask import request
from namespaces import get_namespace, NamespaceEnum, get_namespace_logger
from PIL import Image
import time
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
        'files_to_upload': fields.List(fields.String, required=True, description="The list of filepaths to upload")
    }
    response_model = {
        'status': fields.String(description="Additional message, such as error details")
    }

    parser = reqparse.RequestParser(bundle_errors=True)
    parser.add_argument('token', type=str, required=True, help="The token to use for authentication")
    parser.add_argument('collection_name', type=str, required=True, help="The name of the collection to upload the image to")
    parser.add_argument('files_to_upload', type=list, required=True, help='List of filepaths to upload to BioLucida', location='json',)

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


            namespace_logger.info(f"Collection name: {collection_name}")
            namespace_logger.info(f"Files to upload: {files_to_upload}")
            for filePath in files_to_upload:
                namespace_logger.info(f"Uploading file: {filePath}")
                # Get the name of the file
                filename = os.path.basename(filePath)
                # Get the size of the file
                fileSize = os.path.getsize(filePath)
                namespace_logger.info(f"File size: {fileSize}")
                namespace_logger.info(f"File name: {filename}")
                chunk_size = fileSize if fileSize < 1000000 else 1000000

                headers = {
                    'token': token
                }
                payload = {
                    'filesize': fileSize,
                    'chunk_size': chunk_size,
                    'filename': filename,
                    'tracked_directory': '269',
                }
                res = requests.post('https://sparc.biolucida.net/api/v1/upload/init', headers=headers, data=payload)
                namespace_logger.info(f"Init response: {res.json()}")
                number_of_chunks = int(res.json()['total_chunks'])
                upload_key = res.json()['upload_key']
                namespace_logger.info(f"Number of chunks: {number_of_chunks}")
                with open(filePath, "rb") as image:
                    image_base64 = image.read()
                    split_image = [image_base64[i:i+chunk_size] for i in range(0, len(image_base64), chunk_size)]
                    for i in range(number_of_chunks):
                        payload = {
                            'upload_key': upload_key,
                            'upload_data': image_base64,
                            'chunk_id': i,
                        }
                        namespace_logger.info(f"Upload key: {upload_key}")
                        namespace_logger.info(f"Chunk size: {len(split_image[i])}")
                        namespace_logger.info(f"Chunk number: {i}")

                        res = requests.post('https://sparc.biolucida.net/api/v1/upload/continue', data=payload)
                        namespace_logger.info(f"Chunk upload response: {res.json()}")
                

                finish_payload = {
                    'upload_key': upload_key,
                }

                res = requests.post('https://sparc.biolucida.net/api/v1/upload/finish', data=finish_payload)
                namespace_logger.info(f"Finish response: {res.json()}")
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
    
    
