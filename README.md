# SODA
Software for Organizing Data Automatically (SODA) is a computer program intended to facilitate the data organization process through interactive tools and automation. If at any point during your data organization process you think: "Ah, if only this step could be simplified", it actually could be with SODA! Especially, SODA would allow user to:

*   Conveniently organize datasets following the SPARC folder structure
*   Convert file format to SPARC defined standards
*   Generate metadata files with pre-populated fields, some automatically
*   Validate dataset with the same validator used by the Curation Team
*   Upload organized dataset directly on Blackfynn to avoid duplicating files locally

SODA is distributed as an easy to install application for Windows, Mac and Linux platforms. The front-end (Graphical User Interface or GUI) of SODA is built with Electron, an open-source framework developed and maintained by GitHub that conveniently combines HTML, CSS, and Javascript, while the back-end is developed in Python (v3.6). SODA is distributed as an easy to install application for [Windows](https://3dtholdings-my.sharepoint.com/:u:/g/personal/bpatel_calmi2_org/ESz_2R4PCPJOiOJGSHPGsPABsRzz423tcCbCxCWiVKFW9Q?e=BUDuDg), [Mac](https://3dtholdings-my.sharepoint.com/:u:/g/personal/bpatel_calmi2_org/EWMhxDuXFCZGksl5rgv9hMsBZvRZC4YEGDfqxF7wqyehiQ?e=m7jxv1) and [Linux](https://3dtholdings-my.sharepoint.com/:u:/g/personal/bpatel_calmi2_org/EVMndexbB_9BroB6dk-f1TcBn_aQzPRKWHi8SDmzYBiwcQ?e=WE5UiS) platforms. All source codes and files are shared with an open source license (MIT) to permit user modification without restrictions.

# Installation
#### *Pre-requisites: [Anaconda 3](https://www.anaconda.com/distribution/), [Python 2](https://www.python.org/downloads/)*

### Installing C++ development libraries

#### Mac
*   Install vxcode
*   `brew install gcc`

#### windows
*   Download visual studio 2017, run the executable file
*   In the installer, select “Desktop development with C++” and check “VC++ 2015.3 v14.00”

#### Linux
*   Install gcc compiler on Ubuntu (https://linuxize.com/post/how-to-install-gcc-compiler-on-ubuntu-18-04/)

### Setting up the development environment
*   Create conda environment from YAML file
*   Activate the conda environment
*   Delete node_modules and package-lock.json (if present)
*   sudo npm install -g node-gyp
*   npm config set python \path\to\python2.exe
*   npm install
*   `"./node_modules/.bin/"electron-rebuild .`
*   npm start

### Packaging Instructions
1) Package Python code with Pyinstaller
- open anaconda prompt and go to main folder of the code
- run:<br>
`python -m PyInstaller pysoda/api.py --distpath pysodadist`

Optional
- Edit spec file as needed (e.g. exclude PyQt5, tkinter)
- Generate exe : `python -m PyInstaller --noconsole api.spec`
- .exe is generated in the dist folder
- for electron packaging, build and pysoda folder (with the .py files) could be deleted or ignored

2) Package electron app

*If error run
npm install electron-packager --save-dev
and try again*

- Windows:<br>
```bash
"./node_modules/.bin/"electron-packager . --overwrite --icon=assets/app-icon/win/soda_icon.ico
```

- MAC:<br>
```bash
"./node_modules/.bin/"electron-packager . --overwrite --icon=assets/app-icon/mac/soda_icon.icns
```

- Linux:<br>
```bash
"./node_modules/.bin/"electron-packager . --overwrite --icon=assets/app-icon/png/soda_icon.png
```

### Distribution Instructions (Creating an Installer)
- Windows:<br>

- MAC:<br>
Creating Debian Installer – https://github.com/electron-userland/electron-installer-debian<br>
`$ npm install -g electron-installer-debian`<br>
`$ electron-installer-debian --src path/to/SODA-linux-x64/ --dest installers/ --arch amd64`<br>

- Linux:<br>
Creating DMG Installer - https://github.com/LinusU/node-appdmg<br>
`$ npm install -g appdmg`<br>
`$ appdmg path/to/spec.json path/to/output.dmg`<br>
Specification of JSON file – 
```json
{
  "title": "SODA",
  "icon": "/path/to/mac-icon.icns",
  "contents": [
    { "x": 448, "y": 344, "type": "link", "path": "/Applications" },
    { "x": 192, "y": 344, "type": "file", "path": "SODA.app" }
  ]
}
```
