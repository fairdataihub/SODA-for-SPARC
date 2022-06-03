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
)
from namespaces import NamespaceEnum, get_namespace
from flask_restx import Resource
from flask import request
import json
from errorHandlers import notBadRequestException


api = get_namespace(NamespaceEnum.PREPARE_METADATA)

# upload_boolean, bfaccount, bfdataset, filepath, json_str
parser_save_submission_file = reqparse.RequestParser(bundle_errors=True)
parser_save_submission_file.add_argument('upload_boolean', type=bool, help='Boolean to indicate whether to upload the file to the Bionimbus server', location="args")
parser_save_submission_file.add_argument('bfaccount', type=str, help='Bionimbus account name', location="args")
parser_save_submission_file.add_argument('bfdataset', type=str, help='Bionimbus dataset name', location="args")
parser_save_submission_file.add_argument('filepath', type=str, help='Path to the file to be uploaded', location="args")
parser_save_submission_file.add_argument('json_str', type=str, help='JSON string to be uploaded', location="json")


@api.route('/save_submission_file')
class SaveSubmissionFile(Resource):

    @api.expect(parser_save_submission_file)
    def get(self):
        args = parser_save_submission_file.parse_args()
        upload_boolean = args['upload_boolean']
        bfaccount = args['bfaccount']
        bfdataset = args['bfdataset']
        filepath = args['filepath']
        json_data = request.json
        json_str = json_data["json_str"]

        return save_submission_file(upload_boolean, bfaccount, bfdataset, filepath, json_str)


parser_import_milestone = reqparse.RequestParser(bundle_errors=True)
parser_import_milestone.add_argument('path', type=str, help='Path to the local data deliverables document', location="args")
@api.route('/import_milestone')
class ImportMilestone(Resource):

    @api.expect(parser_import_milestone)
    def get(self):
        args = parser_import_milestone.parse_args()
        path = args['path']
        try:
            return import_milestone(path)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, e.args[0])
            raise e