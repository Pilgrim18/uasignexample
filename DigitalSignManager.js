var DigitalSign =  function(options){
    this.options = options;
};


/**
 * Applies password to user key, and decodes it.
 * Throws error in case if key/password mismatch, or corrupted key
 *
 * @param  {String} key
 * @param  {String} password
 * @return {String}           decoded key data as string
 */
DigitalSign.prototype.decodePrivateKeyByPassword = function(key, password) {
    console.log('decodePrivateKeyByPassword', key, password);
    return  euSign.GetKeyInfoBinary(key, password);
};


/**
 * Loads certificates from cmp server for given decoded key.
 *
 * @param  {[type]} cmpServerAddress [description]
 * @param  {[type]} key              [description]
 * @param  {[type]} password         [description]
 * @param  {[type]} onSuccess        [description]
 * @param  {[type]} onFail           [description]
 * @return {UInt8Array}
 */
DigitalSign.prototype.loadCertificatesByPrivateKey = function(cmpServerAddress, decodedKey, onSuccess, onFail) {
    console.log('loadCertificatesByPrivateKey', cmpServerAddress, decodedKey, onSuccess, onFail);
    try {
        var certificates = euSign.GetCertificatesByKeyInfo(decodedKey, [cmpServerAddress]);
        console.log("GET CERTIFICATES", 'loadCertificatesByPrivateKey', certificates);

        // save certs
        euSign.SaveCertificates(certificates)

        onSuccess(certificates);
    } catch (e) {
        onFail(e);
    }
};


DigitalSign.prototype.loadPrivateKeyOwnerInfo = function(key, password) {
    console.log('getKeyOwnerInfo', key, password);

    var ownerInfo = euSign.ReadPrivateKeyBinary(key, password);
    console.log('getKeyOwnerInfo:', ownerInfo);
    return ownerInfo;
};


/**
 * Returns private key owner info, if it was loaded before
 * @see loadPrivateKeyOwnerInfo
 *
 * @param  {[type]} key      [description]
 * @param  {[type]} password [description]
 * @return {[type]}          [description]
 */
DigitalSign.prototype.getPrivateKeyOwnerInfo = function(key, password) {
    console.log('getPrivateKeyOwnerInfo', key, password);

    var ownerInfo = euSign.ReadPrivateKeyBinary(key, password);
    console.log('getPrivateKeyOwnerInfo:', ownerInfo);
    return ownerInfo;
};


/**
 * [loadAndApprovePrivateKey description]
 * @param  {[type]} key              [description]
 * @param  {[type]} password         [description]
 * @param  {[type]} cmpServerAddress [description]
 * @param  {[type]} onTotalSuccess   [description]
 * @return {[type]}                  [description]
 */
DigitalSign.prototype.loadAndApprovePrivateKey = function(key, password, cmpServerAddress, onTotalSuccess) {
    console.log('loadAndApprovePrivateKey', key, password, cmpServerAddress);

    // get decoded Key
    var decodedPKey = this.decodePrivateKeyByPassword(key, passw);

    // certificate section - load and save certificates here
    var _onCertificatesLoaded = function(certificatesUInt8Array) {
        // on certificates loaded - get private user info
        var privateKeyOwnerInfo = this.loadPrivateKeyOwnerInfo(key, passw);
        onTotalSuccess(privateKeyOwnerInfo);
    };

    var _onFail = function (err){
        console.err(err);
    };
    // load and save certificates
    this.loadCertificatesByPrivateKey(decodedKey, cmpServerAddress, _onCertificatesLoaded, _onFail;

    var ownerInfo = euSign.ReadPrivateKeyBinary(key, password);
    console.log('getPrivateKeyOwnerInfo:', ownerInfo);
    return ownerInfo;
};



DigitalSign.prototype.signDataWithKey  = function(data, decodedkey) {
    var signedData;
    var dsAlgType = 1;// ДСТУ -1, RSA -2
    switch(dsAlgType) {
        default:
        case 1 :
            signedData = euSign.SignDataInternal(true /*isAppendCert*/ , data, true /*asBase64String*/);
        break;
        case 2 :
            signedData = euSign.SignDataRSA(data, true /*isAppendCert*/, false /*externalSgn*/ , true /*asBase64String*/);
        break;
    }

    return signedData;
};



DigitalSign.prototype.extractSignedDocument  = function(signedDocument) {
    var info = euSign.VerifyDataInternal(signedData);

    return {owner : info.GetOwnerInfo(),
            signtime: info.GetTimeInfo(),
            data : euSign.ArrayToString(info.GetData())
            };
};
