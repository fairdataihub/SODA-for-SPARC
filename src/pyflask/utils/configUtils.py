from os.path import expanduser, join, exists
from configparser import ConfigParser

userpath = expanduser("~")
configpath = join(userpath, ".pennsieve", "config.ini")


def get_profile_api_key_and_secret(profile):
    """
      Returns the api key and secret for the given profile if they exist.
    """
    if not exists(configpath):
        # raise file not found exception 
        raise FileNotFoundError("The Pennsieve config.ini file was not found.")
        
    config = ConfigParser()
    config.read(configpath)

    if not config.has_section(profile):
        return (None, None)
    
    api_key = config[profile]["api_token"]
    api_secret = config[profile]["api_secret"]

    return (api_key, api_secret)
    