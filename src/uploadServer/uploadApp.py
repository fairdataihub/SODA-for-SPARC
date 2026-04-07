from flask import Flask, request
import os
import requests
from pennsieve import Pennsieve
import time
from configparser import ConfigParser
import boto3
import threading


app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello, World!"


PENNSIEVE_URL = "https://api.pennsieve.io"
userpath = os.path.expanduser("~")
configpath = os.path.join(userpath, ".pennsieve", "config.ini")


upload_subprocess = None
thread = None
session_manifest_id = None
done = False
session_timer = None
session_dataset_id = None

def monitor_subscriber_progress(events_dict):
    """
    Monitors the progress of a subscriber and unsubscribes once the upload finishes. 
    """
    global done
    global session_timer
    global ps

    now = time.time()

    elapsed_time = now - session_timer

    if elapsed_time > 1800:
        ps.unsubscribe(10)
        ps = None
        # app.logger.info("[SUBSCRIBER Ended]")

    if events_dict["type"] == 1:  # upload status: file_id, total, current, worker_id
        file_id = events_dict["upload_status"].file_id
        total_bytes_to_upload = events_dict["upload_status"].total
        current_bytes_uploaded = events_dict["upload_status"].current

        status = events_dict["upload_status"].status
        if status == "2" or status == 2:
            done = True
            ps.unsubscribe(10) 
            ps = None
            # app.logger.info("[UPLOAD COMPLETE EVENT RECEIVED]")

def get_account_name():
    config = ConfigParser()
    config.read(configpath)
    if "global" not in config:
        raise Exception("Profile has not been set")

    keyname = config["global"]["default_profile"]
    return keyname


def get_profile_name_from_api_key(key):
    config = ConfigParser()
    config.read(configpath)
    if "global" not in config:
        raise Exception("Profile has not been set")

    keyname = config["global"]["default_profile"]

    if keyname in config and key in config[keyname]:
        return config[keyname][key]
    return None

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

def connect_pennsieve_client(account_name):
    """
        Connects to Pennsieve Python client to the Agent and returns the initialized Pennsieve object.
    """
    return Pennsieve(profile_name=account_name)


@app.route("/curation/subscribe", methods=["POST"])
def curationSubscription():
      global session_timer
      global done

      # get query args
      d_id = request.get_json('dataset_id')

      account_name = get_account_name()
      app.logger.info("Trying to connect to the Pennsieve client")
      ps = connect_pennsieve_client(account_name)
      app.logger.info("Connected to the Pennsieve client")
      ps.set_dataset(d_id)
      ps.subscribe(10, False, monitor_subscriber_progress)
      done = True

    #   app.logger.info("Creating subscription session")
    #   session_timer = time.time()
    #   thread = threading.Thread(target=ps.subscribe, args=(10, False, monitor_subscriber_progress))
    #   thread.start()

      return {"session_complete": True, "done": done}



@app.route("/curation/progress", methods=["GET"])
def CurationProgress():
  global main_curate_progress_message
  global done


  return {
      "main_curate_status": "Generating that dataset",
      "start_generate": 1,
      "main_curate_progress_message": main_curate_progress_message,
      "main_total_generate_dataset_size": 50000000,
      "main_generated_dataset_size": 10000,
      "elapsed_time_formatted": time.time(),
      "total_files_uploaded": 10,
      "generated_dataset_id": "N:dataset:test",
      "generated_dataset_int_id": 1234,
      "curation_error_message": "Whoops forry folks",
      "done": done
  }


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000)