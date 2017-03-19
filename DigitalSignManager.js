var DigitalSign =  function(options){
    this.options = options;
};

DigitalSign.prototype.loadCertificatesByPrivateKey = function(cmpServerAddress, key, password, onSuccess, onFail) {
    console.log('loadCertificatesByPrivateKey', cmpServerAddress, key, password, onSuccess, onFail);
    try {
        var keyInfoBinary = euSign.GetKeyInfoBinary(key, password);

        var certificates = euSign.GetCertificatesByKeyInfo(keyInfo, [cmpServerAddress]);
        console.log("GET CERTIFICATES", 'loadCertificatesByPrivateKey', certificates);
        onSuccess(certificates);
    } catch (e) {
        onFail(e);
    }
};

