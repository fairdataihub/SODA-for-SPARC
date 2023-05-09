import requests
import pandas as pd

def load_manifest_to_dataframe(node_id, file_type, ps_or_token, usecols=None, header=0):
    """
    Given a manifests package id and its storage type - excel or csv - returns a pandas dataframe.
    IMP: Pass in the pennsieve token or pennsieve object to ps_or_token for authentication.

    Args:
        node_id (str): The id of the manifest package.
        type (str): The type of the manifest - csv or excel.
        ps_or_token (str): The pennsieve token or pennsieve object.
        usecols (list, optional): The columns to be used. Defaults to None.
        header (int, optional): The header row. Defaults to 0.
    """
    payload = {"data": {"nodeIds": [node_id]}}
    headers = { "Content-Type" : "application/json" }
    # headers = create_request_headers(ps_or_token)
    if type(ps_or_token) == str:
        r = requests.post(f"https://api.pennsieve.io/zipit/?api_key={ps_or_token}", json=payload, headers=headers)
    else:
        token = ps_or_token.get_user().session_token
        r = requests.post(f"https://api.pennsieve.io/zipit/?api_key={token}", json=payload, headers=headers)

    if file_type == "csv":
        return pd.read_csv(r.content, engine="openpyxl")
    else:
        return pd.read_excel(r.content, engine="openpyxl", usecols=usecols, header=header)