
from flask_restx import Resource, fields
from flask import request
from namespaces import get_namespace, NamespaceEnum
from skeletonDataset import get_manifests, get_metadata_files_json
from errorHandlers import notBadRequestException

api = get_namespace(NamespaceEnum.SKELETON_DATASET)


skeleton_model = api.model('Skeleton', {
    'path_to_skeleton_dataset': fields.String(required=True, description="Path to the skeleton dataset structure"),
})


@api.route('/manifest_json')
class SkeletonDatasetManifest(Resource):

    def post(self):
        data = request.get_json()


        if "sodajsonobject" not in data:
            api.abort(400, "Need the SODAJSONObj to create the skeleton dataset structure")

        sodajsonobject = data["sodajsonobject"]

        try:
            return get_manifests(sodajsonobject)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e


@api.route('/metadata_json')
class SkeletonDatasetMetadata(Resource):

    def post(self):
        data = request.get_json()

        if "sodajsonobject" not in data:
            api.abort(400, "Need the SODAJSONObj to create the skeleton dataset structure")

        sodajsonobject = data["sodajsonobject"]

        try:
            return get_metadata_files_json(sodajsonobject)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e