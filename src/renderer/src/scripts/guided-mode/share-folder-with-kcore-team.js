import google from "googleapis";
import open from "open";
import crypto from "crypto";

// Get access to the file system so we can share their folder with the KCore team using the PKCE OAuth 2.0 flow.

// Load client id and redirect url from a local file.
const credentials = JSON.parse(window.fs.readFileSync("credentials.json"));
const { client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, "", redirect_uris[0]);

// Generate a code verifier and code challenge
const codeVerifier = crypto.randomBytes(32).toString("hex");
const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

// Generate a URL for authorization
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  code_challenge_method: "S256",
  code_challenge: codeChallenge,
});

console.log("Authorize this app by visiting this url:", authUrl);
open(authUrl);

// Handle the OAuth 2.0 callback
axios.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oAuth2Client.getToken({
    code,
    code_verifier: codeVerifier,
  });
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync("token.json", JSON.stringify(tokens));
  res.send("Authentication successful! You can close this tab.");
});
