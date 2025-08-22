from PyInstaller.utils.hooks import collect_submodules

# Collect all submodules from the backports package
hiddenimports = collect_submodules('backports')