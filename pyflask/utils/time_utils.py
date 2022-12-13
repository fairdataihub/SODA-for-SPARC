import datetime 

### Internal functions
def TZLOCAL():
    return datetime.datetime.now(datetime.timezone.utc).astimezone().tzinfo