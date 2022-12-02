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