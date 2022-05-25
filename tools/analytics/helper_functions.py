"""Hello Analytics Reporting API V4."""

from apiclient.discovery import build
from oauth2client.service_account import ServiceAccountCredentials

from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import calendar

SCOPES = ['https://www.googleapis.com/auth/analytics.readonly']
KEY_FILE_LOCATION = 'client_secrets.json'
VIEW_ID = '234549909'


def initialize_analyticsreporting():
  """Initializes an Analytics Reporting API V4 service object.

  Returns:
    An authorized Analytics Reporting API V4 service object.
  """
  credentials = ServiceAccountCredentials.from_json_keyfile_name(KEY_FILE_LOCATION, SCOPES)

  return build('analyticsreporting', 'v4', credentials=credentials)

def get_report(analytics, query):
  """Queries the Analytics Reporting API V4.

  Args:
    analytics: An authorized Analytics Reporting API V4 service object.
  Returns:
    The Analytics Reporting API V4 response.
  """
  return analytics.reports().batchGet(body=query).execute()

def print_response(response):
  """Parses and prints the Analytics Reporting API V4 response.

  Args:
    response: An Analytics Reporting API V4 response.
  """
  for report in response.get('reports', []):
    columnHeader = report.get('columnHeader', {})
    dimensionHeaders = columnHeader.get('dimensions', [])
    metricHeaders = columnHeader.get('metricHeader', {}).get('metricHeaderEntries', [])

    for row in report.get('data', {}).get('rows', []):
      dimensions = row.get('dimensions', [])
      dateRangeValues = row.get('metrics', [])

      for header, dimension in zip(dimensionHeaders, dimensions):
        print(f'{header}: ', dimension)

      for i, values in enumerate(dateRangeValues):
        print('Date range:', i)
        for metricHeader, value in zip(metricHeaders, values.get('values')):
          print(metricHeader.get('name') + ':', value)

def progress_bar_counter(dt, ds, update_interval):
  if update_interval == "Daily":
    return (ds - dt).days + 1

  weeks_counter = 0
  if update_interval == "Weekly":
    start = dt - timedelta(days=dt.weekday())
    end = start + timedelta(days=6)
    weeks_counter = 0

    while start <= ds:
      weeks_counter += 1
      start = start + timedelta(days=7)
      end = start + timedelta(days=6)

    return weeks_counter

  months_counter = 0
  if update_interval == "Monthly":
    start = end = dt

    start = start.replace(day=1)
    end = end.replace(day = calendar.monthrange(start.year, start.month)[1])
    months_counter = 0

    # Get the number of months for the progress bar
    while start <= ds:
      months_counter += 1
      start = start + relativedelta(months=+1)
      end = start = start.replace(day=1)
      end = end.replace(day = calendar.monthrange(start.year, start.month)[1])

    return months_counter

def next_date_interval(start, end, update_interval):
  if update_interval == "Daily":
    start = start + timedelta(days=1)
    end = start
    return start, end

  if update_interval == "Weekly":
    start = start + timedelta(days=7)
    end = start + timedelta(days=6)
    return start, end

  if update_interval == "Monthly":
    start = start + relativedelta(months=+1)
    end = start = start.replace(day=1)
    end = end.replace(day = calendar.monthrange(start.year, start.month)[1])
    return start, end

  if update_interval == "No Separation":
    start = end + relativedelta(months=+1)
    end = end.replace(day = calendar.monthrange(start.year, start.month)[1])
    return start, end


###########################################################

# if update_interval.value == "Monthly":
#     dt = start_date.value
#     ds = end_date.value

#     start = end = dt

#     start = start.replace(day=1)
#     end = end.replace(day = calendar.monthrange(start.year, start.month)[1])
#     months_counter = 0

#     # Get the number of months for the progress bar
#     while start <= ds:
#         months_counter += 1
#         start = start + relativedelta(months=+1)
#         end = start = start.replace(day=1)
#         end = end.replace(day = calendar.monthrange(start.year, start.month)[1])

#     start = end = dt
#     data = []

#     for i in trange(months_counter):
#         if start <= ds:
#             query = {
#                 'reportRequests': [
#                 {
#                     'viewId': VIEW_ID,
#                     'dateRanges': [{'startDate': start.strftime('%Y-%m-%d'), 'endDate': end.strftime('%Y-%m-%d')}],
#                     'metrics': [{'expression': 'ga:totalEvents'}],
#                     'dimensions': [{'name': 'ga:eventAction'}]
#                 }]
#             }

#             response = get_report(analytics, query)
#             if "rows" in response["reports"][0]["data"]:
#                 response_rows = response["reports"][0]["data"]["rows"]
#             else:
#                 response_rows = []
#                 cell_data = [start.strftime("%b %Y"), 0]
#                 data.append(cell_data)

#             for res in response_rows:
#                 if res["dimensions"][0] == feature.value:
#                     if response_rows != []:
#                         cell_data = [start.strftime("%b %Y"), res["metrics"][0]["values"][0]]
#                         data.append(cell_data)
#                     else:
#                         cell_data = [start.strftime("%b %Y"), 0]
#                         data.append(cell_data)

#             start = start + relativedelta(months=+1)
#             end = start = start.replace(day=1)
#             end = end.replace(day = calendar.monthrange(start.year, start.month)[1])

#     folder_path = os.path.join("result_csv", "graph_data")
#     Path(folder_path).mkdir(parents=True, exist_ok=True)

