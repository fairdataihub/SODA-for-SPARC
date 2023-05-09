"""
Purpose: Functions for dealing with the pennsieve config file located at ~/.pennsieve/config.ini 
"""
from constants import PENNSIEVE_URL

def add_api_host_to_config(configparser, target_section_name, configpath):
    """
    Args:
        configparser: configparser object
        target_section_name: the section name to add the api_host to. Should be an account section. 
        configpath: the path to the config file ( ~/.pennsieve/config.ini )
    Action:
        Adds api_host to the section of the configparser object if it does not exist in the given section.
        If given a section name that is 'agent' it will do nothing.
    """

    # do not add the api_host key to the agent section of the config
    if target_section_name == 'agent':
        return 

    if not configparser.has_option(target_section_name, "api_host"):
        configparser.set(target_section_name, "api_host", PENNSIEVE_URL)

    with open(configpath, "w+") as configfile:
        configparser.write(configfile)



def lowercase_account_names(config, account_name, configpath):
    """
    Args:
        config: configparser object
        account_name: the account name to convert to lowercase
    Action:
        Converts the account name and global default_profile value to lowercase and updates the config file.
    """
    # if the section exists lowercased do nothing 
    if config.has_section(account_name.lower()):
        return

    # add the section back with the lowercase account name
    config.add_section(account_name.lower()) 
    config.set(account_name.lower(), "api_host", config.get(account_name, "api_host"))
    config.set(account_name.lower(), "api_token", config.get(account_name, "api_token"))
    config.set(account_name.lower(), "api_secret", config.get(account_name, "api_secret"))

    # set the global default_profile option to lowercase
    config.set("global", "default_profile", account_name.lower())

    # remove the existing section
    config.remove_section(account_name)

    # finalize the changes
    with open(configpath, "w+") as configfile:
        config.write(configfile)