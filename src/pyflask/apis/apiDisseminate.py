from disseminate import (
    bf_get_doi,
    bf_reserve_doi,
    bf_get_publishing_status,
    bf_publish_dataset,
    bf_submit_review_dataset,
    bf_withdraw_review_dataset,
)
from flask_restx import Resource
from namespaces import NamespaceEnum, get_namespace

api = get_namespace(NamespaceEnum.DISSEMINATE_DATASETS)

parser = api.parser()
parser.add_argument("selected_bfaccount", type=str, help="Pennsieve account name")
parser.add_argument("selected_bfdataset", type=str, help="Pennsieve dataset name")

@api.route("/bf_get_doi")
class BfGetDoi(Resource):
    @api.doc(responses={200: "Success", 400: "Validation Error", 500: "Internal Server Error"})
    @api.expect(parser)
    def get(self):
        return bf_get_doi()
