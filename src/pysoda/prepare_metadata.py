# -*- coding: utf-8 -*-

### Import required python modules
import logging

from gevent import monkey; monkey.patch_all()
import platform
import os
from os import listdir, stat, makedirs, mkdir, walk, remove, pardir
from os.path import isdir, isfile, join, splitext, getmtime, basename, normpath, exists, expanduser, split, dirname, getsize, abspath
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
from blackfynn import Blackfynn
from blackfynn.log import get_logger
from blackfynn.api.agent import agent_cmd
from blackfynn.api.agent import AgentError, check_port, socket_address
from urllib.request import urlopen
import json
import collections
from threading import Thread
import pathlib

from openpyxl import load_workbook
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font
from docx import Document

from datetime import datetime, timezone

userpath = expanduser("~")
metadatapath = join(userpath, 'SODA', 'SODA_metadata')
DEV_TEMPLATE_PATH = join(dirname(__file__), "..", "file_templates")
# once pysoda has been packaged with pyinstaller
# it becomes nested into the pysodadist/api directory
PROD_TEMPLATE_PATH = join(dirname(__file__), "..", "..", "file_templates")
TEMPLATE_PATH = DEV_TEMPLATE_PATH if exists(DEV_TEMPLATE_PATH) else PROD_TEMPLATE_PATH

logging.basicConfig(level=logging.DEBUG, filename=os.path.join(os.path.expanduser("~"), f"{__name__}.log"))
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler(os.path.join(os.path.expanduser("~"), f"{__name__}.log"))
handler.setLevel(logging.DEBUG)
logger.addHandler(handler)


class InvalidDeliverablesDocument(Exception):
    pass

### Import Milestone document
def import_milestone(filepath):
    doc = Document(filepath)
    try:
        table = doc.tables[0]
    except IndexError:
        raise InvalidDeliverablesDocument("Please select a valid SPARC Deliverables Document! The following headers could not be found in a table of the document you selected: Related milestone, aim, or task, Description of data, and Expected date of completion.")
    data = []
    keys = None
    for i, row in enumerate(table.rows):
        text = (cell.text for cell in row.cells)
        # headers will become the keys of our dictionary
        if i == 0:
            keys = tuple(text)
            continue
        # Construct a dictionary for this row, mapping
        # keys to values for this row
        row_data = dict(zip(keys, text))
        data.append(row_data)
    return data

def extract_milestone_info(datalist):
    milestone = defaultdict(list)
    milestone_key1 = "Related milestone, aim, or task"
    milestone_key2 = "Related milestone, aim or task"
    other_keys = ["Description of data", "Expected date of completion"]
    for row in datalist:
        if milestone_key1 in row:
            milestone_key = milestone_key1
        elif milestone_key2 in row:
            milestone_key = milestone_key2
        else:
            raise InvalidDeliverablesDocument("Please select a valid SPARC Deliverables Document! The following headers could not be found in a table of the document you selected: Related milestone, aim, or task, Description of data, and Expected date of completion.")

        key = row[milestone_key]
        if key != "":
            milestone[key].append({key: row[key] for key in other_keys})

    return milestone

### Prepare submission file
def save_submission_file(filepath, json_str):
    source = join(TEMPLATE_PATH, "submission.xlsx")
    destination = filepath
    shutil.copyfile(source, destination)
    # json array to python list
    val_arr = json.loads(json_str)
    # write to excel file
    wb = load_workbook(destination)
    ws1 = wb['Sheet1']
    # date_obj = datetime.strptime(val_arr[2], "%Y-%m")
    # date_new = date_obj.strftime("%m-%Y")
    ws1["C2"] = val_arr[0]
    ws1["C3"] = val_arr[1]
    ws1["C4"] = val_arr[2]

    wb.save(destination)

from string import ascii_uppercase
import itertools


def excel_columns():
    """
    NOTE: does not support more than 699 contributors/links
    """
    # start with column D not A
    single_letter = list(ascii_uppercase[3:])
    two_letter = [a + b for a,b in itertools.product(ascii_uppercase, ascii_uppercase)]
    return single_letter + two_letter

def rename_headers(workbook, keyword_array, contributor_role_array, funding_array, total_link_array):
    """
    Rename header columns if values exceed 3. Change Additional Values to Value 4, 5,...
    """
    # keywords
    keyword_len = len(keyword_array)

    # contributors
    no_contributors = len(contributor_role_array)

    # funding = SPARC award + other funding sources
    funding_len = len(funding_array)

    # total links added
    link_len = len(total_link_array)

    max_len = max(keyword_len, funding_len, link_len, no_contributors)

    columns_list = excel_columns()
    if max_len > 3:

        workbook[columns_list[0] + "1"] = "Value"

        for i, column in zip(range(2, max_len+1), columns_list[1:]):

            workbook[column + "1"] = "Value " + str(i)
            cell = workbook[column + "1"]

            blueFill = PatternFill(start_color='9CC2E5',
                               end_color='9CC2E5',
                               fill_type='solid')

            font = Font(bold=True)
            cell.fill = blueFill
            cell.font = font


    else:

        delete_range = len(columns_list) - max_len - 1
        workbook.delete_cols(4+max_len, delete_range)


