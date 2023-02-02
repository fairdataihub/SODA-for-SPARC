import requests
import pandas as pd

def load_manifest_to_dataframe(node_id, type, ps_or_token):
    """
    Given a manifests package id and its storage type - excel or csv - returns a pandas dataframe.
    IMP: Pass in the pennsieve token or pennsieve object to ps_or_token for authentication.
    """
    payload = {"data": {"nodeIds": [node_id]}}
    headers = { "Content-Type" : "application/json" }
    # headers = create_request_headers(ps_or_token)
    r = requests.post(f"https://api.pennsieve.io/zipit/?api_key={ps_or_token}", json=payload, headers=headers)
    if type == "csv":
        return pd.read_csv(r.content, engine="openpyxl")
    else:
        return pd.read_excel(r.content, engine="openpyxl")