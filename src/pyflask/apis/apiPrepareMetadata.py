from prepareMetadata import (
    save_submission_file,
    save_ds_description_file,
    extract_milestone_info,
    import_milestone,
    save_subjects_file,
    convert_subjects_samples_file_to_df,
    save_samples_file,
    load_taxonomy_species,
    load_existing_DD_file,
    load_existing_submission_file,
    import_bf_metadata_file,
    import_bf_RC,
    upload_RC_file,
    delete_manifest_dummy_folders,
    set_template_path
)
from namespaces import NamespaceEnum, get_namespace
from flask_restx import Resource
from flask import request
import json
from errorHandlers import notBadRequestException


api = get_namespace(NamespaceEnum.PREPARE_METADATA)

# upload_boolean, bfaccount, bfdataset, filepath, json_str
parser = api.parser()
parser.add_argument('upload_boolean', type=bool, help='Boolean to indicate whether to upload the file to the Bionimbus server', location="args")
parser.add_argument('bfaccount', type=str, help='Bionimbus account name', location="args")
parser.add_argument('bfdataset', type=str, help='Bionimbus dataset name', location="args")
parser.add_argument('filepath', type=str, help='Path to the file to be uploaded', location="args")
parser.add_argument('json_str', type=str, help='JSON string to be uploaded', location="json")


@api.route('/save_submission_file')
class SaveSubmissionFile(Resource):

    @api.expect(parser)
    def get(self):
        args = parser.parse_args()
        print("Here are args")
        print(args)
        upload_boolean = args['upload_boolean']
        bfaccount = args['bfaccount']
        bfdataset = args['bfdataset']
        filepath = args['filepath']
        json_data = request.json
        json_str = json_data["json_str"]

        return save_submission_file(upload_boolean, bfaccount, bfdataset, filepath, json_str)

@api.route('/set_template_paths')
class SetTemplatePath(Resource):

    @api.expect(parser)
    def put(self):
        args = request.get_json()
        basepath = args['basepath']
        resourcesPath = args['resourcesPath']
        try:
            return set_template_path(basepath, resourcesPath)
        except Exception as e:
            api.abort(500, e.args[0])


# parser = api.parser()
# parser.add_argument('path', type=str, help='Path to the local data deliverables document', location="args")
# @api.route('/import_milestone')
# class ImportMilestone(Resource):

#     @api.expect(parser)
#     def get(self):
#         args = parser.parse_args()
#         path = args['path']
#         try:
#             return import_milestone(path)
#         except Exception as e:
#             if notBadRequestException(e):
#                 api.abort(500, e.args[0])
#             raise e