import requests
from authentication import get_access_token
from utils import create_request_headers
from namespaces import NamespaceEnum, get_namespace_logger
from constants import PENNSIEVE_URL


namespace_logger = get_namespace_logger(NamespaceEnum.MANAGE_DATASETS)

def get_workspace_contributors():
    try: 
        r = requests.get(f'{PENNSIEVE_URL}/contributors')
        r.raise_for_status()
        return r.json()
    except Exception as e:
        namespace_logger.error(e)
    
        
def create_workspace_contributors(contributors):
    try:
        for con in contributors:
            payload = {
                "email": con['email'],
                "lastName": con['last_name'],
                "firstName": con['first_name'],
                "orcid": con['orcid']
            }

            # TODO: Handle if they contributor already exists?
            r = requests.post(f'{PENNSIEVE_URL}/contributors', json=payload, headers=create_request_headers(get_access_token()))
            r.raise_for_status()
    except Exception as e:
        namespace_logger.error(e)
        raise e