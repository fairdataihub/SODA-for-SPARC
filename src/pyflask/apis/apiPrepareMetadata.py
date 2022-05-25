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


api = get_namespace(NamespaceEnum.PREPARE_METADATA)

# upload_boolean, bfaccount, bfdataset, filepath, json_str
parser = api.parser()
parser.add_argument('upload_boolean', type=bool, help='Boolean to indicate whether to upload the file to the Bionimbus server', location="args")
parser.add_argument('bfaccount', type=str, help='Bionimbus account name', location="args")
parser.add_argument('bfdataset', type=str, help='Bionimbus dataset name', location="args")
parser.add_argument('filepath', type=str, help='Path to the file to be uploaded', location="args")
parser.add_argument('json_str', type=str, help='JSON string to be uploaded', location="args")


@api.route('/save_submission_file')
class SaveSubmissionFile(Resource):

    @api.expect(parser)
    def get(self):
        args = parser.parse_args()
        upload_boolean = args['upload_boolean']
        bfaccount = args['bfaccount']
        bfdataset = args['bfdataset']
        filepath = args['filepath']
        json_str = args['json_str']

        return save_submission_file(upload_boolean, bfaccount, bfdataset, filepath, json_str)

