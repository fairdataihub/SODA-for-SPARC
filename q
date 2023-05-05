diff --git a/scripts/others/renderer.js b/scripts/others/renderer.js
index 477687958..0a2f00129 100644
--- a/scripts/others/renderer.js
+++ b/scripts/others/renderer.js
@@ -577,6 +577,11 @@ const getPennsieveAgentPath = () => {
     if (fs.existsSync(unixPath)) {
       return unixPath;
     }
+    // sometimes the pennsieve agent might install here on MAC
+    const optPath = "/usr/local/opt/pennsieve";
+    if (fs.existsSync(optPath)) {
+      return optPath;
+    }
   }
   throw new Error(`Cannot find pennsieve agent executable`);
 };
@@ -845,6 +850,7 @@ const run_pre_flight_checks = async (check_update = true) =>
 {
   // an account is present
   // Check for an installed Pennsieve agent
   let pennsieveAgentCheckNotyf;
+
   try {
