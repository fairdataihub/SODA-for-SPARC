
from flask_restx import Resource
from flask import request
from namespaces import get_namespace, NamespaceEnum
from skeletonDataset import create
from errorHandlers import notBadRequestException

api = get_namespace(NamespaceEnum.SKELETON_DATASET)


@api.route('/')
class SkeletonDataset(Resource):

    @api.doc(responses={201: "Success", 400: "Bad Request", 500: "Internal Server Error"}, 
             description="Create a skeleton dataset structure in the ~/SODA/skeleton directory that can be used for dataset validation in the Organize Datasets feature of SODA.",
             params={"sodajsonobject": "SODA JSON Structure",
                     "selected_account": "The user's Pennsieve account name",
                     "selected_dataset": "The user's Pennsieve dataset name or id"
                    }
            )
    def post(self):
        # get and validate the data
        data = request.get_json()

        if "sodajsonobject" not in data:
            api.abort(400, "Need the SODAJSONObj to create the skeleton dataset structure")

        if "selected_account" not in data:
            api.abort(400, "Need the selected_account to create the skeleton dataset structure")

        if "selected_dataset" not in data:
            api.abort(400, "Need the selected_dataset to create the skeleton dataset structure")

        

        sodajsonobject = data["sodajsonobject"]
        selected_account = data["selected_account"]
        selected_dataset = data["selected_dataset"]

        # create the skeleton dataset structure in the ~/SODA/skeleton directory
        try:
            return create(sodajsonobject, selected_account, selected_dataset)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e

