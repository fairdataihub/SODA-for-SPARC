# -*- coding: utf-8 -*-

### Import required python modules

from gevent import monkey

monkey.patch_all()
import platform
import os
from os import listdir, stat, makedirs, mkdir, walk, remove, pardir
from os.path import (
    isdir,
    isfile,
    join,
    splitext,
    getmtime,
    basename,
    normpath,
    exists,
    expanduser,
    split,
    dirname,
    getsize,
    abspath,
)
import pandas as pd
import time
from time import strftime, localtime
import shutil
from shutil import copy2
from configparser import ConfigParser
import numpy as np
from collections import defaultdict
import subprocess
from websocket import create_connection
import socket
import errno
import re
import gevent
from pennsieve import Pennsieve
from pennsieve.log import get_logger
from pennsieve.api.agent import agent_cmd
from pennsieve.api.agent import AgentError, check_port, socket_address
from urllib.request import urlopen
import json
import collections
from threading import Thread
import pathlib

from datetime import datetime, timezone
from pysoda import bf_get_current_user_permission

"""
    Function to get current doi for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Current doi or "None"
    """


def bf_get_doi(selected_bfaccount, selected_bfdataset):

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve account"
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve dataset"
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ["owner", "manager"]:
            error = "Error: You don't have permissions to view/edit DOI for this Pennsieve dataset"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        doi_status = bf._api._get("/datasets/" + str(selected_dataset_id) + "/doi")
        return doi_status["doi"]
    except Exception as e:
        if "doi" in str(e) and "not found" in str(e):
            return "None"
        else:
            raise e


"""
    Function to reserve doi for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Success or error message
"""


def bf_reserve_doi(selected_bfaccount, selected_bfdataset):

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve account"
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve dataset"
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ["owner", "manager"]:
            error = "Error: You don't have permissions to view/edit DOI for this Pennsieve dataset"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        res = bf_get_doi(selected_bfaccount, selected_bfdataset)
        if res != "None":
            error = "Error: A DOI has already been reserved for this dataset"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        contributors_list = bf._api._get(
            "/datasets/" + str(selected_dataset_id) + "/contributors"
        )
        creators_list = []
        for item in contributors_list:
            creators_list.append(item["firstName"] + " " + item["lastName"])
        jsonfile = {
            "title": selected_bfdataset,
            "creators": creators_list,
        }
        bf._api.datasets._post("/" + str(selected_dataset_id) + "/doi", json=jsonfile)
        return "Done!"
    except Exception as e:
        raise e


"""
    Function to get the review request status and publishing status of a dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Current reqpusblishing status
    """


def bf_get_publishing_status(selected_bfaccount, selected_bfdataset):

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve account"
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve dataset"
        raise Exception(error)

    try:
        selected_dataset_id = myds.id

        review_request_status = bf._api._get("/datasets/" + str(selected_dataset_id))[
            "publication"
        ]["status"]
        publishing_status = bf._api._get(
            "/datasets/" + str(selected_dataset_id) + "/published"
        )["status"]

        return [review_request_status, publishing_status]
    except Exception as e:
        raise e


"""
    Function to publish for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Success or error message
"""


def bf_submit_review_dataset(selected_bfaccount, selected_bfdataset):

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve account"
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve dataset"
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ["owner"]:
            error = "Error: You must be dataset owner to send a dataset for review"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        request_publish = bf._api._post(
            "/datasets/"
            + str(selected_dataset_id)
            + "/publication/request?publicationType="
            + "publication"
        )
        return request_publish
    except Exception as e:
        raise e


def bf_withdraw_review_dataset(selected_bfaccount, selected_bfdataset):

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve account"
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve dataset"
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ["owner"]:
            error = "Error: You must be dataset owner to withdraw a dataset from review"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        withdraw_review = bf._api._post(
            "/datasets/"
            + str(selected_dataset_id)
            + "/publication/cancel?publicationType="
            + "publication"
        )
        return withdraw_review
    except Exception as e:
        raise e


"""
    DEPRECATED

    Function to publish for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Success or error message
"""


def bf_publish_dataset(selected_bfaccount, selected_bfdataset):

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve account"
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve dataset"
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ["owner"]:
            error = "Error: You must be dataset owner to publish a dataset"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        request_publish = bf._api._post(
            "/datasets/" + str(selected_dataset_id) + "/publish"
        )
        return request_publish["status"]
    except Exception as e:
        raise e
