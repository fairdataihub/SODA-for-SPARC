from namespaces import get_namespace, NamespaceEnum
from flask_restx import Resource, reqparse
from validator import  val_dataset_local_pipeline

api = get_namespace(NamespaceEnum.VALIDATE_DATASET)

@api.route('/local')
class ValidateDatasetLocal(Resource):
    parser = reqparse.RequestParser(bundle_errors=True)
    parser.add_argument("dataset_path", type=str, required=True, help="Path to the local dataset", location="json")

    @api.doc('validate_dataset_local')
    def post(self):
        """
        Validate a local dataset
        """
        data = self.parser.parse_args()
        ds_path = data.get("dataset_path")

        try:
            return val_dataset_local_pipeline(ds_path)
        except Exception as e:
            raise e