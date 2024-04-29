from flask_restx import Resource, fields, reqparse
from namespaces import NamespaceEnum, get_namespace
from flask import request
from uploadManifests import get_verified_files_count,get_file_paths_by_status, get_upload_manifest_ids

api = get_namespace(NamespaceEnum.UPLOAD_MANIFESTS)



uploadManifestVerifiedFiles = api.model('UploadManifestVerifiedFiles', {
    "count": fields.Integer(required=True, description="Total number of verified files in the upload manifest.")
})


@api.route("/{m_id}/verified_files_count")
class VerifiedFilesCount(Resource):
    @api.marshal_with( uploadManifestVerifiedFiles, False, 200)
    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad Request', 404: "Not Found"}, description="Returns the count of files in an upload manifest that have had their statuses verified.", params={'manifest_id': 'The upload manifest id.'})
    def get(self, m_id):
        """
        Get the number of verified files in an upload manifest. For a file to be verified its status must be 
        one of the following: VERIFIED | FAILED | FINALIZED.
        """
        return get_verified_files_count(m_id)


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

