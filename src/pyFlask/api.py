from validator import validate_dataset_pipeline
from flask import Flask, jsonify, request, json
import base64
from organize_datasets import ps_retrieve_dataset

app = Flask(__name__)

@app.route("/")
def hello_world():
    return jsonify("Hello world")

@app.route("/api_ps_retrieve_dataset")
def api_ps_retrieve_dataset():
    # ps_retrieve_dataset()
    obj = request.args.get("obj")

    parsedObj = json.loads(obj)

    account = parsedObj["bf-account-selected"]
    
    
    return jsonify("Retrieved dataset")


@app.route("/api_validate_dataset_pipeline")
def api_validate_dataset_pipeline():
    # validate_dataset_pipeline()
    return jsonify("Dataset pipeline completed")

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
    # app.run(host="127.0.0.1", port=7632, debug=True)