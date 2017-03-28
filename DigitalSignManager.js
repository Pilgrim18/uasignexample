
var DigitalSign =  function(options){
    this.options = options;
    this.signLib = EUSignCP();
    window.utils = Utils(this.signLib);

    this.URL_XML_HTTP_PROXY_SERVICE = "/backend/proxy.php";
    this.URL_CAS = "/Data/CAs.json?version=1.0.5";
    this.URL_GET_CERTIFICATES = "/Data/CACertificates.p7b?version=1.0.5";

    this.signLib.SetXMLHTTPProxyService(this.URL_XML_HTTP_PROXY_SERVICE);

    this.CA_SERVER_NUM = 0; // PRIVAT BANK

};

function setKeyStatus(info) {
    console.log(info);
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
    {
        "issuerCNs":                ["Акредитований центр сертифікації ключів ІДД ДФС",
                                    "Акредитований центр сертифікації ключів ІДД Міндоходів",
                                    "Акредитований центр сертифікації ключів ІДД ДПС"],
        "address":                  "acskidd.gov.ua",
        "ocspAccessPointAddress":   "acskidd.gov.ua/services/ocsp/",
        "ocspAccessPointPort":      "80",
        "cmpAddress":               "acskidd.gov.ua",
        "tspAddress":               "acskidd.gov.ua",
        "tspAddressPort":           "80"
    }
];

