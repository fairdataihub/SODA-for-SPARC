from flask_restx import Resource, fields, reqparse
from flask import request
from namespaces import get_namespace, NamespaceEnum, get_namespace_logger
from PIL import Image
import time
import os
import requests
import platform
import base64
from mfplus import convert as mfplus_convert, mfpreqs
import mfplus

api = get_namespace(NamespaceEnum.IMAGE_PROCESSING)
namespace_logger = get_namespace_logger(NamespaceEnum.IMAGE_PROCESSING)

@api.route('/is_microfileplus_installed')
class IsMicroFilePlusInstalled(Resource):
    global namespace_logger

    response_model = {
        'status': fields.Boolean(required=True, description="The status of the MicroFilePlus installation"),\
        'platform': fields.String(description="The platform the user is running on")
    }

    @api.response(200, 'MicroFilePlus installation status', response_model)
    @api.response(500, 'Internal server error')
    def get(self):
        user_platform = platform.system()
        namespace_logger.info(f"User platform: {user_platform}")
        try:
            namespace_logger.info("Received request to get MicroFilePlus installation status")
            mfplusloc = mfpreqs.findmfplus()
            if not mfplusloc:
                return {'status': False, 'platform': user_platform}
            namespace_logger.info(f"MicroFilePlus found at: {mfplusloc}")
            return {'status': True, 'platform': user_platform}
        except Exception as e:
            namespace_logger.error(f"Error getting MicroFilePlus installation status: {str(e)}")
            return {'status': False, 'platform': user_platform}

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

    request_model = api.model('BiolucidaImageUploadRequest', {
        'token': fields.String(required=True, description="The token to use for authentication"),
        'collection_name': fields.String(required=True, description="The name of the collection to upload the image to"),
        'files_to_upload': fields.List(fields.String, required=True, description="The list of filepaths to upload")
    })
    response_model = api.model('BiolucidaImageUploadResponse', {
        'status': fields.String(description="Additional message, such as error details")
    })

    parser = reqparse.RequestParser(bundle_errors=True)
    parser.add_argument('token', type=str, required=True, help="The token to use for authentication")
    parser.add_argument('collection_name', type=str, required=True, help="The name of the collection to upload the image to")
    parser.add_argument('files_to_upload', type=list, required=True, help='List of filepaths to upload to BioLucida', location='json')

    @api.expect(request_model)
    @api.response(200, 'Image uploaded', response_model)
    @api.response(400, 'Bad request')
    @api.response(500, 'Internal server error')
    def post(self):
        try:
            namespace_logger.info("Received request to upload image to Biolucida")
            data = self.parser.parse_args()
            token = data['token']
            collection_name = data['collection_name']
            files_to_upload = data['files_to_upload']

            namespace_logger.info(f"Token for request: {token}")
            namespace_logger.info(f"Collection name: {collection_name}")
            namespace_logger.info(f"Files to upload: {files_to_upload}")

            for file_path in files_to_upload:
                namespace_logger.info(f"Uploading file: {file_path}")
                file_name = os.path.basename(file_path)
                try:
                    file_size = os.path.getsize(file_path)
                except FileNotFoundError:
                    namespace_logger.error(f"File not found: {file_path}")
                    continue
                
                namespace_logger.info(f"File size: {file_size}")
                namespace_logger.info(f"File name: {file_name}")
                chunk_size = min(file_size, 1000000)

                headers = {'token': token}
                payload = {
                    'filesize': file_size,
                    'chunk_size': chunk_size,
                    'filename': file_name,
                    'tracked_directory': '269'
                }
                
                init_response = requests.post('https://sparc.biolucida.net/api/v1/upload/init', headers=headers, data=payload)
                init_response_data = init_response.json()
                namespace_logger.info(f"Init response: {init_response_data}")

                number_of_chunks = int(init_response_data['total_chunks'])
                upload_key = init_response_data['upload_key']
                namespace_logger.info(f"Number of chunks: {number_of_chunks}")

                with open(file_path, "rb") as image:
                    image_data = image.read()
                    split_image = [image_data[i:i+chunk_size] for i in range(0, len(image_data), chunk_size)]
                    for i in range(number_of_chunks):
                        chunk_payload = {
                            'upload_key': upload_key,
                            'upload_data': base64.b64encode(split_image[i]).decode('utf-8'),
                            'chunk_id': i
                        }
                        namespace_logger.info(f"Uploading chunk {i} of size {len(split_image[i])}")

                        chunk_response = requests.post('https://sparc.biolucida.net/api/v1/upload/continue', json=chunk_payload)
                        namespace_logger.info(f"Chunk upload response: {chunk_response.json()}")

                finish_payload = {'upload_key': upload_key}
                finish_response = requests.post('https://sparc.biolucida.net/api/v1/upload/finish', json=finish_payload)
                namespace_logger.info(f"Finish response: {finish_response.json()}")

        except requests.exceptions.RequestException as e:
            namespace_logger.error(f"Error uploading image to Biolucida: {str(e)}")
            api.abort(500, str(e))
        except Exception as e:
            namespace_logger.error(f"Unexpected error: {str(e)}")
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
            namespace_logger.info("Received request to create collection in Biolucida")
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
    
@api.route('/create_image_thumbnails')
class CreateImageThumbnails(Resource):
    global namespace_logger
    request_model = {
        'image_paths': fields.List(fields.String, required=True, description="The paths to the images to create thumbnails for"),
        'output_directory': fields.String(required=True, description="The directory to save the thumbnails to"),
    }
    response_model = {
        'converted_image_paths': fields.List(fields.String, required=True, description="The paths to the thumbnails created"),
    }

    parser = reqparse.RequestParser(bundle_errors=True)
    parser.add_argument('image_paths', type=list, location='json', required=True, help="The path to the image to create thumbnails for")
    parser.add_argument('output_directory', type=str, required=True, help="The directory to save the thumbnails to")

    @api.expect(request_model)
    @api.response(200, 'Thumbnails created', response_model)
    @api.response(400, 'Bad request')
    @api.response(500, 'Internal server error')
    def post(self):
        try:
            data = self.parser.parse_args()
            image_paths = data['image_paths']
            output_directory = data['output_directory']
            namespace_logger.info(f"Creating thumbnails for images: {image_paths}")
            namespace_logger.info(f"Output directory: {output_directory}")
            converted_image_paths = []
            for image_path in image_paths:
                # Combine the output_directory with the image name and _thumbnail.jpg
                thumbnail_path = os.path.join(
                    output_directory,
                    f"{os.path.basename(image_path)}_thumbnail.jpg",
                )

                # If a thumbnail has not already been created for this image, create it
                if not os.path.exists(thumbnail_path):
                    try:
                        image = Image.open(image_path)
                        image.thumbnail((300, 300))
                        namespace_logger.info(f"Image_path: {image_path}")

                        # Convert RGBA to RGB if necessary
                        if image.mode != 'RGB':
                            image = image.convert('RGB')

                        
                        namespace_logger.info(f"thumbnail_path: {thumbnail_path}")
                        image.save(thumbnail_path, "JPEG")
                        namespace_logger.info(f"Thumbnail saved to: {thumbnail_path}")
                        converted_image_paths.append(thumbnail_path)
                    except Exception as e:
                        namespace_logger.error(f"Error creating thumbnail for image: {image_path}")
                        namespace_logger.error(f"Error: {str(e)}")
                        namespace_logger.error("Skipping this image")
            return {'converted_image_paths': converted_image_paths}, 200
        except Exception as e:
            namespace_logger.error(f"Error creating thumbnails: {str(e)}")
            api.abort(500, str(e))