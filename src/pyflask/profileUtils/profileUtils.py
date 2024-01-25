import requests 

def create_unique_profile_name(token, machine_username_specifier):
    try:
        # get the users email
        PENNSIEVE_URL = "https://api.pennsieve.io"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }


        r = requests.get(f"{PENNSIEVE_URL}/user", headers=headers)    
        r.raise_for_status()    

        user_info = r.json()

        # create a substring of the start of the email to the @ symbol
        email = user_info["email"]
        email_sub = email.split("@")[0]

        organization_id = user_info["preferredOrganization"]

        # create an updated profile name that is unqiue to the user and their workspace 
        return f"soda-pennsieve-{machine_username_specifier}-{email_sub}-{organization_id.lower()}"
    except Exception as e:
        raise e