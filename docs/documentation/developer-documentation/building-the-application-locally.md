# Building the Application Locally

This guide explains how to build SODA for SPARC on your local machine for development and testing purposes.

## Prerequisites

Ensure you have completed the [Project Setup](project-setup.md) guide and have all dependencies installed.

## Development Workflow

### Running in Development Mode

To start the development server with hot module reloading:

```bash
npm run dev
```

This will:
- Start the Electron development server using electron-vite
- Enable hot reloading as you make changes
- Open the SODA application window

The development server is the fastest way to iterate on your code during development.

## Building for Distribution

### Building the Application

To create a production build of the application:

```bash
npm run build
```

This uses electron-vite to bundle the application code and assets for production.

### Platform-Specific Builds

#### Windows Build
```bash
npm run build:win
```

This will:
1. Build the Python backend using PyInstaller (`python-folder-build-win`)
2. Build the Electron application
3. Package it with electron-builder for Windows

#### macOS Build
```bash
npm run build:mac
```

This will:
1. Build the Python backend using PyInstaller (`python-folder-build-unix`)
2. Build the gunicorn upload server using PyInstaller
3. Build the Electron application
4. Package it with electron-builder for macOS

#### Linux Build
```bash
npm run build:linux
```

This will:
1. Build the Python backend using PyInstaller (`python-folder-build-unix`)
2. Build the Electron application
3. Package it with electron-builder for Linux

## Python Backend

SODA includes a Python backend located in `src/pyflask/` that is compiled into a standalone executable using PyInstaller.

### Building Python Components

The build process creates two main Python executables:

1. **Flask Backend** (`app.py`):
   ```bash
   npm run python-folder-build-unix  # macOS/Linux
   npm run python-folder-build-win   # Windows
   ```

2. **Upload Server** (`uploadApp.py`):
   ```bash
   npm run gunicorn-folder-build-unix  # macOS/Linux
   npm run gunicorn-folder-build-win   # Windows
   ```

These are compiled into the `pyflaskdist/` directory and bundled with the final application.

## Build Output

After building, you'll find:

- **Windows**: Installer and portable executable in the `dist/` directory
- **macOS**: DMG installer in the `dist/` directory
- **Linux**: AppImage and deb package in the `dist/` directory

## Troubleshooting

### Build Failures

If the build fails, try:
1. Clean the build artifacts: `rm -rf dist/ out/`
2. Reinstall dependencies: `npm install --ignore-scripts`
3. Check the error messages carefully - they often indicate missing dependencies

### Python Backend Issues

If the Python build fails:
1. Verify Python 3.9+ is installed: `python --version`
2. Ensure the conda environment is activated: `conda activate env-electron-python`
3. Check that all Python dependencies are installed: `pip list`

### PyInstaller Issues

If PyInstaller fails to build the Python backend:
- Check that all required hooks are in the `hooks/` directory
- Verify that `libcrypto-1_1-x64.dll` and `libssl-1_1-x64.dll` exist (Windows only)

## Next Steps

- [Working with pysodafair](working-with-pysodafair.md) - Learn about the pysodafair integration
- [Deploying a new version](deploying-a-new-version.md) - Ready to release? Read this guide
