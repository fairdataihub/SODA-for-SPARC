# Project Setup

This guide will help you set up your development environment to work on SODA for SPARC.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: Version 25.9.0 or later (check your version with `node --version`)
- **Python**: Version 3.9 or later (check your version with `python --version`)
- **Git**: For cloning and managing the repository

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/fairdataihub/SODA-for-SPARC.git
cd SODA-for-SPARC
```

### 2. Install Node.js Dependencies

Install all required Node.js packages and their dependencies:

```bash
npm install --ignore-scripts
```

### 3. Set Up Python Environment

SODA uses Conda to manage its Python environment. You'll need to have Conda installed. If you don't have it, download [Miniconda](https://docs.conda.io/projects/miniconda/en/latest/).

#### For Linux/macOS:
```bash
conda env create -f tools/anaconda-env/environment-Linux.yml
conda activate env-electron-python
```

#### For Windows:
```bash
conda env create -f tools/anaconda-env/environment-Windows.yml
conda activate env-electron-python
```

### 4. Verify Installation

Check that everything is set up correctly:

```bash
# Verify Node.js
npm --version

# Verify Python environment
conda activate env-electron-python
python --version
pip list
```

## Troubleshooting

### Node.js Version Mismatch
If you have a different version of Node.js, consider using [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage multiple Node.js versions.

### Conda Environment Issues
If you encounter issues with the conda environment, try:
```bash
conda env remove --name env-electron-python
conda env create -f tools/anaconda-env/environment-Linux.yml  # or Windows
```

### Module Installation Issues
Sometimes npm modules need to be rebuilt:
```bash
npm rebuild
```

## Next Steps

Once your environment is set up, you can:
- [Build the application locally](building-the-application-locally.md)
- [Learn about the development workflow](building-the-application-locally.md#development-workflow)
