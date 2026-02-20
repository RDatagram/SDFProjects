/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @author Rajitha K S
 * Script brief description:
 Suitelet Script is used for following tasks:
 1 used to invite the vendor.
 * Revision History:
 *
 * Date                 Issue/Case         Author          Issue Fix Summary
 * =============================================================================================
 * 2024/June/17                             Rajitha         Initial version.
 *
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/record', 'N/task', 'N/format', 'N/log', 'N/url', 'N/https', 'N/file', './lib/creednz_token_lib'],
    (serverWidget, search, redirect, record, task, format, log, url, https, file, creednz_token_lib) => {
        function onRequest(context) {
            try {
                if (context.request.method === "GET") {
                    log.debug("in get method");
                    getFunction(context);
                } else {
                    log.debug("in poat method");
                    postFunction(context);
                }
                // end scipt
            } catch (err) {
                log.debug(err.message);
            }
        } //end on request
        function getFunction(context) {
            log.debug("in getFunction");
            try {
                //get url of dialog box


                //start code update
                var fileSearchObj = search.create({
                    type: "file",
                    filters:
                        [
                            ["name", "is", "dialogbox.html"]
                        ],
                    columns: ['internalid', 'name', 'url']
                });

                // Execute the search
                var searchResult = fileSearchObj.run().getRange({
                    start: 0,
                    end: 1
                });
                var fileUrl;
                if (searchResult.length > 0) {
                    // Get the internal ID of the file
                    fileUrl = searchResult[0].getValue({name: 'url'});


                    log.debug('File URL:', fileUrl);
                }

                //company url
                var companyUrl = url.resolveDomain({
                    hostType: url.HostType.APPLICATION
                });


                var popupUrl = "https://" + companyUrl + fileUrl;
                log.debug('popupUrl URL:', popupUrl);

                //end code update

                var contentRequest = https.get({
                    // url: "https://tstdrv1255519.app.netsuite.com/core/media/media.nl?id=21962&c=TSTDRV1255519&h=M6ZtOArW7ayPuGWdTrT3Q-9g2ZUAHD0HF8tGmurfsZ4gRTxk&_xt=.html"
                    url: popupUrl
                });
                var contentDocument = contentRequest.body;
                log.debug("contentDocument", contentDocument);
                var sponsorid = context.request.parameters.sponsorid;
                log.debug("sponsorid", sponsorid);
                if (sponsorid && sponsorid != "" && sponsorid != null) {
                    contentDocument = contentDocument.replace("{{sponsorid}}", sponsorid);
                    log.debug("Setting Sponsor", sponsorid)
                }
                var projectid = context.request.parameters.projectid;
                log.debug("projectid", projectid);
                if (projectid && projectid != "" && projectid != null) {
                    contentDocument = contentDocument.replace("{{projectid}}", projectid);
                    log.debug("Setting Project", projectid);
                }
                context.response.write(contentDocument);
            } catch (err) {
                log.debug("error in getFunction", err);
            }
        }

        function postFunction(context) {
            try {
                log.debug("in post function");
                var params = context.request.parameters;
                var emailId;
                var primaryContact;
                var vendorName;
                var checkAllow;
                for (var param in params) {
                    //get field datas
                    if (param === "emailid") {
                        emailId = params[param];
                        // log.debug("email id ",emailId);
                    }
                    if (param === "primarycontact") {
                        primaryContact = params[param];
                        // log.debug("primaryContact ",primaryContact);
                    }
                    if (param === "vendorname") {
                        vendorName = params[param];
                        // log.debug("vendorname ",vendorName);
                    }
                    if (param === "checkallow") {
                        checkAllow = params[param];
                        // log.debug("vendorname ",vendorName);
                    }
                    log.debug("checkAllow", checkAllow);
                }
                log.debug("details from form", emailId + "," + primaryContact + "," + vendorName);
                // if (checkAllow == "on") {
                //allow invite
                //get access token from custom record
                // var lastSyncAccessToken = checkAccessToken();
                var creednzObj = checkAccessToken();
                var lastSyncAccessToken = creednzObj.lastSyncAccessToken;
                var creednzBaseUrl = creednzObj.creednzBaseUrl;

                //set post header
                var creedNzApiHeaders = {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'authorization': 'Bearer ' + lastSyncAccessToken
                    //  'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjBDQURVdzIwQUJYNnJvMm1uaU5jXyJ9.eyJpc3MiOiJodHRwczovL2NyZWVkbnotdGVzdC51cy5hdXRoMC5jb20vIiwic3ViIjoiN2Q3ZTZjZVFCeFJZTU5vYUJzVEpTUVdETDFpeWR1NkZAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vY3JlZWRuei1keW5hbWljcy1pbnRlZ3JhdGlvbiIsImlhdCI6MTcxODE4MTY5MSwiZXhwIjoxNzE4MjY4MDkxLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMiLCJhenAiOiI3ZDdlNmNlUUJ4UllNTm9hQnNUSlNRV0RMMWl5ZHU2RiJ9.yz2MZFO21PrhwxxuEXxIb0tvwcgRVWQMyzFU2kqMp63PZ5n7x9_H9tZtP96ui96dVGnVqRmKF3V-43eVQNUpqb3LTwzTmuFe6MYg3yHV4Q9sSRJvTOm7mPlbC14Af52MopnkK0YmqxdZnagJ7MdkXr5a_z2PWmnsDhZ811OiMKNo22As7yd9oA60D9MfSmUf6iXq_41Ms6olae4vPgvWbLJ9kedfkahnYlQ-em947kEdMR6XT-X0PiOHnjOurQnNm0USDqHuirKIrl76Z4S92yk5P3qbnl-gSzdgYc9wzGPSOsLYAKu8Fj0ls_1sDABYRz5RIKyCleV_O4oolkqzLw'
                };
                //set data object
                var dataObj = JSON.stringify({
                    "email": emailId,
                    "primaryContact": primaryContact,
                    "vendorName": vendorName
                });
                //var creedNzInviteVendorUrl = "https://edge.staging.creednz.com/external/microsoft-dynamics/invite-vendor";
                // var creedNzInviteVendorUrl = "https://edge.staging.creednz.com/external/erp/vendor-evaluation/invite";
                var creedNzInviteVendorUrl = creednzBaseUrl + "/external/erp/vendor-evaluation/invite";

                var creedNzResponse = https.post({
                    url: creedNzInviteVendorUrl,
                    headers: creedNzApiHeaders,
                    body: dataObj
                });
                // log.debug("creedNzResponse", creedNzResponse);
                var creedNzTransactions = JSON.parse(creedNzResponse.body);
                log.debug("creedNzTransactions", creedNzTransactions);
                var creednzEvaluationId = creedNzTransactions.id;
                log.debug("creednzEvaluationId", creednzEvaluationId);
                //   var creednzEvaluationRiskAssessment = creedNzTransactions.riskAssessmentStatus;
                //   log.debug("creednzEvaluationRiskAssessment",creednzEvaluationRiskAssessment);

                //check this vendor is existing in custom record or not
                var customrecord_vendor_evaluation_tableSearchObj = search.create({
                    type: "customrecord_vendor_evaluation_table",
                    filters: [
                        ["custrecord_vendor_email", "is", emailId], "AND",
                        ["custrecord_primary_contact", "is", primaryContact], "AND",
                        ["custrecord_vendor_name", "is", vendorName]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        })
                    ]
                });
                var searchResultCount = customrecord_vendor_evaluation_tableSearchObj.runPaged().count;
                log.debug("customrecord_vendor_evaluation_tableSearchObj result count", searchResultCount);
                customrecord_vendor_evaluation_tableSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    var inviteVendorId = result.getValue({
                        name: "internalid"
                    });
                    log.debug("invitevendor id", inviteVendorId);
                    //submit creednz evaluation id into custom record
                    //submit fields
                    var inviteVendorRecId = record.submitFields({
                        type: 'customrecord_vendor_evaluation_table',
                        id: inviteVendorId,
                        values: {
                            'custrecord_creednz_evaluation_id': creednzEvaluationId,
                            'custrecord_assessment_status': 'Invite Sent'
                        }
                    });
                    log.debug("value added to the record", inviteVendorRecId);
                    return true;
                });
                // create new vendor in custom record if invite vendor is new vendor
                if (!searchResultCount) {
                    var newInviteVendorRecord = record.create({
                        type: 'customrecord_vendor_evaluation_table',
                        isDynamic: true
                    });
                    newInviteVendorRecord.setValue({
                        fieldId: 'custrecord_vendor_name',
                        value: vendorName
                    });
                    newInviteVendorRecord.setValue({
                        fieldId: 'custrecord_primary_contact',
                        value: primaryContact
                    });
                    newInviteVendorRecord.setValue({
                        fieldId: 'custrecord_vendor_email',
                        value: emailId
                    });
                    newInviteVendorRecord.setValue({
                        fieldId: 'custrecord_creednz_evaluation_id',
                        value: creednzEvaluationId
                    });
                    //set risk assessment status as invite sent as default
                    newInviteVendorRecord.setValue({
                        fieldId: 'custrecord_assessment_status',
                        value: 'Invite Sent'
                    });
                    let newInviteVendorRecordId = newInviteVendorRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: false
                    });
                    log.debug("new invite vendor saved", newInviteVendorRecordId);
                } else {
                    //location.reload();
                }
                var closeHtml = '<html><body><script type="text/javascript">window.opener.location.reload(); window.close(); </script></body></html>';
                context.response.write(closeHtml);

            } catch (err) {
                log.debug("error in postFunction", err);
            }
        } //end function
        function checkAccessToken() {
            try {
                var creednzObj = {};
                //get access token from custom record
                var accessTokenLookup = search.lookupFields({
                    type: 'customrecord_creednz_details',
                    id: 1,
                    columns: ['custrecord_creednz_access_token', 'custrecord_creednz_last_updated_date', 'custrecord_creednz_client_id', 'custrecord_creednz_client_secret', 'custrecord_creednz_base_url', 'custrecord_auth0_get_token_api', 'custrecord_audience']
                });
                var lastSyncAccessToken = accessTokenLookup.custrecord_creednz_access_token;
                var lastUpdatedDateTime = accessTokenLookup.custrecord_creednz_last_updated_date;
                var creednzClientId = accessTokenLookup.custrecord_creednz_client_id;
                var creednzClientSecret = accessTokenLookup.custrecord_creednz_client_secret;
                var creednzBaseUrl = accessTokenLookup.custrecord_creednz_base_url;
                var creednzAuth0 = accessTokenLookup.custrecord_auth0_get_token_api;
                var creednzAudience = accessTokenLookup.custrecord_audience;
                //check access token is existing or expired
                var currentDate = new Date();
                log.debug("current date", currentDate);
                // check if access token is exist or not
                if (lastSyncAccessToken) {
                    //check if the access token is expired or not
                    log.debug("access token exist, ckeck expired or not");
                    //lastUpdatedDateTime = new Date(lastUpdatedDateTime);
                    var lastUpdatedDateTimeNow = format.format({
                        value: lastUpdatedDateTime,
                        type: format.Type.DATETIMETZ
                    });
                    log.debug("lastUpdatedDateTimeNow", lastUpdatedDateTimeNow);
                    var parsedDateStringAsRawDateObject = format.parse({
                        value: lastUpdatedDateTimeNow,
                        type: format.Type.DATETIMETZ
                    });
                    log.debug("parsedDateStringAsRawDateObject", parsedDateStringAsRawDateObject);
                    var accessTokenTimeDiff = (currentDate.getTime() - parsedDateStringAsRawDateObject.getTime()) / 1000;
                    log.debug("time difference in seconds", accessTokenTimeDiff);
                    // if access token expired, create new access token using refresh token
                    if (accessTokenTimeDiff > 86400) {
                        // create new access token
                        log.debug('old access token is expired, create new access token');
                        lastSyncAccessToken = getAccessToken(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience);
                        log.debug("access token created when it expired", lastSyncAccessToken);
                    }
                } //end if(lastSyncAccessToken)
                else {
                    log.debug("no api key exist");
                    // call function to create new access token
                    lastSyncAccessToken = getAccessToken(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience);
                    log.debug("access token created", lastSyncAccessToken);
                }
                creednzObj.lastSyncAccessToken = lastSyncAccessToken;
                creednzObj.creednzBaseUrl = creednzBaseUrl;

                return creednzObj;
            } catch (err) {
                log.debug("error in check access token", err.message);
            }
        } //end checkAccessToken
        function getAccessToken(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience) {
            try {
                return creednz_token_lib.getTokenCreednz(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience);
            } catch (err) {
                log.debug("error in function getAccessToken", err);
            }
        } //end function
        return {
            onRequest: onRequest,
            getFunction: getFunction,
            postFunction: postFunction,
            getAccessToken: getAccessToken
        };
    });