### Prepare dataset-description file

def populate_dataset_info(workbook, val_array):
    ## name, description, samples, subjects
    workbook["D2"] = val_array[0]
    workbook["D3"] = val_array[1]
    workbook["D17"] = val_array[3]
    workbook["D16"] = val_array[4]

    ## keywords
    for i, column in zip(range(len(val_array[2])), excel_columns()):
        workbook[column + "4"] = val_array[2][i]

    return val_array[2]

def populate_contributor_info(workbook, val_array):
    ## award info
    for i, column in zip(range(len(val_array["funding"])), excel_columns()):
        workbook[column + "11"] = val_array["funding"][i]

    ### Acknowledgments
    workbook["D10"] = val_array["acknowledgment"]

    ### Contributors
    for contributor, column in zip(val_array['contributors'], excel_columns()):
        workbook[column + "5"] = contributor["conName"]
        workbook[column + "6"] = contributor["conID"]
        workbook[column + "7"] = contributor["conAffliation"]
        workbook[column + "9"] = contributor["conContact"]
        workbook[column + "8"] = contributor["conRole"]

    return [val_array["funding"], val_array['contributors']]

def populate_links_info(workbook, val_array):
    ## originating DOI, Protocol DOI
    total_link_array = val_array["Originating Article DOI"] + val_array["Protocol URL or DOI*"] + val_array["Additional Link"]
    for i, column in zip(range(len(total_link_array)), excel_columns()):
        if total_link_array[i]["link type"] == "Originating Article DOI":
            workbook[column + "12"] = total_link_array[i]["link"]
            workbook[column + "13"] = ""
            workbook[column + "14"] = ""
            workbook[column + "15"] = total_link_array[i]["description"]
        if total_link_array[i]["link type"] == "Protocol URL or DOI*":
            workbook[column + "12"] = ""
            workbook[column + "13"] = total_link_array[i]["link"]
            workbook[column + "14"] = ""
            workbook[column + "15"] = total_link_array[i]["description"]
        if total_link_array[i]["link type"] == "Additional Link":
            workbook[column + "12"] = ""
            workbook[column + "13"] = ""
            workbook[column + "14"] = total_link_array[i]["link"]
            workbook[column + "15"] = total_link_array[i]["description"]

    return total_link_array

def populate_completeness_info(workbook, val_array, bfaccountname):
    ## completeness, parent dataset ID, title Respectively
    workbook["D18"] = val_array["completeness"]
    workbook["D20"] = val_array["completeDSTitle"]

    ## parent Datasets
    parentds_id_array = []
    try:
        bf = Blackfynn(bfaccountname)

        for dataset in val_array["parentDS"]:

            myds = bf.get_dataset(dataset)
            dataset_id = myds.id
            parentds_id_array.append(dataset_id)

            workbook["D19"] = ", ".join(parentds_id_array)

    except Exception as err:
        # NOTE: blackfynn package 3.2.0 misspells 'invalid'
        if 'Invalid profile name' in str(err) or "Invaid profile name" in str(err):
            raise Exception("Please connect SODA with Blackfynn to use this feature!")
        raise

### generate the file
def save_ds_description_file(bfaccountname, filepath, dataset_str, misc_str, optional_str, con_str):
    source = join(TEMPLATE_PATH, "dataset_description.xlsx")
    destination = filepath
    shutil.copyfile(source, destination)

    # json array to python list
    val_arr_ds = json.loads(dataset_str)
    val_arr_con = json.loads(con_str)
    val_arr_misc = json.loads(misc_str)
    val_arr_optional = json.loads(optional_str)

    # write to excel file
    wb = load_workbook(destination)
    ws1 = wb['Sheet1']

    ret_val_1 = populate_dataset_info(ws1, val_arr_ds)
    ret_val_2 = populate_contributor_info(ws1, val_arr_con)
    ret_val_3 = populate_links_info(ws1, val_arr_misc)
    populate_completeness_info(ws1, val_arr_optional, bfaccountname)

    rename_headers(ws1, ret_val_1, ret_val_2[1], ret_val_2[0], ret_val_3)

    wb.save(destination)
