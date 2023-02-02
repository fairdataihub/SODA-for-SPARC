import pandas as pd 
import requests 
# from xml.etree import ElementTree as ET

# url = "https://prd-sparc-storage-use1.s3.amazonaws.com/O367/D2441/13ebaf7d-ac1c-46d1-b650-9f1a4be2bafe/cab88b91-e8ce-41c7-9322-23bb5c493ead?X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGAaCXVzLWVhc3QtMSJHMEUCIBQk6v48afTUjuSJa0piZ6w3d1K533rvzUiUsm6OQ3dhAiEA2g1gF8Ut0AogehaWAx1aSCjIVhlXayICVVos9gjjse0qigQI2P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARACGgw3NDA0NjMzMzcxNzciDHykVjIDsF41G%2BJYnCreAzvZCK%2FO9k%2By5ktzo2aEjD39VxF9EAraYn7L1gj0xQkz2BojBxiB%2F1gdsC4e%2F9ibfyaKH2X8aggORsqNmffQg13Sbb8b5AFlHe5OvXFWBq7j9o5cTclJTzB%2F2XEiRbMd27cYzxUOeRgC%2BqEr9DumSMqZ8Ptame%2FmiheVTrolh1%2Fjtzc4tzx74bJECsRzobcLrL2N8vYo%2BDyJSlBX%2BYCHceITNy9oHwEs%2BBeG5v%2BGp%2FBPZBBEIua0rI8LXfnuNA0yXmAW0FWCzenhSaoRmslRp2Ik9qdFcrE2r%2FhIwHYS6i8DWaof3Cgt4VqUeFoBlfU2CsOx4d%2FyUI3xSF9S6Xk7JynZBz1lBI%2BqL2jb3sBYced5GwjqFnhhJgHZSGr53k46x7jZcH4LyaYQ%2BruZextJURJLoWr3l4gsN6wZM3Hb9Z9f3uU1rFL14s%2FxcFWJBJcBpCYdY1VCWx26W6jtVHuOESFJnURlD%2FA4uCOYneHuauExoGBbgdrIZ8MQroQ0ie6rsgRcE3SLGveuPV8yFQom3Sd%2FEXDQLkfm%2B7RxByNUSxm1NE184ECIX5I1ub8csiOT9TEQGcxgDwPrDQw%2BqEINcGUIXloHPQovCSaMAJ6EKWLG4pHNmZQC6XAqP743ldsw9KXvngY6pQG1fdT%2BgeXn078ckEaQpGiDSiDAE0TWR3rJ3Ckbq298rG%2Bliup9bm9pZTfMazpKg5mv9qZdzVVeWYCHFWNt0zf1rI2HAa%2B8BDYkjuGCAW%2F8TrHlcBlFJvmZL3eOUYdMH7mJbjh5PdJFlXLdtKmMt3XmQ7BfVZLl9P5RkSqqRWp1%2F%2F2aTYuevDGegBrVG%2BdYjGHzyix7YYYFZDKjosKcldADO6lmFVI%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20230202T174843Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Credential=ASIA2YZYN33MXTNFH4PQ%2F20230202%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=a4ba425bcfa675932398ea57566fc3806860bd30b6441efa2217d39d5ba8d0f5"

# res = r.get(url)
# # tree = ET.fromstring(res.content)

# # pd.read_xml(tree)

# pd.read_xml(res.content)

# df = pd.read_excel(url, engine="openpyxl", storage_options={"verify": False})
# print(df)

