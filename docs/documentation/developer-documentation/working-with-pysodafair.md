# Working with pysodafair

This guide explains how to work with pysodafair, SODA's Python library for FAIR data curation, and how to manage different versions in development and production environments.

## What is pysodafair?

pysodafair is a Python package developed as part of the SODA for SPARC project. It provides utilities for FAIR data curation and is integrated into the Python backend of SODA.

## Installation and Activation

The Python environment includes pysodafair as a dependency. To ensure it's properly installed:

```bash
# Activate the conda environment
conda activate env-electron-python

# Verify pysodafair is installed
pip show pysodafair
```

## Development Environment

During development, you can work with pysodafair in the following ways:

### Installing from PyPI (Production Source)

The default environment configuration installs pysodafair from [PyPI](https://pypi.org/):

```bash
pip install pysodafair
```

### Installing from TestPyPI (Pre-release/Beta)

For testing pre-release versions before they're available on PyPI:

```bash
pip install --extra-index-url https://test.pypi.org/simple/ pysodafair
```

## Version Configuration in Conda Environment

The conda environment file (`tools/anaconda-env/environment-Linux.yml` or `environment-Windows.yml`) contains configuration for pysodafair's source:

```yaml
# production (PyPI)
# - --extra-index-url

# beta (TestPyPI)
- --extra-index-url https://test.pypi.org/simple/
```

By default, TestPyPI is configured for development. The `--extra-index-url` line can be commented out to use only PyPI.

## Understanding Beta vs Production Versions

SODA automatically detects whether it's building a beta or production version and configures pysodafair accordingly:

### Beta Version Detection

A version is considered "beta" if it contains "beta" in the version string, for example:
- `1.0.0-beta.1`
- `2.1.0-beta`

**For beta versions:**
- pysodafair is installed from **TestPyPI**
- This allows testing pre-release versions of pysodafair
- Useful for testing new features before the official release

### Production Version Detection

All other versions are treated as production versions:
- `1.0.0`
- `2.1.0`
- `1.0.0-rc.1`

**For production versions:**
- pysodafair is installed from **PyPI**
- Uses the stable, official release
- Ensures reliability for end users

## Version Management in Builds

### Checking Your Version

View the current version in `package.json`:

```bash
node -p "require('./package.json').version"
```

### Modifying the Version

Edit `package.json` to change the version:

```json
{
  "version": "1.0.0-beta.1"  // Beta version
  "version": "1.0.0"          // Production version
}
```

### Automatic Configuration During Build

The build process in CI/CD (GitHub Actions) automatically detects the version and configures pysodafair:

```bash
VERSION=$(node -p "require('./package.json').version")

if [[ "$VERSION" == *"beta"* ]]; then
  # Use TestPyPI for beta versions
  sed -i 's/# - --extra-index-url/- --extra-index-url/' "$ENV_FILE"
else
  # Use PyPI for production versions
  # (the default - no changes needed)
fi
```

## Local Development Workflow

### For Testing New pysodafair Features

1. Ensure TestPyPI is enabled in your conda environment
2. Update the version in `package.json` to include "-beta"
3. Recreate your conda environment to pick up the new pysodafair version:
   ```bash
   conda env remove --name env-electron-python
   conda env create -f tools/anaconda-env/environment-Linux.yml
   conda activate env-electron-python
   ```

### For Using Stable pysodafair

1. Comment out the `--extra-index-url` line in your conda environment file
2. Ensure the version in `package.json` does NOT include "-beta"
3. Recreate your conda environment:
   ```bash
   conda env remove --name env-electron-python
   conda env create -f tools/anaconda-env/environment-Linux.yml
   conda activate env-electron-python
   ```

## Troubleshooting

### pysodafair Installation Fails

If installation from TestPyPI fails:
1. Check your internet connection
2. Verify the package exists on TestPyPI: https://test.pypi.org/project/pysodafair/
3. Try reinstalling with verbose output:
   ```bash
   pip install --extra-index-url https://test.pypi.org/simple/ -v pysodafair
   ```

### Version Conflicts

If you experience version conflicts:
1. Clear pip cache: `pip cache purge`
2. Reinstall the environment:
   ```bash
   conda env remove --name env-electron-python
   conda env create -f tools/anaconda-env/environment-Linux.yml
   ```

### Verifying Installed Version

Check which version of pysodafair is installed and from where:

```bash
conda activate env-electron-python
pip show pysodafair
pip index versions pysodafair  # PyPI versions
```

## Next Steps

- [Building the Application Locally](building-the-application-locally.md) - Build SODA with your pysodafair changes
- [Deploying a New Version](deploying-a-new-version.md) - Ready to release your changes?
