from flask_restx import Resource
from validator import validate_local_dataset, validate_dataset_pipeline, add_scicrunch_to_validator_config
from namespaces import get_namespace, NamespaceEnum

# get the namespace for the validator 
api = get_namespace(NamespaceEnum.VALIDATE_DATASET)



@api.route('/local_dataset_validation_result')
class ValidateLocalDataset(Resource):

    parser = api.parser()
    parser.add_argument('path', type=str, required=True, help='Path to the target local dataset')

    @api.expect(parser)
    @api.doc(responses={500: 'Internal Server Error', 400: 'Bad Request', 200: 'OK'})
    def get(self):
        # get the path from the request object
        path = self.parser.parse_args()['path']
        api.logger.info(f' /local_dataset_validation_result --  args -- path: {path}')

        try:
            return validate_local_dataset(path)
        except Exception as e:
            api.abort(500, str(e))



@api.route('/pennsieve_dataset_validation_result')
class ValidatePennsieveDataset(Resource):
    parser = api.parser()
    parser.add_argument('selected_dataset', type=str, required=True, help='Dataset identifier can be name or UUID')
    parser.add_argument('selected_account', type=str, required=True, help='Account name')

    @api.expect(parser)
    @api.doc(responses={500: 'Internal Server Error', 400: 'Bad Request', 200: 'OK'})
    def get(self):
        # get the path from the request object
        data = self.parser.parse_args()

        selected_dataset = data['selected_dataset']
        selected_account = data['selected_account']

        api.logger.info(f' /local_dataset_validation_result --  args -- path: {selected_dataset}')

        try:
            return validate_dataset_pipeline(selected_account, selected_dataset)
        except Exception as e:
            api.abort(500, str(e))


@api.route('/scicrunch_config')
class SciCrunchAPIKey(Resource):
    
        parser = api.parser()
        parser.add_argument('api_key', type=str, required=True, help='API key')
        parser.add_argument('api_key_name', type=str, required=True, help='API key name')
        parser.add_argument('selected_account', type=str, required=True, help='Pennsieve account for the selected user')
        
    
        @api.expect(parser)
        @api.doc(responses={500: 'Internal Server Error', 400: 'Bad Request', 200: 'OK'})
        def post(self):
            # get the path from the request object
            data = self.parser.parse_args()

            api_key = data['api_key']
            api_key_name = data['api_key_name']
            selected_account = data['selected_account']
    
            try:
                return add_scicrunch_to_validator_config(api_key, api_key_name, selected_account)
            except Exception as e:
                api.abort(500, str(e))