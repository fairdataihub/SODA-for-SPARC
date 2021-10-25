// Purpose: An fetch object with a base url to Pennsieve apis. It keeps track of the current Pennsieve session for a given user.
//          It reads the settings from the config.ini file and populates the request options with the access token gathered after
//          verifying the requester's identity.

// IMP: Expiration of a session token is 1 hour -- is that true of the accessToken?

// TODO: Check that this does everything important the Python client does
//              Things not done:
//                  -Request retries and keeping open a TCP connection for speed (not essential)
//                  -Pagination variables for defining the offset and limit, etc. (not essential since there are defaults )
//                  -Integration with Pennsieve agent - this may be very important for performance, but perhaps there will be workarounds with other tools
//              Things done:
//                   -Reading and storing the current user profile/settings like the client (essential? Maybe. It is nice that the client reads all of the session information from the config so we don't always have to)
//                     -There also seems to be something interesting with the global profile that I'm not sure is essential
//
// TODO: Check that this is usable in a somewhat similar fashion to the current code that uses the client. If not see what is missing and where it belongs.

// Reservations: Won't we have problems with file uploads once we make the conversion?
class PennsieveRequestClient {
  //params list:
  // settings: {
  // baseURL: string
  // api_key: string
  // api_secret: string
  // account/profile?: string
  // organization/context?: string
  // }
  // getters:
  // getAccount() {return settings.account}
  // getContext() {return settings.context}
  // constructor(configSection)
  // set all settings to null
  // async populateBearerToken()
  // set the api key and secret
  // use the token and api key to authenticate through aws cognito
  // check authentication status
  // if failed throw an error
  // pull out the access token from the cognito session
  // set the access token in the Authorization header and object
  // async authenticateByKeyAndSecret()
  // get the aws cognito pool using the config option from Pennsieve
  // setup the cognito pool with the user information
  // intitate the authorization flow using the api key and secret as the password
  // set the organization using the resulting claims if there is no organization to claims["custom:organization_node_id"]
  // set the org/context property in the class
  // return the cognitoSession object
  // fetch(endPointFromBase: string, queryParams?: paramList, bodyParams?: bodyList, method: Enum)
  //  create the fetch options object using the parameters and the properties
  // const qs = Object.keys(params)
  //     .map(key => `${key}=${params[key]}`)
  //     .join('&');
  // make the request
  // if successful convert the results to JSON and return the result
  // if an error throw
  // reads the settings releveant for a user in the .ini file.
  // sets setting values in the object to null if none are found
  // populateSettings(configSection)
  //  Go to the .ini file location and read the api_key and api_secret
  //read the context from the .ini file
  //if there is no conext set to null
  //else if there is a context use its value
  // getContext()
  // return the context stored from the client
}

// how it might be used:
// let ps = new PennsieveRequestClient(profileName/ConfigSection to check)
// await ps.authenticateByKeyAndSecret()
// await ps.populateBearerToken()
// make any requests you want -- in some places the organization is set in advance so i need to be able to set that if they have it set and catch it if they don't and is required
//                               or perhaps just let the api endpoint be their guide there
// await ps.fetch("/user", {authenticate: true}, Methods.POST)

// Alternative approach

//  No classes. Use imported fetch client in each script where we make API requests to Pennsieve.
//  First to handle in the flow is to check if the user's given api key and api secret are in the .ini files
//  This can be part of a getSettings function
//  const getSettings = (sectionName) => {
// check that the user has an API key and an API secret as a prerequisiste to reading their setting information
//      If no key and secret then throw an error and halt processing
// create an empty object for the settings
//      // read the configuraton file at the given section name
// for each key place the values in the object

//      return a dictionary with all of the available values
//}

// const authenticateAccountWithApiKeyAndSecret(api_key, api_secret){
//  do all of the api stuff outlined before
//  check if there was an error with validation
//      throw if so
//  else return the cognito session
//}

// For all subsequent requests in a given function:
//  const settings = await getSettings(section)
//  const accessToken = await authenticateAccountWtihApiKeyAndSecret(api_key, api_secret)["user"][accessToken]
//  const url = "https://pennsieve.io/api/v1"
//  let userDatasets = await fetch(`url/search/datasets?organizationId=${settings.organizationId}`, {headers: {Authorization: `Bearer ${accessToken}`}})
