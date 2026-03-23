from startup import echo, get_api_version
import time
from flask import Response
from flask_restx import Resource, fields
from namespaces import get_namespace, NamespaceEnum
from flask import request
from pennsieve2.pennsieve import Pennsieve
import requests
import boto3
import os
from configparser import ConfigParser



PENNSIEVE_URL = "https://api.pennsieve.io"
userpath = os.path.expanduser("~")
configpath = os.path.join(userpath, ".pennsieve", "config.ini")

api = get_namespace(NamespaceEnum.STARTUP)

parser = api.parser()
parser.add_argument('arg', type=str, required=True, help='Argument that will be echoed back to the caller', location='args')

@api.route("/echo")
class Echo(Resource):
    @api.expect(parser)
    def get(self):
        args = parser.parse_args()
        return args["arg"]


@api.route("/minimum_api_version")
class MinimumApiVersion(Resource):
    def get(self):
        return get_api_version()
    

def connect_pennsieve_client(account_name):
    """
        Connects to Pennsieve Python client to the Agent and returns the initialized Pennsieve object.
    """
    return Pennsieve(profile_name=account_name)


def get_profile_name_from_api_key(key):
    config = ConfigParser()
    config.read(configpath)
    if "global" not in config:
        raise Exception("Profile has not been set")

    keyname = config["global"]["default_profile"]

    if keyname in config and key in config[keyname]:
        return config[keyname][key]
    return None


def get_account_name():
    config = ConfigParser()
    config.read(configpath)
    if "global" not in config:
        raise Exception("Profile has not been set")

    keyname = config["global"]["default_profile"]
    return keyname


def get_access_token(api_key=None, api_secret=None):
    """
        Creates a temporary access token for utilizing the Pennsieve API. Reads the api token and secret from the Pennsieve config.ini file.
        get cognito config . If no target profile name is provided the default profile is used. 
    """
    
    r = requests.get(f"{PENNSIEVE_URL}/authentication/cognito-config")
    r.raise_for_status()

    cognito_app_client_id = r.json()["tokenPool"]["appClientId"]
    cognito_region_name = r.json()["region"]

    cognito_idp_client = boto3.client(
        "cognito-idp",
        region_name=cognito_region_name,
        aws_access_key_id="",
        aws_secret_access_key="",
    )

    login_response = cognito_idp_client.initiate_auth(
    AuthFlow="USER_PASSWORD_AUTH",
    AuthParameters={"USERNAME": get_profile_name_from_api_key("api_token"), "PASSWORD": get_profile_name_from_api_key("api_secret")},
    ClientId=cognito_app_client_id,
    )

    cached_access_token = login_response["AuthenticationResult"]["AccessToken"]

    return cached_access_token




model_main_curation_function_response = api.model( "MainCurationFunctionResponse", {
    "main_curate_progress_message": fields.String(description="Progress message from the main curation function"),
    "main_total_generate_dataset_size": fields.String(description="Total size of the dataset"),
    "main_curation_uploaded_files": fields.Integer(description="Number of files that are being generated. "), 
    "local_manifest_id": fields.String(description="ID of the local manifest file created by the Pennsieve Agent for the upload."),
    "origin_manifest_id": fields.String(description="ID of the manifest file created on Pennsieve for the upload."),
    "main_curation_total_files": fields.Integer(description="Total number of files in the dataset upload session."),
})





global generate_start_time
global main_curate_progress_message

generate_start_time = 0
main_curate_progress_message = ""

@api.route("/curation")
class Curation(Resource):

    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad Request', 403: 'Forbidden'}, 
    description="Given a sodajsonobject generate a dataset. Used in the final step of Organize Datasets.")   
    @api.marshal_with(model_main_curation_function_response)
    def post(self):
        global generate_start_time 
        generate_start_time = time.time()

        data = request.get_json()

        api.logger.info('/curation POST request')
        
        account_name = get_account_name()
        ps = connect_pennsieve_client(account_name)

        r = requests.post(f"{PENNSIEVE_URL}/datasets", headers={"Content-Type": "application/json", "Authorization": f"Bearer {get_access_token()}",}, json={"name": "400GB-test"})
        r.raise_for_status()
        ds_id = r.json()["content"]["id"]
        ps.use_dataset(ds_id)
        main_curate_progress_message = ("Uploading data files...")
        folder_path = os.path.join(os.path.expanduser("~"), "400GB-dataset")
        md = ps.manifest.create(folder_path, "/")

        ps.manifest.upload(md.manifest_id)

        count = 0
        # subscribe to the manifest upload so we wait until it has finished uploading before moving on {Mock for now to verify Agent to isolate variables}
        while True:
            for i in range(100000):
                count += 1

        return {
            "main_curate_progress_message": "Finished",
            "main_total_generate_dataset_size": "Bigly",
            "main_curation_uploaded_files": 400,
            "local_manifest_id": "23",
            "origin_manifest_id": "24",
            "main_curation_total_files": 24456
        }





@api.route("/curation/progress")
class CurationProgress(Resource):
    def get(self):
        global generate_start_time
        global main_curate_progress_message
        return {
            "main_curate_status": "Generating that dataset",
            "start_generate": 1,
            "main_curate_progress_message": main_curate_progress_message,
            "main_total_generate_dataset_size": 50000000,
            "main_generated_dataset_size": 10000,
            "elapsed_time_formatted": time.time() - generate_start_time,
            "total_files_uploaded": 10,
            "generated_dataset_id": "N:dataset:test",
            "generated_dataset_int_id": 1234,
            "curation_error_message": "Whoops forry folks",
        }






