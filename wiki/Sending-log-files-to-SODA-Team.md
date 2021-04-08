## Background

The SODA app saves all errors in several log files on your computer. In order to solve user issues, the SODA Team usually needs to take a look at those log files. Currently, there are two types of log files that we ask from users when we receive an issue report:

1. Server-side log files (Python log files)
2. Client-side log files (Renderer log files)

## How to obtain the log files 

**1. Python log files: send us all the files located here**

* Windows: `C:\Users\your_username\SODA\python-log`
* MAC: `~/_your_username_/SODA/python-log`
* Ubuntu: `/home/_your_username_/SODA/python-log`

**2. Renderer log files: send us all the files located here**

* Windows: `C:\Users\_your_username_\AppData\Roaming\SODA\logs`
* MAC: `~/_your_username_/Library/Logs/SODA`
* Ubuntu: `/home/_your_username_/.config/SODA/logs`

## Common issues regarding the log files

**1. Unable to find the `AppData` (Windows), `.config` (Ubuntu), or `Library` (MAC) folder**

**Solution**: It is very likely that the folder is hidden on your computer. To learn about how to show hidden files and folders, please visit the link below for your Operating system:

* [Windows users](https://support.microsoft.com/en-us/windows/view-hidden-files-and-folders-in-windows-10-97fbc472-c603-9d90-91d0-1166d1d9f4b5#:~:text=Open%20File%20Explorer%20from%20the,folders%2C%20and%20drives%20and%20OK.)

* [Ubuntu users](https://help.ubuntu.com/stable/ubuntu-help/files-hidden.html.en#:~:text=If%20you%20want%20to%20see,files%20that%20are%20not%20hidden.)

* [Mac users](https://www.ionos.com/digitalguide/server/configuration/showing-hidden-files-on-a-mac/#:~:text=Keyboard%20shortcuts%20are%20probably%20the,keys%20at%20the%20same%20time.)