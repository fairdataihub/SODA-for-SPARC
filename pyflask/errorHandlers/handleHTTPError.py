from flask import abort


def handle_http_error(e):
    prefix, suffix = get_prefix_suffix(e)    
    if "400" in prefix:    
        abort(400, suffix)
    if "401" in prefix:
        abort(401, suffix)
    if "403" in prefix:
        abort(403, suffix)
    if "404" in prefix:
        abort(404, suffix)
    abort(500, "Something went wrong while processing your request. Please try again later.")


def get_prefix_suffix(e):
    """
    Returns the prefix and suffix of the exception.
    """
    split_err = str(e).split(":")
    prefix = split_err[0]
    suffix = ''.join(split_err[1:]).strip()

    return prefix, suffix