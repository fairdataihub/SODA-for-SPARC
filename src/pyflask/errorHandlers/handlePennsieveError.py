from flask import abort


def handle_http_error(e):
    """
        Pennsieve errors are spawned from the requests library. Handling them is cumbersome so it is placed in this function.
    """
    if type(e).__name__ == "HTTPError":
        abort(400, e.response.json()["message"])
    
    abort(500, "An internal server error prevented the request from being fulfilled. Please try again later.")