from organizeDatasets import (
    generate_dataset_locally,
    bf_get_dataset_files_folders,
    create_soda_json_object_backend,
    monitor_local_json_progress,
)

from namespaces import NamespaceEnum, get_namespace
from flask_restx import Resource
from flask import request
import json
from errorHandlers import notBadRequestException

api = get_namespace(NamespaceEnum.ORGANIZE_DATASETS)


parser = api.parser()
parser.add_argument('sodajsonobject', type=str, help='The sodajsonobject filled with the bfaccount and dataset info available.', location="json")

@api.route('/get_dataset_files_folders')
class BfGetDatasetFilesFolders(Resource):
    @api.expect(parser)
    
    def get(self):
        json_data = request.json
        sodajsonobject = json_data["sodajsonobject"]
        try:
            return bf_get_dataset_files_folders(sodajsonobject)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, e.args[0])
            raise e