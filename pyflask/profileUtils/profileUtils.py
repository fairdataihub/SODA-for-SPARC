import requests 

def create_unique_profile_name(token):
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

        # get the organizations this user account has access to 
        r = requests.get(f"{PENNSIEVE_URL}/organizations", headers=headers)
        r.raise_for_status()

        organizations = r.json()

        organization = None
        for org in organizations["organizations"]:
            if org["organization"]["id"] == organization_id:
                organization = org["organization"]["name"]

        # create an updated profile name that is unqiue to the user and their workspace 
        return f"SODA-Pennsieve-{email_sub}-{organization}"
    except Exception as e:
        raise e