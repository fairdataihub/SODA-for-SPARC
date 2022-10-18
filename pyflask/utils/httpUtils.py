


def create_request_headers(ps):
    """
    Creates necessary HTTP headers for making Pennsieve API requests.
    Input: 
        ps: Pennsieve object for a user that has been authenticated
    """
    return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {ps.getUser()['session_token']}",
    }
