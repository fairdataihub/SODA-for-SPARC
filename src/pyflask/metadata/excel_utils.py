from string import ascii_uppercase
import itertools
from openpyxl.styles import PatternFill, Font



def rename_headers(workbook, max_len, start_index):
  """
  Rename header columns if values exceed 3. Change Additional Values to Value 4, 5,...
  Adds styling to the column headers as well.
  """

  columns_list = excel_columns(start_index=start_index)
  if max_len >= start_index:
      workbook[columns_list[0] + "1"] = "Value"
      for i, column in zip(range(2, max_len + 1), columns_list[1:]):

          workbook[column + "1"] = f"Value {str(i)}"
          cell = workbook[column + "1"]

          blueFill = PatternFill(
              start_color="9CC2E5", end_color="9CC2E5", fill_type="solid"
          )

          font = Font(bold=True)
          cell.fill = blueFill
          cell.font = font

  else:
      delete_range = len(columns_list) - max_len
      workbook.delete_cols(4 + max_len, delete_range)



def excel_columns(start_index=0):
    """
    NOTE: does not support more than 699 contributors/links
    """
    single_letter = list(ascii_uppercase[start_index:])
    two_letter = [a + b for a, b in itertools.product(ascii_uppercase, ascii_uppercase)]
    return single_letter + two_letter