#     df = pd.DataFrame(data, columns = ['Month', 'Frequency'])
#     result_path = os.path.join(folder_path, "monthly_graph-" + dt.strftime("%d %b, %Y") + " - " + ds.strftime("%d %b, %Y") + ".csv")
#     df.to_csv(result_path, encoding='utf-8', index=False)

#     action_column = df.iloc[:, 0]
#     frequency_column = df.iloc[:, 1]
#     x_markers = pd.Series(action_column).array
#     y_markers = pd.Series(frequency_column).array
#     y_markers = y_markers.astype(int)

#     trace0 = go.Scatter(
#         x = x_markers,
#         y = y_markers
#     )

#     plotly.offline.plot([trace0], "monthly_chart")

###########################################################

# if update_interval.value == "Weekly":
#     dt = start_date.value
#     ds = end_date.value

#     start = dt - timedelta(days=dt.weekday())
#     end = start + timedelta(days=6)
#     weeks_counter = 0

#     # Get the number of weeks for the progress bar
#     while start <= ds:
#         weeks_counter += 1
#         start = start + timedelta(days=7)
#         end = start + timedelta(days=6)

#     start = dt - timedelta(days=dt.weekday())
#     end = start + timedelta(days=6)

#     data = []

#     for i in trange(weeks_counter):
#         if start <= ds:
#             query = {
#                 'reportRequests': [
#                 {
#                     'viewId': VIEW_ID,
#                     'dateRanges': [{'startDate': start.strftime('%Y-%m-%d'), 'endDate': end.strftime('%Y-%m-%d')}],
#                     'metrics': [{'expression': 'ga:totalEvents'}],
#                     'dimensions': [{'name': 'ga:eventAction'}]
#                 }]
#             }
#             response = get_report(analytics, query)
#             if "rows" in response["reports"][0]["data"]:
#                 response_rows = response["reports"][0]["data"]["rows"]
#             else:
#                 response_rows = []
#                 cell_data = [start.strftime("%d %b, %Y") + " - " + end.strftime("%d %b, %Y") , 0]
#                 data.append(cell_data)

#             for res in response_rows:
#                 if res["dimensions"][0] == feature.value:
#                     if response_rows != []:
#                         cell_data = [start.strftime("%d %b, %Y") + " - " + end.strftime("%d %b, %Y"), res["metrics"][0]["values"][0]]
#                         data.append(cell_data)
#                     else:
#                         cell_data = [start.strftime("%d %b, %Y") + " - " + end.strftime("%d %b, %Y") , 0]
#                         data.append(cell_data)

#             start = start + timedelta(days=7)
#             end = start + timedelta(days=6)

#     folder_path = os.path.join("result_csv", "graph_data")
#     Path(folder_path).mkdir(parents=True, exist_ok=True)

#     df = pd.DataFrame(data, columns = ['Week', 'Frequency'])
#     result_path = os.path.join(folder_path, "weekly_graph-" + dt.strftime("%d %b, %Y") + " - " + ds.strftime("%d %b, %Y") + ".csv")
#     df.to_csv(result_path, encoding='utf-8', index=False)

#     action_column = df.iloc[:, 0]
#     frequency_column = df.iloc[:, 1]
#     x_markers = pd.Series(action_column).array
#     y_markers = pd.Series(frequency_column).array
#     y_markers = y_markers.astype(int)

#     trace0 = go.Scatter(
#         x = x_markers,
#         y = y_markers
#     )

#     plotly.offline.plot([trace0], "weekly_chart")

###########################################################

# if update_interval.value == "Daily":
#     dt = start_date.value
#     ds = end_date.value
#     start = dt
#     end = start

#     data = []

#     for i in trange((ds - dt).days):
#         if start <= ds:
#             query = {
#                 'reportRequests': [
#                 {
#                     'viewId': VIEW_ID,
#                     'dateRanges': [{'startDate': start.strftime('%Y-%m-%d'), 'endDate': end.strftime('%Y-%m-%d')}],
#                     'metrics': [{'expression': 'ga:totalEvents'}],
#                     'dimensions': [{'name': 'ga:eventAction'}]
#                 }]
#             }
#             response = get_report(analytics, query)
#             if "rows" in response["reports"][0]["data"]:
#                 response_rows = response["reports"][0]["data"]["rows"]
#             else:
#                 response_rows = []
#                 cell_data = [start.strftime("%d %b, %Y") , 0]
#                 data.append(cell_data)

#             for res in response_rows:
#                 if res["dimensions"][0] == feature.value:
#                     if response_rows != []:
#                         cell_data = [start.strftime("%d %b, %Y"), res["metrics"][0]["values"][0]]
#                         data.append(cell_data)
#                     else:
#                         cell_data = [start.strftime("%d %b, %Y") , 0]
#                         data.append(cell_data)

#             start = start + timedelta(days=1)
#             end = start

#     folder_path = os.path.join("result_csv", "graph_data")
#     Path(folder_path).mkdir(parents=True, exist_ok=True)

#     df = pd.DataFrame(data, columns = ['Day', 'Frequency'])
#     result_path = os.path.join(folder_path, "daily_graph-" + dt.strftime("%d %b, %Y") + "-" + ds.strftime("%d %b, %Y") + ".csv")
#     df.to_csv(result_path, encoding='utf-8', index=False)

#     action_column = df.iloc[:, 0]
#     frequency_column = df.iloc[:, 1]
#     x_markers = pd.Series(action_column).array
#     y_markers = pd.Series(frequency_column).array
#     y_markers = y_markers.astype(int)

#     trace0 = go.Scatter(
#         x = x_markers,
#         y = y_markers
#     )

#     plotly.offline.plot([trace0], "daily_chart")

###########################################################
