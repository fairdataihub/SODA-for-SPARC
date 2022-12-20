
from flask_restx import Resource, fields
from flask import request
from namespaces import get_namespace, NamespaceEnum
from skeletonDataset import create
from errorHandlers import notBadRequestException

api = get_namespace(NamespaceEnum.SKELETON_DATASET)


skeleton_model = api.model('Skeleton', {
    'path_to_skeleton_dataset': fields.String(required=True, description="Path to the skeleton dataset structure"),
})


@api.route('/')
class SkeletonDataset(Resource):

    @api.doc(responses={201: "Success", 400: "Bad Request", 500: "Internal Server Error"}, 
             description="Create a skeleton dataset structure in the ~/SODA/skeleton directory that can be used for dataset validation in the Organize Datasets feature of SODA. Provide account and dataset name when working on datasets that have files/folders on Pennsieve.",
             params={"sodajsonobject": "SODA JSON Structure",
                     "selected_account": "The user's Pennsieve account name ( optional ) ",
                     "selected_dataset": "The user's Pennsieve dataset name or id ( optional )"
                    }
            )
    def post(self):
        # get and validate the data
        data = request.get_json()

        if "sodajsonobject" not in data:
            api.abort(400, "Need the SODAJSONObj to create the skeleton dataset structure")


        sodajsonobject = data["sodajsonobject"]
        selected_account = None
        selected_dataset = None

        if sodajsonobject["generate-dataset"]["destination"] == "bf":
            if "selected_account" not in data:
                api.abort(400, "Need to provide a Pennsieve account name to create the skeleton dataset structure.")

            if "selected_dataset" not in data:
                api.abort(400, "Need to provide a Pennsieve dataset name to create the skeleton dataset structure.")

            selected_account = data["selected_account"]
            selected_dataset = data["selected_dataset"]

        # create the skeleton dataset structure in the ~/SODA/skeleton directory
        try:
            return create(sodajsonobject, selected_account, selected_dataset, False)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e

