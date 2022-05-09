///////////////// [ FIELD VALIDATION ] /////////////////
const isValid = function (value) {
    if (typeof value === "undefined" || typeof value === null) return false
    if (typeof value === "string" && value.trim().length == 0) return false
    return true
}

///////////////// [ REQUEST BODY VALIDATION ] /////////////////
const isValidReqBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

///////////////// [ URL VALIDATION ] /////////////////
const isValidURL = function (url) {
    let pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(url);
}

///////////////// [ EMAIL VALIDATION ] /////////////////
const isValidEmail = function(email) {
    const pattern =/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return pattern.test(email);  // returns a boolean 
 }


 module.exports.isValid = isValid;
 module.exports.isValidReqBody = isValidReqBody;
 module.exports.isValidURL = isValidURL;
 module.exports.isValidEmail = isValidEmail;