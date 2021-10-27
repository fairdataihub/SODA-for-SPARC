// // require("cross-fetch/polyfill");
// const cognitoClient = require("amazon-cognito-identity-js");
// // Purpose: Functions that take a user through the authentication flow for the Pennsieve APIs.

// // retrieve the aws cognito configuration data for authenticating a user with their API key and secret using a Password Auth flow.
// const get_cognito_config = async () => {
//   const PENNSIEVE_URL = "https://api.pennsieve.io";
//   let cognitoConfigResponse;
//   try {
//     cognitoConfigResponse = await fetch(
//       `${PENNSIEVE_URL}/authentication/cognito-config`
//     );
//   } catch (e) {
//     throw e;
//   }

//   // check that there weren't any unexpected errors
//   let statusCode = cognitoConfigResponse.status;
//   if (statusCode === 404) {
//     throw new Error(
//       `${cognitoConfigResponse.status} - Resource for authenticating not found.`
//     );
//   } else if (statusCode !== 200) {
//     // something unexpected happened with the request
//     let statusText = await cognitoConfigResponse.json().statusText;
//     throw new Error(`${cognitoConfigResponse.status} - ${statusText}`);
//   }

//   let cognitoConfigData = await cognitoConfigResponse.json();
//   return cognitoConfigData;
// };

// // read the .ini file for the current user's api key and secret
// // the .ini file is where the current user's information is stored - such as their API key and secret
// const get_api_key_and_secret_from_ini = () => {
//   // get the path to the configuration file
//   const config_path = path.join(
//     app.getPath("home"),
//     ".pennsieve",
//     "config.ini"
//   );
//   let config;

//   // check that the user's configuration file exists
//   if (!fs.existsSync(config_path)) {
//     throw new Error(
//       "Error: Could not read information. No configuration file."
//     );
//   }

//   try {
//     // initialize the ini reader
//     config = ini.parse(fs.readFileSync(`${config_path}`, "utf-8"));
//   } catch (e) {
//     throw e;
//   }

//   // check that an api key and secret does ot exist
//   if (
//     !config["SODA-Pennsieve"]["api_secret"] ||
//     !config["SODA-Pennsieve"]["api_token"]
//   ) {
//     // throw an error
//     throw new Error(
//       "Error: User must connect their Pennsieve account to SODA in order to access this feature."
//     );
//   }

//   // return the user's api key and secret
//   const { api_token, api_secret } = config["SODA-Pennsieve"];
//   return { api_token, api_secret };
// };

// // authenticate a user with api key and api secret
// // this step is to validate that a user is who they say they are
// const authenticate_with_cognito = async (
//   cognitoConfigurationData,
//   usernameOrApiKey,
//   passwordOrSecret
// ) => {
//   let cognito_app_client_id =
//     cognitoConfigurationData["tokenPool"]["appClientId"];
//   let cognito_pool_id = cognitoConfigurationData["tokenPool"]["id"];

//   var authParams = {
//     Username: `${usernameOrApiKey}`,
//     Password: `${passwordOrSecret}`,
//   };

//   var authenticationDetails = new cognitoClient.AuthenticationDetails(
//     authParams
//   );

//   var poolData = {
//     UserPoolId: cognito_pool_id,
//     ClientId: cognito_app_client_id, // Your client id here
//   };

//   var userPool = new cognitoClient.CognitoUserPool(poolData);

//   var userData = {
//     Username: `${usernameOrApiKey}`,
//     Pool: userPool,
//   };

//   var cognitoUser = new cognitoClient.CognitoUser(userData);

//   // tell the cognito user object to login using a user password flow
//   cognitoUser.setAuthenticationFlowType("USER_PASSWORD_AUTH");

//   return new Promise((resolve, reject) => {
//     cognitoUser.authenticateUser(authenticationDetails, {
//       onSuccess: resolve,
//       onFailure: reject,
//     });
//   });
// };

// // get the currnet Pennsieve user's access token -- this is used before every request to Pennsieve APIs as a bearer token
// const get_access_token = async () => {
//   // read the current user's ini file and get back their api key and secret
//   let userInformation;
//   try {
//     userInformation = get_api_key_and_secret_from_ini();
//   } catch (e) {
//     throw e;
//   }

//   // get the cognito configuration data for the given user
//   let configData;
//   try {
//     configData = await get_cognito_config();
//   } catch (e) {
//     throw e;
//   }

//   // get the access token from the cognito service for this user using the api key and secret for the current user
//   let cognitoResponse;
//   let { api_token, api_secret } = userInformation;
//   try {
//     cognitoResponse = await authenticate_with_cognito(
//       configData,
//       api_token,
//       api_secret
//     );
//   } catch (e) {
//     throw e;
//   }

//   if (!cognitoResponse["accessToken"]["jwtToken"])
//     throw new Error("Error: No access token available for this user.");

//   return cognitoResponse["accessToken"]["jwtToken"];
// };
