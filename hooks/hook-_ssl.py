import os
import sys
import sysconfig

binaries = []

# Use the lib directory of the running Python interpreter (not a subpackage's bundled dylib)
lib_dir = sysconfig.get_config_var('LIBDIR') or ''
for lib in ['libcrypto.3.dylib', 'libssl.3.dylib']:
    full = os.path.join(lib_dir, lib)
    if os.path.exists(full):
        # Bundle to root AND overwrite cv2's bundled copy so it doesn't shadow the correct one
        binaries.append((full, '.'))
        binaries.append((full, 'cv2/.dylibs'))
