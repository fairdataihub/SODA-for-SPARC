The previous packaging step would generate folder for the program which contains an executable to run the application. If you desire to generate installers, we suggest the following method:

#### Windows:<br>
- Download [Inno Setup](http://www.jrsoftware.org/isdl.php)<br>
- Open Inno Setup and create Installer from the UI. For clear instructions, refer to this video tutorial – https://www.youtube.com/watch?v=wW3NUAUZhnY

#### MAC:<br>
- Creating DMG Installer – https://github.com/LinusU/node-appdmg<br>
- `$ npm install -g appdmg`<br>
- `$ appdmg spec.json SODA.dmg`<br>
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
- `$ electron-installer-debian --src SODA-linux-x64 --arch amd64 --config debian.json`<br>
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