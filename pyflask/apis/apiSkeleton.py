
from flask_restx import Resource, fields
from flask import request
from namespaces import get_namespace, NamespaceEnum
from skeletonDataset import create, get_manifests
from errorHandlers import notBadRequestException

api = get_namespace(NamespaceEnum.SKELETON_DATASET)


skeleton_model = api.model('Skeleton', {
    'path_to_skeleton_dataset': fields.String(required=True, description="Path to the skeleton dataset structure"),
})


@api.route('/')
class SkeletonDataset(Resource):

    @api.doc(responses={201: "Success", 400: "Bad Request", 500: "Internal Server Error"}, 
             description="Create a skeleton dataset structure in the ~/SODA/skeleton directory that can be used for dataset validation in the Organize Datasets feature of SODA.",
             params={"sodajsonobject": "SODA JSON Structure"}
            )
    def post(self):
        # get and validate the data
        data = request.get_json()

        if "sodajsonobject" not in data:
            api.abort(400, "Need the SODAJSONObj to create the skeleton dataset structure")

        sodajsonobject = data["sodajsonobject"]

        api.logger.info(f"Creating skeleton dataset structure {sodajsonobject}")

        # create the skeleton dataset structure in the ~/SODA/skeleton directory
        try:
            return create(sodajsonobject)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e


@api.route('/manifest_json')
class SkeletonDatasetManifest(Resource):

    def post(self):
        data = request.get_json()


        if "sodajsonobject" not in data:
            api.abort(400, "Need the SODAJSONObj to create the skeleton dataset structure")

        sodajsonobject = data["sodajsonobject"]

        api.logger.info(f"Creating skeleton dataset structure {sodajsonobject}")

        try:
            return get_manifests(sodajsonobject)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e

