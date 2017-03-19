var DigitalSign =  function(options){
    this.options = options;
    this.signLib = EUSignCP();

    this.CAServer = this.CAList[0];
};

DigitalSign.prototype.CAList = [
        {
        "issuerCNs":                ["АЦСК ПАТ КБ «ПРИВАТБАНК»",
                                    "АЦСК «ПРИВАТБАНК»"],
        "address":                  "acsk.privatbank.ua",
        "ocspAccessPointAddress":   "acsk.privatbank.ua/services/ocsp/",
        "ocspAccessPointPort":      "80",
        "cmpAddress":               "acsk.privatbank.ua",
        "tspAddress":               "acsk.privatbank.ua",
        "tspAddressPort":           "80"
    },
    {
        "issuerCNs":                ["АЦСК ТОВ \"Центр сертифікації ключів \"Україна\"",
                                    "ТОВ \"Центр сертифікації ключів \"Україна\""],
        "address":                  "uakey.com.ua",
        "ocspAccessPointAddress":   "uakey.com.ua",
        "ocspAccessPointPort":      "80",
        "cmpAddress":               "uakey.com.ua",
        "tspAddress":               "uakey.com.ua",
        "tspAddressPort":           "80"
    },

];

DigitalSign.prototype.init = function() {
    try {
        this.signLib.Initialize();
        this.signLib.SetJavaStringCompliant(true);
        this.signLib.SetCharset("UTF-16LE");

        this.initialized = true;
    } catch (e) {
        console.error(e);
    }
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
    return  this.signLib.GetKeyInfoBinary(key, password);
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
DigitalSign.prototype.loadCertificatesByPrivateKey = function( decodedKey, cmpServerAddress,onSuccess, onFail) {
    console.log('loadCertificatesByPrivateKey', decodedKey, cmpServerAddress, onSuccess, onFail);
    try {
        var certificates = this.signLib.GetCertificatesByKeyInfo(decodedKey, [cmpServerAddress]);
        console.log("GET CERTIFICATES", 'loadCertificatesByPrivateKey', certificates);

        // save certs
        this.signLib.SaveCertificates(certificates);

        onSuccess(certificates);
    } catch (e) {
        onFail(e);
    }
};


DigitalSign.prototype.loadPrivateKeyOwnerInfo = function(key, password) {
    console.log('getKeyOwnerInfo', key, password);

    var ownerInfo = this.signLib.ReadPrivateKeyBinary(key, password);
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

    var ownerInfo = this.signLib.ReadPrivateKeyBinary(key, password);
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
    var decodedPKey = this.decodePrivateKeyByPassword(key, password);

    // certificate section - load and save certificates here
    var _onCertificatesLoaded = function(certificatesUInt8Array) {
        // on certificates loaded - get private user info
        var privateKeyOwnerInfo = this.loadPrivateKeyOwnerInfo(key, password);
        onTotalSuccess(privateKeyOwnerInfo);
    };

    var _onFail = function (err){
        console.err(err);
    };
    // load and save certificates
    this.loadCertificatesByPrivateKey(decodedPKey, cmpServerAddress, _onCertificatesLoaded.bind(this), _onFail.bind(this));

    var ownerInfo = this.signLib.ReadPrivateKeyBinary(key, password);
    console.log('getPrivateKeyOwnerInfo:', ownerInfo);
    return ownerInfo;
};



DigitalSign.prototype.signData  = function(data) {
    var signedData;
    var dsAlgType = 1;// ДСТУ -1, RSA -2
    switch(dsAlgType) {
        default:
        case 1 :
            signedData = this.signLib.SignDataInternal(true /*isAppendCert*/ , data, true /*asBase64String*/);
        break;
        case 2 :
            signedData = this.signLib.SignDataRSA(data, true /*isAppendCert*/, false /*externalSgn*/ , true /*asBase64String*/);
        break;
    }

    return signedData;
};



DigitalSign.prototype.extractSignedDocument  = function(signedDocument) {
    var info = this.signLib.VerifyDataInternal(signedDocument);

    return {owner : info.GetOwnerInfo(),
            signtime: info.GetTimeInfo(),
            data : this.signLib.ArrayToString(info.GetData())
            };
};
