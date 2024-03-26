from flask_restx import Resource, fields, reqparse
from flask import request
from namespaces import get_namespace, NamespaceEnum
from PIL import Image
import os

api = get_namespace(NamespaceEnum.IMAGE_PROCESSING)


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