# payload = {"data": {"nodeIds": ["N:package:eb853df1-ad7d-4397-af51-b61a54741c94"]}}
# headers = { "Content-Type" : "application/json" }
# resp = r.post("https://api.pennsieve.io/zipit/?api_key=eyJraWQiOiJwcjhTaWE2dm9FZTcxNyttOWRiYXRlc3lJZkx6K3lIdDE4RGR5aGVodHZNPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI2ODBlOTg5ZC1hMmJlLTQ1MzItOGZkZC1mY2IzNmFkNzg5ZTAiLCJkZXZpY2Vfa2V5IjoidXMtZWFzdC0xXzdkM2IxYWVhLTExZmUtNDNkNS04MmY1LTQ3NTY0MWNhMjk1MyIsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwvdXMtZWFzdC0xX2IxTnl4WWNyMCIsImNsaWVudF9pZCI6IjY3MG1vN3NpODFwY2Mzc2Z1YjdvMTkxNGQ4Iiwib3JpZ2luX2p0aSI6IjA5OGUyZjg4LWMzYzItNDU4MC04ZTAwLTM2YjlkYmQ2OWFlZCIsImV2ZW50X2lkIjoiNmJjN2E0MjItZTMyYy00YzY3LWI3MzQtNTgzNWFjOGRhZjdkIiwidG9rZW5fdXNlIjoiYWNjZXNzIiwic2NvcGUiOiJhd3MuY29nbml0by5zaWduaW4udXNlci5hZG1pbiIsImF1dGhfdGltZSI6MTY3NTMwNjU4NywiZXhwIjoxNjc1MzY3NDM0LCJpYXQiOjE2NzUzNjM4MzQsImp0aSI6IjlkNjMxYmEyLTU3ZDgtNGU5Yy1hODliLWRjYjRlYzM1NTU1NCIsInVzZXJuYW1lIjoiNjgwZTk4OWQtYTJiZS00NTMyLThmZGQtZmNiMzZhZDc4OWUwIn0.GyTWtsNGOyLR9RL591RwdiOlK0A8Bp_Fj_StOcW2oVXDEUk9f2R4Y9L6ePcOBnTZfC6JxdxFnM7Cu8o6MLlDqY7E6uUcbmuUyH8OfoVguj8dtOM61NhDjRRPLvPcnt5CD0sT-CJntQLEHs6c8MffIRc7kPQuvg2cjNGa-1W-CGW1JCYUllzGi1i5xiVmfOAqb7ikq829XFDU5e6ZobkCNc_aetqNt457UgsMc1elrNVjF6s6CLxNqmymNJilE890qVK8iTN2M52atv5jadg8H6NtO6kKFEhh-qjPuhaE_NWZSpK4SHSxfMSCGo9trdmTPPCKE7nzd-_RVL9VJmCzrg", json=payload, headers=headers)
# print(resp)
# print(resp.content)

# # with open("test.xlsx", "wb") as f:
# #     f.write(resp.content)



# ex = pd.read_excel(resp.content, engine="openpyxl")
# print(ex)

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

ids = "N:package:b7d76f1b-f823-4e7b-9a0b-fa35193cb3cf"

token = "eyJraWQiOiJwcjhTaWE2dm9FZTcxNyttOWRiYXRlc3lJZkx6K3lIdDE4RGR5aGVodHZNPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI2ODBlOTg5ZC1hMmJlLTQ1MzItOGZkZC1mY2IzNmFkNzg5ZTAiLCJkZXZpY2Vfa2V5IjoidXMtZWFzdC0xXzdkM2IxYWVhLTExZmUtNDNkNS04MmY1LTQ3NTY0MWNhMjk1MyIsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwvdXMtZWFzdC0xX2IxTnl4WWNyMCIsImNsaWVudF9pZCI6IjY3MG1vN3NpODFwY2Mzc2Z1YjdvMTkxNGQ4Iiwib3JpZ2luX2p0aSI6IjA5OGUyZjg4LWMzYzItNDU4MC04ZTAwLTM2YjlkYmQ2OWFlZCIsImV2ZW50X2lkIjoiNmJjN2E0MjItZTMyYy00YzY3LWI3MzQtNTgzNWFjOGRhZjdkIiwidG9rZW5fdXNlIjoiYWNjZXNzIiwic2NvcGUiOiJhd3MuY29nbml0by5zaWduaW4udXNlci5hZG1pbiIsImF1dGhfdGltZSI6MTY3NTMwNjU4NywiZXhwIjoxNjc1MzY3NDM0LCJpYXQiOjE2NzUzNjM4MzQsImp0aSI6IjlkNjMxYmEyLTU3ZDgtNGU5Yy1hODliLWRjYjRlYzM1NTU1NCIsInVzZXJuYW1lIjoiNjgwZTk4OWQtYTJiZS00NTMyLThmZGQtZmNiMzZhZDc4OWUwIn0.GyTWtsNGOyLR9RL591RwdiOlK0A8Bp_Fj_StOcW2oVXDEUk9f2R4Y9L6ePcOBnTZfC6JxdxFnM7Cu8o6MLlDqY7E6uUcbmuUyH8OfoVguj8dtOM61NhDjRRPLvPcnt5CD0sT-CJntQLEHs6c8MffIRc7kPQuvg2cjNGa-1W-CGW1JCYUllzGi1i5xiVmfOAqb7ikq829XFDU5e6ZobkCNc_aetqNt457UgsMc1elrNVjF6s6CLxNqmymNJilE890qVK8iTN2M52atv5jadg8H6NtO6kKFEhh-qjPuhaE_NWZSpK4SHSxfMSCGo9trdmTPPCKE7nzd-_RVL9VJmCzrg"

df = load_manifest_to_dataframe(ids, "excel", token)
# print(df)