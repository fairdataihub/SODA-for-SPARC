# from flask_restx import Resource, fields, reqparse
# from flask import request
# from validator import val_dataset_local_pipeline, validate_dataset_pipeline
# from namespaces import get_namespace, NamespaceEnum

# # get the namespace for the validator 
# api = get_namespace(NamespaceEnum.VALIDATE_DATASET)



# parser = api.parser()
# parser.add_argument('path', type=str, required=True, help='Path to the target local dataset')

# @api.route('/local_dataset')
# class ValidateLocalDataset(Resource):

#     @api.expect(parser)
#     @api.doc(responses={500: 'There was an internal server error', 400: 'No dataset path provided or path is not to a dataset'})
#     def get(self):
#         # get the path from the request object
#         path = request.args.get('path')
#         api.logger.info(f' val_dataset_local_pipeline --  args -- path: {path}')

#         if path is None:
#             api.abort(400, "Cannot validate dataset without a path")

#         try:
#             return val_dataset_local_pipeline(path)
#         except Exception as e:
#             api.abort(500, e.args[0])
