from flask_restx import Resource, fields, reqparse
from namespaces import NamespaceEnum, get_namespace
from flask import request
from uploadManifests import get_files_for_manifest,get_file_paths_by_status, get_upload_manifest_ids

api = get_namespace(NamespaceEnum.UPLOAD_MANIFESTS)



# uploadManifestVerifiedFiles = api.model('UploadManifestVerifiedFiles', {
#     "count": fields.Integer(required=True, description="Total number of verified files in the upload manifest.")
# })


@api.route("/<string:manifest_id>/files")
class VerifiedFilesCount(Resource):
    manifest_files_parser = reqparse.RequestParser(bundle_errors=True)
    manifest_files_parser.add_argument('limit', type=int, required=True, help='The limit on files returned to the client.', location="args")
    manifest_files_parser.add_argument('continuation_token', type=str, required=False, help='The continuation token for paginating through files.', location="args")

    # @api.marshal_with( uploadManifestVerifiedFiles, False, 200)
    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad Request', 404: "Not Found"}, description="Returns the count of files in an upload manifest that have had their statuses verified.", params={'manifest_id': 'The upload manifest id.'})
    @api.expect(manifest_files_parser)
    def get(self, manifest_id):
        """
        Get the number of verified files in an upload manifest. For a file to be verified its status must be 
        one of the following: VERIFIED | FAILED | FINALIZED.
        """
        data = self.manifest_files_parser.parse_args()
        limit = data.get('limit')
        continuation_token = data.get('continuation_token')
        return get_files_for_manifest(manifest_id, limit, continuation_token)


@api.route("/{m_id}/paths")
class UploadManifestFilePaths(Resource):
    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad Request', 404: "Not Found"}, description="Returns the paths of files in an upload manifest that have a specific status.", params={'manifest_id': 'The upload manifest id.', 'status': 'The status of the files to return.'})
    def get(self, m_id):
        """
        Get the files in an upload manifest that have a specific status.
        """
        status = request.args.get("status")
        return get_file_paths_by_status(m_id, status)
    

@api.route("/ids")
class UploadManifestList(Resource):

    manifest_ids_parser = reqparse.RequestParser(bundle_errors=True)
    manifest_ids_parser.add_argument('dataset_id', type=str, required=True, help='The Pennsieve dataset id to return upload manifests for.', location="args")
    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad Request', 404: "Not Found"}, description="Returns a list of all upload manifest ids that have been initiated.")
    @api.expect(manifest_ids_parser)
    def get(self):
        """
        Get the ids of all upload manifests that have been initiated.
        """
        data = self.manifest_ids_parser.parse_args()
        dataset_id = data.get('dataset_id')
        return get_upload_manifest_ids(dataset_id)

