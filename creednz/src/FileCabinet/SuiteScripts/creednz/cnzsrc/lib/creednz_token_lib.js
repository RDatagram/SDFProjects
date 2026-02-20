/**
 * @NApiVersion 2.1
 */
define(['N/https', 'N/record', 'N/search','N/format'],
    /**
     * @param{https} https
     * @param{record} record
     * @param{search} search
     * @param{format} format
     */
    (https, record, search, format) => {

        const getTokenCreednz = (creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience) => {
            try {
                // var creedApiUrl = "https://creednz-test.us.auth0.com/oauth/token";
                const creedApiUrl = creednzAuth0;
                let creedNzApiHeaders = {
                    'content-type': 'application/x-www-form-urlencoded'
                };
                let newAccessTokenData = {
                    "client_id": creednzClientId,
                    "client_secret": creednzClientSecret,
                    "grant_type": "client_credentials",
                    "audience": creednzAudience
                };
                let creedNzTokenApiResponse = https.post({
                    url: creedApiUrl,
                    headers: creedNzApiHeaders,
                    body: newAccessTokenData
                });
                // log.debug("creedNzTokenApiResponse", creedNzTokenApiResponse);
                let creedNzTokenBody = creedNzTokenApiResponse.body;
                // log.debug("creedNzTokenBody", creedNzTokenBody);
                creedNzTokenBody = JSON.parse(creedNzTokenBody);
                let accessToken = creedNzTokenBody.access_token;
                log.debug("accessToken in getAccessToken", accessToken);
                let currentDate = new Date();
                // log.debug('currentDate', currentDate);
                record.submitFields({
                    type: 'customrecord_creednz_details',
                    id: 1,
                    values: {
                        'custrecord_creednz_access_token': accessToken,
                        'custrecord_creednz_last_updated_date': currentDate
                    }
                });
                return accessToken;
            } catch (err) {
                log.debug("error in function getAccessToken", err);
            }
        }

        function checkAccessToken() {
            try {
                //get access token from custom record
                let creednzObj = {};
                //get access token from custom record
                let accessTokenLookup = search.lookupFields({
                    type: 'customrecord_creednz_details',
                    id: 1,
                    columns: ['custrecord_creednz_access_token', 'custrecord_creednz_last_updated_date', 'custrecord_creednz_client_id', 'custrecord_creednz_client_secret', 'custrecord_creednz_base_url', 'custrecord_auth0_get_token_api', 'custrecord_audience']
                });
                let lastSyncAccessToken = accessTokenLookup.custrecord_creednz_access_token;
                let lastUpdatedDateTime = accessTokenLookup.custrecord_creednz_last_updated_date;
                const creednzClientId = accessTokenLookup.custrecord_creednz_client_id;
                const creednzClientSecret = accessTokenLookup.custrecord_creednz_client_secret;
                const creednzBaseUrl = accessTokenLookup.custrecord_creednz_base_url;
                const creednzAuth0 = accessTokenLookup.custrecord_auth0_get_token_api;
                const creednzAudience = accessTokenLookup.custrecord_audience;
                //check access token is existing or expired
                let currentDate = new Date();
                //log.debug("current date", currentDate);
                // check if access token is exist or not
                if (lastSyncAccessToken) {
                    //check if the access token is expired or not
                    //log.debug("access token exist, ckeck expired or not");
                    //lastUpdatedDateTime = new Date(lastUpdatedDateTime);
                    let lastUpdatedDateTimeNow = format.format({
                        value: lastUpdatedDateTime,
                        type: format.Type.DATETIMETZ
                    });
                    //log.debug("lastUpdatedDateTimeNow", lastUpdatedDateTimeNow);
                    let parsedDateStringAsRawDateObject = format.parse({
                        value: lastUpdatedDateTimeNow,
                        type: format.Type.DATETIMETZ
                    });
                    //log.debug("parsedDateStringAsRawDateObject", parsedDateStringAsRawDateObject);
                    let accessTokenTimeDiff = (currentDate.getTime() - parsedDateStringAsRawDateObject.getTime()) / 1000;
                    //log.debug("time difference in seconds", accessTokenTimeDiff);
                    // if access token expired, create new access token using refresh token
                    if (accessTokenTimeDiff > 86400) {
                        // create new access token
                        log.debug('old access token is expired, create new access token');
                        lastSyncAccessToken = getTokenCreednz(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience);
                        log.debug("access token created when it expired", lastSyncAccessToken);
                    }
                } //end if(lastSyncAccessToken)
                else {
                    log.debug("no api key exist");
                    // call function to create new access token
                    lastSyncAccessToken = getTokenCreednz(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience);
                    log.debug("access token created", lastSyncAccessToken);
                }

                creednzObj.lastSyncAccessToken = lastSyncAccessToken;
                creednzObj.creednzBaseUrl = creednzBaseUrl;

                return creednzObj;
            } catch (err) {
                log.debug("error in check access token", err.message);
            }
        } //end checkAccessToken
        return {getTokenCreednz, checkAccessToken}

    });
