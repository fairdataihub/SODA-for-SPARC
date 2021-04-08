The front-end (Graphical User Interface or GUI) of SODA is built with [Electron](https://www.electronjs.org/), an open-source framework developed and maintained by GitHub that conveniently combines Node.js, HTML, CSS, and Javascript, while the back-end is developed in Python (v3.6). The application is inspired by a [GitHub repository](https://github.com/fyears/electron-python-example) and a [Medium blog](https://medium.com/@abulka/electron-python-4e8c807bfa5e). All source codes and files are shared with an open-source license ([MIT](https://github.com/bvhpatel/SODA/wiki/LICENSE)) to permit user modification without restrictions. The folder structure for the source code is based on the Electron standards and similar to the [Electron Demo Application](https://github.com/electron/electron-api-demos).

_**Pre-requisites:**_ _[Anaconda (Python 3 version)](https://www.anaconda.com/products/individual), [Python 2](https://www.python.org/downloads/)_

### Download source code from the GitHub repository
Either download the zip folder from the GitHub repository or run the following command from your bash shell

```
git clone https://github.com/bvhpatel/SODA.git
```

### Installing C++ development libraries – https://www.npmjs.com/package/node-gyp

_**Windows**_
* Download [Visual Studio 2017](https://download.visualstudio.microsoft.com/download/pr/dfb60031-5f2b-4236-a36b-25a0197459bc/789aa74d8838804c37e2d0ea484e5d9a4958bc5cc5d2f6132542f2b637b9c17d/vs_Community.exe), run the executable file
* In the installer, select “Desktop development with C++” and check “VC++ 2015.3 v14.00”

_**Mac**_
* Install [Xcode](https://developer.apple.com/download/)
* Run: `brew install gcc`
_Refer here for installing 'brew' if your Mac doesn't already have it – https://docs.brew.sh/Installation_

**_Linux_**
* [Install GCC](https://linuxize.com/post/how-to-install-gcc-compiler-on-ubuntu-18-04/) on Ubuntu

### Setting up the development environment
* Create conda environment from YML file – [Managing conda environment](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html)
(If “pip returned an error”, then activate the half-completed conda environment and manually install libraries using --user argument in pip (eg.- “pip install zerorpc –user”)
* Activate the conda environment (If you're on Windows, use 'Anaconda Prompt') and navigate to the 'src' folder
* Delete 'node_modules' folder and package-lock.json (if present)
* Run the following commands:
```
$ sudo npm install -g node-gyp
$ npm config set python \path\to\python2.exe
$ npm config set msvs_version 2017
$ npm install
$ "./node_modules/.bin/"electron-rebuild .
$ npm start
```
**Note:** For Windows, you also need to run this command right after you npm install: 
```
npm install -g win-node-env
```


Note: if electron-rebuild . gives an error, try deleting the .electron-gyp folder from your user profile and try again.
* This should launch the application. You can now edit the code files in 'src' folder and run `npm start` to see/test your changes

