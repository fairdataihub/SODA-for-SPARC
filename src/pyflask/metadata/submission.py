from os.path import join, getsize
from openpyxl import load_workbook
from openpyxl.styles import Font
import shutil
import tempfile
from .helpers import upload_metadata_file, get_template_path


from .constants import METADATA_UPLOAD_PS_PATH, TEMPLATE_PATH
from .excel_utils import rename_headers, excel_columns
from utils import validate_schema


### Create submission file
def create_excel(soda, upload_boolean, local_destination):
    """
    Create an Excel file for submission metadata.

    Args:
        soda (dict): The soda object containing dataset metadata.
        upload_boolean (bool): Whether to upload the file to Pennsieve.
        destination_path (str): The path to save the Excel file.

    Returns:
        dict: A dictionary containing the size of the metadata file.
    """

    validate_schema(soda["dataset_metadata"]["submission"], "submission_schema.json")

    font_submission = Font(name="Calibri", size=14, bold=False)

    source = get_template_path("submission.xlsx")

    destination = join(METADATA_UPLOAD_PS_PATH, "submission.xlsx") if upload_boolean else local_destination

    try:
        shutil.copyfile(source, destination)
    except FileNotFoundError as e:
        raise e
    
    #TODO: Do not use an array for the non-array values; zipping for the sake of the ascii value is not necessary until milestone_achieved
    submission_metadata_list = [
        soda["dataset_metadata"]["submission"]
    ]

    # write to excel file
    wb = load_workbook(destination)
    ws1 = wb["Sheet1"]
    start_index = 2
    for column, submission_data in zip(excel_columns(start_index), submission_metadata_list):
        ws1[column + "2"] = submission_data["consortium_data_standard"]
        ws1[column + "3"] = submission_data["funding_consortium"]
        ws1[column + "4"] = submission_data["award_number"]
        for col, milestone in zip(excel_columns(start_index), submission_data["milestone_achieved"]):
            ws1[col + str(5)] = milestone
        ws1[column + "6"] = submission_data["milestone_completion_date"]
        ws1[column + "2"].font = font_submission
        ws1[column + "3"].font = font_submission
        ws1[column + "4"].font = font_submission
        ws1[column + "5"].font = font_submission
        ws1[column + "6"].font = font_submission

    # TODO: should milestone completion date also be an array?
    rename_headers(ws1, len(submission_metadata_list[0]["milestone_achieved"]), 2)

    wb.save(destination)

    print("Excel file created successfully at:", destination)

    wb.close()

    # calculate the size of the metadata file
    size = getsize(destination)

    

    ## if generating directly on Pennsieve, then call upload function and then delete the destination path
    if upload_boolean:
        print("Uploading Excel file to Pennsieve...")
        upload_metadata_file("submission.xlsx", soda, destination, True)
        print("Excel file uploaded successfully to Pennsieve.")
    return {"size": size}









