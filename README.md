[![Contributors][contributors-shield]][contributors-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]


<!-- HEADER -->
<br />
<p align="center">
  <a href="#">
    <img src="/src/assets/app-icon/png/soda_icon.png" alt="Logo" width="100" height="100">
  </a>

  <h3 align="center">Keep Calm and Curate!</h3>

  <p align="center">
    Your one-stop tool for curating and submitting SPARC datasets <br/>
    By SPARC investigators, for SPARC investigators
    <br />
    <br />
    <a href="https://github.com/bvhpatel/SODA/wiki"><strong>Explore our documentation »</strong></a>
    <br />
    <br />
    <a href="https://www.youtube.com/channel/UCXLDJT6RNQYIjPSMuXEK6rA/playlists">Watch tutorial videos</a>
    ·
    <a href="https://github.com/bvhpatel/SODA/issues">Report Issue</a>
    ·
    <a href="https://docs.google.com/forms/d/e/1FAIpQLSfyUw2_NI1-2tlAr8oB5_JcJ_yjTB-zUDt9skfGjNU9qjITwg/viewform?ts=5e433bea">Submit feedback </a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
## Table of Contents

* [About](#about)
* [Downloading SODA](#Downloading-soda)
* [Issues and feedback](#Issues-and-feedback)
* [Using the Source Code](#Using-the-Source-Code)
* [Packaging](#Packaging)
* [Distributing](#Distributing)
* [License](#license)
* [Acknowledgements](#acknowledgements)



<!-- ABOUT -->
## About

Software for Organizing Data Automatically (SODA) is a computer software intended to facilitate the data organization and submission process for [SPARC](https://commonfund.nih.gov/sparc) investigators. It is built such that users can accomplish all the [requirements to submit a SPARC dataset](https://docs.sparc.science/submit_data.html) rapidly through a single interface. Moreover, requirements have been broken down into easy to perform steps and automation has been integrated to reduces users' effort to a bare minimum during each step, often to just few clicks.

<p align="center">
   <img src="/docs/SODA-interface.PNG" alt="interface" width="400">
 </p> 

## Downloading SODA
SODA is distributed as an easy to install software for:
*   Windows - Coming soon
<!--[Click Here](https://3dtholdings-my.sharepoint.com/:u:/g/personal/bpatel_calmi2_org/EaurG6qE7bBBhuF1HWWqfVkB9xJ3x0rfeSGJ9f63WtdoJA?e=Uo2rnk) (Developed & tested on Windows 10) -->
*   Mac - Coming soon
<!-- [Click Here](https://3dtholdings-my.sharepoint.com/:u:/g/personal/bpatel_calmi2_org/EeJQbemo2MtDmEJumGbu7moByRrcw3xyC-A5-pD2EdjVRw?e=Gcd3lX) (Developed & tested on Mac OS High Sierra and Mojave) -->
*   Linux - Coming soon
<!-- [Click Here](https://3dtholdings-my.sharepoint.com/:u:/g/personal/bpatel_calmi2_org/EQLHAKyyfaZJoDMYDYIwHIQB_jBZWh8mxBE5rRW-g_Oo5w?e=7wLGLI) (Developed & tested on Ubuntu Desktop 18.04) -->

Latest version: 1.0.0

<!--Example datasets can be downloaded from [here](https://3dtholdings-my.sharepoint.com/:f:/g/personal/bpatel_calmi2_org/Eig4sjUjchRCiUtfpeH-ydYBjvql_KYW0ZSE9_Td6bPzrQ?e=ApSOvh). -->
Please follow the instructions given in [our documentation](https://github.com/bvhpatel/SODA/wiki/Download) if you need help with installing SODA. 

#### Important: the [Blackfynn agent](https://developer.blackfynn.io/agent/index.html) must be installed to upload datasets to Blackfynn through SODA. 

The software should also work on older OS than those specified above but no testing has been done on those platforms.


## Issues and feedback
For reporting any problems/bugs with the software, please open a new issue on the [Issues tab](https://github.com/bvhpatel/SODA/issues). Provide adequate information (operating system, steps leading to error, screenshots) so we can help you efficiently. Alternatively, you could also use [our feedback form](https://docs.google.com/forms/d/e/1FAIpQLSfyUw2_NI1-2tlAr8oB5_JcJ_yjTB-zUDt9skfGjNU9qjITwg/viewform?ts=5e433bea). The feedback form is also accessible directly from SODA.

The sections below here are only necessary to read if you plan on using the source code of SODA. If you are here just for the software, get out of here and enjoy SODA!

## Using the Source Code
The front-end (Graphical User Interface or GUI) of SODA is built with [Electron](https://electronjs.org/), an open-source framework developed and maintained by GitHub that conveniently combines Node.js, HTML, CSS, and Javascript, while the back-end is developed in Python (v3.6). The application is inspired by a [GitHub repository](https://github.com/fyears/electron-python-example) and a [Medium blog](https://medium.com/@abulka/electron-python-4e8c807bfa5e). All source codes and files are shared with an open source license ([MIT](LICENSE)) to permit user modification without restrictions. Folder structure for the source code is based on the Electron standards and similar to the [Electron Demo Application](https://github.com/electron/electron-api-demos).

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
$ npm config set msvs_version 2017
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

You can then delete the "build" folder an the "api.spec" file generated by PyInstaller before you move on since they are not necessary for packaging and distributing the app.

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

## Distributing
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
## License
Distributed under the MIT License. See [LICENSE](https://github.com/bvhpatel/SODA/blob/master/LICENSE) for more information.

## Acknowledgements
* [NIH SPARC Initiative](https://commonfund.nih.gov/sparc)
* [Blackfynn Team](https://www.blackfynn.com/)
* [SPARC Dataset Curation Team](https://github.com/SciCrunch/sparc-curation)
* Our beta testers



[contributors-shield]: https://img.shields.io/github/contributors/bvhpatel/SODA.svg?style=flat-square
[contributors-url]: https://github.com/bvhpatel/SODA/graphs/contributors
[stars-shield]: https://img.shields.io/github/stars/bvhpatel/SODA.svg?style=flat-square
[stars-url]: https://github.com/bvhpatel/SODA/stargazers
[issues-shield]: https://img.shields.io/github/issues/bvhpatel/SODA.svg?style=flat-square
[issues-url]: https://github.com/bvhpatel/SODA/issues
[license-shield]: https://img.shields.io/github/license/bvhpatel/SODA.svg?style=flat-square
[license-url]: https://github.com/bvhpatel/SODA/blob/master/LICENSE
