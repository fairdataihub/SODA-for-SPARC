from os import makedirs, path
import logging
import logging.handlers

def configureLogger(app):
    LOG_FOLDER = path.join(path.expanduser('~'), "SODA" , 'logs')
    LOG_FILENAME = "api.log"
    LOG_PATH = path.join(LOG_FOLDER, LOG_FILENAME)

    if not path.exists(LOG_FOLDER):
        makedirs(LOG_FOLDER)

    # Add the log message handler to the logger 
    handler = logging.handlers.RotatingFileHandler( LOG_PATH, maxBytes=5 * 1024 * 1024, backupCount=3)

    # create logging formatter
    logFormatter = logging.Formatter(
        fmt="%(asctime)s.%(msecs)03d %(levelname)s %(module)s - %(funcName)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(logFormatter)

    app.logger.addHandler(handler)
    app.logger.setLevel(logging.DEBUG)