import datetime 

### Internal functions
def TZLOCAL():
    return datetime.now(datetime.timezone.utc).astimezone().tzinfo