DigitalSign.prototype.init = function() {
    try {
        this.CAsServers =  DigitalSign.prototype.CAList;

        try {
            this.signLib.Initialize();
            this.signLib.SetJavaStringCompliant(true);
            this.signLib.SetCharset("UTF-16LE");

            if (this.signLib.DoesNeedSetSettings()) {
                this.setDefaultSettings();
                if (utils.IsStorageSupported()) {
                    this.loadCertsAndCRLsFromLocalStorage();
                } else {
                    alert("Локальне сховище не підтримується");
                }
            }

            this.loadCertsFromServer();
            // if (verification) {
            //     this.verifyData();
            //     mprogress.end();
            //     return false;
            // }
            this.setCASettings(this.CA_SERVER_NUM);
            // setPointerEvents(
            //     document.getElementById('PGenKeyButton'), true);
            // setPointerEvents(
            //     document.getElementById('VerifyDataButton'), true);

            // this.setSelectPKCertificatesEvents();
            if (utils.IsSessionStorageSupported()) {

                // var _readPrivateKeyAsStoredFile = function () {
                //     this.readPrivateKeyAsStoredFile();
                // }

                // setTimeout(_readPrivateKeyAsStoredFile, 10);
            }

            setStatus('');
        } catch (e) {
            throw  e;
            setStatus('не ініціалізовано');
        }

        this.initialized = true;
    } catch (e) {
        console.error(e);
        setStatus('ERROR');
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
        console.error(err);
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



DigitalSign.prototype.setDefaultSettings = function() {
    try {
        this.signLib.SetXMLHTTPProxyService(this.URL_XML_HTTP_PROXY_SERVICE);

        var settings = this.signLib.CreateFileStoreSettings();
        settings.SetPath("/certificates");
        settings.SetSaveLoadedCerts(true);
        this.signLib.SetFileStoreSettings(settings);

        settings = this.signLib.CreateProxySettings();
        this.signLib.SetProxySettings(settings);

        settings = this.signLib.CreateTSPSettings();
        this.signLib.SetTSPSettings(settings);

        settings = this.signLib.CreateOCSPSettings();
        this.signLib.SetOCSPSettings(settings);

        settings = this.signLib.CreateCMPSettings();
        this.signLib.SetCMPSettings(settings);

        settings = this.signLib.CreateLDAPSettings();
        this.signLib.SetLDAPSettings(settings);

        settings = this.signLib.CreateOCSPAccessInfoModeSettings();
        settings.SetEnabled(true);
        this.signLib.SetOCSPAccessInfoModeSettings(settings);

        var CAs = this.CAsServers;
        settings = this.signLib.CreateOCSPAccessInfoSettings();
        if (CAs) {
            for (var i = 0; i < CAs.length; i++) {
                settings.SetAddress(CAs[i].ocspAccessPointAddress);
                settings.SetPort(CAs[i].ocspAccessPointPort);

                for (var j = 0; j < CAs[i].issuerCNs.length; j++) {
                    settings.SetIssuerCN(CAs[i].issuerCNs[j]);
                    this.signLib.SetOCSPAccessInfoSettings(settings);
                }
            }
        }
    } catch (e) {
        alert("Виникла помилка при встановленні налашувань: " + e);
    }
};



DigitalSign.prototype.loadCertsFromServer = function() {
    var certificates = utils.GetSessionStorageItem(
        this.CACertificatesSessionStorageName, true, false);
    if (certificates != null) {
        try {
            this.signLib.SaveCertificates(certificates);
            return;
        } catch (e) {
            alert("Виникла помилка при імпорті " +
                "завантажених з сервера сертифікатів " +
                "до файлового сховища");
        }
    }

    var _onSuccess = function(certificates) {
        try {
            this.signLib.SaveCertificates(certificates);
            utils.SetSessionStorageItem(
                this.CACertificatesSessionStorageName,
                certificates, false);
        } catch (e) {
            alert("Виникла помилка при імпорті " +
                "завантажених з сервера сертифікатів " +
                "до файлового сховища");
        }
    };

    var _onFail = function(errorCode) {
        console.log("Виникла помилка при завантаженні сертифікатів з сервера. " +
            "(HTTP статус " + errorCode + ")");
    };

    utils.GetDataFromServerAsync(this.URL_GET_CERTIFICATES, _onSuccess.bind(this), _onFail.bind(this), true);
};





DigitalSign.prototype.loadCertsAndCRLsFromLocalStorage = function() {
    try {
        var files = this.loadFilesFromLocalStorage(
            this.CertsLocalStorageName,
            function(fileName, fileData) {
                if (fileName.indexOf(".cer") >= 0)
                    this.signLib.SaveCertificate(fileData);
                else if (fileName.indexOf(".p7b") >= 0)
                    this.signLib.SaveCertificates(fileData);
            });
        if (files != null && files.length > 0)
            this.setItemsToList('SelectedCertsList', files);
        else {
            document.getElementById('SelectedCertsList').innerHTML =
                "Сертифікати відсутні в локальному сховищі";
        }
    } catch (e) {
        document.getElementById('SelectedCertsList').innerHTML =
            "Виникла помилка при завантаженні сертифікатів " +
            "з локального сховища";
    }

    try {
        var files = this.loadFilesFromLocalStorage(
            this.CRLsLocalStorageName,
            function(fileName, fileData) {
                if (fileName.indexOf(".crl") >= 0) {
                    try {
                        this.signLib.SaveCRL(true, fileData);
                    } catch (e) {
                        this.signLib.SaveCRL(false, fileData);
                    }
                }
            });
        if (files != null && files.length > 0)
            this.setItemsToList('SelectedCRLsList', files);
        else {
            document.getElementById('SelectedCRLsList').innerHTML =
                "СВС відсутні в локальному сховищі";
        }
    } catch (e) {
        document.getElementById('SelectedCRLsList').innerHTML =
            "Виникла помилка при завантаженні СВС з локального сховища";
    }
};



DigitalSign.prototype.loadFilesFromLocalStorage = function(localStorageFolder, loadFunc) {
    if (!utils.IsStorageSupported())
        this.signLib.RaiseError(EU_ERROR_NOT_SUPPORTED);

    if (utils.IsFolderExists(localStorageFolder)) {
        var files = utils.GetFiles(localStorageFolder);
        for (var i = 0; i < files.length; i++) {
            var file = utils.ReadFile(
                localStorageFolder, files[i]);
            loadFunc(files[i], file);
        }
        return files;
    } else {
        utils.CreateFolder(localStorageFolder);
        return null;
    }
};



DigitalSign.prototype.loadCAsSettings = function(onSuccess, onError) {
    var pThis = this;

    var _onSuccess = function(casResponse) {
        try {

            var servers = JSON.parse(casResponse.replace(/\\'/g, "'"));

            // var select = document.getElementById("CAsServersSelect");
            // for (var i = 0; i < servers.length; i++) {
            //     var option = document.createElement("option");
            //     option.text = servers[i].issuerCNs[0];
            //     select.add(option);
            // }

            // var option = document.createElement("option");
            // option.text = "Локальні сертифікати";
            // select.add(option);

            // select.onchange = function() {
            //     pThis.setCASettings(select.selectedIndex);
            // };

            pThis.CAsServers = servers;

            onSuccess();
        } catch (e) {
            console.log(e);
            //throw e;
            onError();
        }
    };
    this.signLib.LoadDataFromServer(this.URL_CAS, _onSuccess.bind(this), onError, false);
};

DigitalSign.prototype.setCASettings = function(caIndex) {
    try {
        var caServer = (caIndex < this.CAsServers.length) ?
            this.CAsServers[caIndex] : null;
        var offline = ((caServer == null) ||
                (caServer.address == "")) ?
            true : false;
        var useCMP = (!offline && (caServer.cmpAddress != ""));
        var loadPKCertsFromFile = (caServer == null) ||
            (!useCMP && !caServer.certsInKey);

        this.CAServer = caServer;
        this.offline = offline;
        this.useCMP = useCMP;
        this.loadPKCertsFromFile = loadPKCertsFromFile;

        setKeyStatus("Оберіть файл з особистим ключем (зазвичай з ім'ям Key-6.dat) та вкажіть пароль захисту", 'info');
        // if (loadPKCertsFromFile) {
        //     document.getElementById('ChoosePKFileText').innerHTML +=
        //         ", а також оберіть сертифікат(и) (зазвичай, з розширенням cer, crt)";
        // }

        var settings;

        // document.getElementById('PKCertsSelectZone').hidden = loadPKCertsFromFile ? '' : 'hidden';
        this.clearPrivateKeyCertificatesList();

        settings = this.signLib.CreateTSPSettings();
        if (!offline) {
            settings.SetGetStamps(false);
            // if (caServer.tspAddress != "") {
            //     settings.SetAddress(caServer.tspAddress);
            //     settings.SetPort(caServer.tspAddressPort);
            // } else {
            settings.SetAddress('acskidd.gov.ua');
            settings.SetPort('80');
            // }
        }
        this.signLib.SetTSPSettings(settings);

        settings = this.signLib.CreateOCSPSettings();
        if (!offline) {
            settings.SetUseOCSP(true);
            settings.SetBeforeStore(true);
            settings.SetAddress(caServer.ocspAccessPointAddress);
            settings.SetPort(caServer.ocspAccessPointPort);
        }
        this.signLib.SetOCSPSettings(settings);

        settings = this.signLib.CreateCMPSettings();
        settings.SetUseCMP(useCMP);
        if (useCMP) {
            settings.SetAddress(caServer.cmpAddress);
            settings.SetPort("80");
        }
        this.signLib.SetCMPSettings(settings);

        settings = this.signLib.CreateLDAPSettings();
        this.signLib.SetLDAPSettings(settings);
    } catch (e) {
        //throw e;
        alert("Виникла помилка при встановленні налашувань: " + e);
    }
};

DigitalSign.prototype.clearPrivateKeyCertificatesList = function () {
    this.privateKeyCerts = null;
};
