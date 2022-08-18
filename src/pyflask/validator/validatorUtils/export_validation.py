import datetime


def verified_latest_export(export_json, dataset_latest_updated_at_timestamp):
    """
    Check if the LATEST export 'timestamp_updated' property matches the corresponding property on the given Pennsieve dataset.
    If not this means we need to wait longer before the export corresponding to the most recent modification on the given dataset is available.
    In short, LATEST isn't really LATEST until its 'timestamp_updated' timestamp matches the Pennsieve 'updated_at' timestamp.
    """

    # get the meta object from the export json file
    meta = export_json.get('meta')

    # get the timestamp_updated property from the meta object
    timestamp_updated = meta.get('timestamp_updated')

    print(f"export timestamp: {timestamp_updated}")
    print(f"dataset timestamp: {dataset_latest_updated_at_timestamp}")

    return utc_timestamp_strings_match(timestamp_updated, dataset_latest_updated_at_timestamp)

def utc_timestamp_strings_match(sparc_export_time, pennsieve_export_time):
    """
    Compares utc timestamps that are currently in string representation against each other.
    Returns True if they represent the same time, False if they do not.
    constraints: timezones match this format 'yyyy-mm-ddThh:mm:ss.sssZ' where sss =  up to 6 digits of milliseconds
    """

    # replace sparc export ',' with a '.'
    sparc_export_time = sparc_export_time.replace(",", ".")

    # remove the milliseconds and Zulu timezone from the sparc export time
    sparc_export_time = sparc_export_time.split(".")[0]
    pennsieve_export_time = pennsieve_export_time.split(".")[0]

    # convert the timezone strings to datetime objects
    setdtime = datetime.datetime.strptime(sparc_export_time, "%Y-%m-%dT%H:%M:%S")
    getdtime = datetime.datetime.strptime(pennsieve_export_time, "%Y-%m-%dT%H:%M:%S")

    print(f"setdtime: {setdtime}")
    print(f"getdtime: {getdtime}")

    print(f"setdtime.tzinfo: {setdtime.date()}")
    print(f"setdtime.tzinfo: {setdtime.time()}")

    print(f"getdtime: {getdtime.date()}")
    print(f"getdtime: {getdtime.time()}")

    # compare the two times
    return setdtime.date() == getdtime.date() and setdtime.time() == getdtime.time()