# <img src="/src/assets/app-icon/png/soda_icon.png" width="60px" align="center" alt="SODA icon"> SODA

Software for Organizing Data Automatically (SODA) is a computer program intended to facilitate the data organization process for [SPARC](https://commonfund.nih.gov/sparc) investigators through interactive tools and automation. Especially, SODA would allow users to:

*   Conveniently organize datasets following the SPARC folder structure
*   Convert file format to SPARC defined standards
*   Generate metadata files with pre-populated fields, some automatically
*   Validate dataset with the same validator used by the Curation Team
*   Upload organized dataset directly on Blackfynn to avoid duplicating files locally

SODA is distributed as an easy to install application for Windows, Mac and Linux platforms. The front-end (Graphical User Interface or GUI) of SODA is built with [Electron](https://electronjs.org/), an open-source framework developed and maintained by GitHub that conveniently combines HTML, CSS, and Javascript, while the back-end is developed in Python (v3.6). The application is inspired by a [GitHub repository](https://github.com/fyears/electron-python-example) and a [Medium blog](https://medium.com/@abulka/electron-python-4e8c807bfa5e). All source codes and files are shared with an open source license ([MIT](LICENSE)) to permit user modification without restrictions. Folder structure for the source code is based on the Electron standards and similar to the [Electron Demo Application](https://github.com/electron/electron-api-demos)

## Download the application
SODA is distributed as an easy to install application for:
*   [Windows](https://3dtholdings-my.sharepoint.com/:u:/g/personal/bpatel_calmi2_org/ESz_2R4PCPJOiOJGSHPGsPABsRzz423tcCbCxCWiVKFW9Q?e=BUDuDg) (Developed & tested on Windows 10)
*   [Mac](https://3dtholdings-my.sharepoint.com/:u:/g/personal/bpatel_calmi2_org/EWMhxDuXFCZGksl5rgv9hMsBZvRZC4YEGDfqxF7wqyehiQ?e=m7jxv1) (Developed & tested on Mac OS High Sierra and Mojave)
*   [Linux](https://3dtholdings-my.sharepoint.com/:u:/g/personal/bpatel_calmi2_org/EVMndexbB_9BroB6dk-f1TcBn_aQzPRKWHi8SDmzYBiwcQ?e=WE5UiS) (Developed & tested on Ubuntu)
<br>
Please follow the instructions given in [User Manual](docs/SODA_User_manual.pdf) to download, install and use SODA. The software should ideally also work on older version of OS but no testing has been done on those platforms.

## Using the Source Code
If you want to modify SODA to suit your needs better or compile it for an OS not mentioned above, please follow the instructions below.
#### *Pre-requisites: [Anaconda (Python 3 version)](https://www.anaconda.com/distribution/), [Python 2](https://www.python.org/downloads/)*

### Download source code from the GitHub repository
Either download the zip folder from the GitHub repository or run the following command from your bash shell
```bash
git clone https://github.com/bvhpatel/SODA.git
```

### Installing C++ development libraries – https://www.npmjs.com/package/node-gyp

#### *Windows*
*   Download [Visual Studio 2017](https://visualstudio.microsoft.com/pl/thank-you-downloading-visual-studio/?sku=Community), run the executable file
*   In the installer, select “Desktop development with C++” and check “VC++ 2015.3 v14.00”

#### *Mac*
*   Install [Xcode](https://developer.apple.com/xcode/download/)
*   Run: `brew install gcc`

*Refer here for installing 'brew' if your Mac doesn't already have it – https://docs.brew.sh/Installation*

#### *Linux*
*   [Install GCC](https://linuxize.com/post/how-to-install-gcc-compiler-on-ubuntu-18-04/) on Ubuntu

### Setting up the development environment
*   Create conda environment from YAML file – [Managing conda environment](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html)<br>
(If “pip returned an error”, then activate the half-completed conda environment and manually install libraries using --user argument in pip (eg.- “pip install zerorpc –user”)
*   Activate the conda environment (If you're on Windows, use 'Anaconda Prompt') and navigate to the 'src' folder
*   Delete 'node_modules' folder and package-lock.json (if present)
*   Run the following commands:
```bash
$ sudo npm install -g node-gyp
$ npm config set python \path\to\python2.exe
$ npm install
$ "./node_modules/.bin/"electron-rebuild .
$ npm start
```
*   This should launch the application. You can now edit the code files in 'src' folder and run `npm start` to see / test your changes

## Packaging
#### Package Python code with [PyInstaller](https://www.pyinstaller.org/)
*   Run anaconda prompt, activate the conda environment (if you haven't done that already)
*   Navigate to 'src' folder
*   Run: `python -m PyInstaller pysoda/api.py --distpath pysodadist`

Optional
*   Edit spec file as needed (e.g. exclude PyQt5, tkinter)
*   To generate exe, Run: `python -m PyInstaller --noconsole api.spec`
*   for electron packaging, build and pysoda folder (with the .py files) could be deleted or ignored

#### Package electron app

*   Windows:<br>
```bash
"./node_modules/.bin/"electron-packager . --overwrite --icon=assets/app-icon/win/soda_icon.ico
```

*   MAC:<br>
```bash
"./node_modules/.bin/"electron-packager . --overwrite --icon=assets/app-icon/mac/soda_icon.icns
```

*   Linux:<br>
```bash
"./node_modules/.bin/"electron-packager . --overwrite --icon=assets/app-icon/png/soda_icon.png
```

*If error run
npm install electron-packager --save-dev
and try again*

## Distribution (Creating an Installer)
The previous packaging step would generate folder for the program which contains an executable to run the application. If you desire to generate installers, we suggest the following method:
#### Windows:<br>
- Download [Inno Setup](http://www.jrsoftware.org/isdl.php)<br>
- Open Inno Setup and create Installer from the UI. For clear instructions, refer to this video tutorial – https://www.youtube.com/watch?v=wW3NUAUZhnY

#### MAC:<br>
- Creating DMG Installer – https://github.com/LinusU/node-appdmg<br>
- `$ npm install -g appdmg`<br>
- `$ appdmg path/to/spec.json path/to/output.dmg`<br>
- Specification of JSON file (spec.json) –
```json
{
  "title": "SODA",
  "icon": "/path/to/mac-icon.icns",
  "background-color": "#DFDFDF",
  "contents": [
    { "x": 448, "y": 344, "type": "link", "path": "/Applications" },
    { "x": 192, "y": 344, "type": "file", "path": "SODA.app" }
  ]
}
```

#### Linux:<br>
Creating Debian Installer – https://github.com/electron-userland/electron-installer-debian<br>
- `$ npm install -g electron-installer-debian`<br>
- `$ electron-installer-debian --src path/to/SODA-linux-x64/ --arch amd64 --config debian.json`<br>
- Specification of JSON file (debian.json) –
```json
{
  "dest": "release-builds/",
  "icon": "SODA/src/assets/app-icon/png/soda_icon.png",
  "categories": [
    "Utility"
  ]
}
```
