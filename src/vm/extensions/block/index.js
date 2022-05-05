import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import translations from './translations.json';
import blockIcon from './numberbank_icon.png';
import 'firebase/app';
import 'firebase/firestore';
import crypto from 'crypto';


/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {object} messageData - format-message object
 * @returns {string} - message for the locale
 */
 let formatMessage = messageData => messageData.defaultMessage;

 /**
  * Setup format-message for this extension.
  */
 const setupTranslations = () => {
     const localeSetup = formatMessage.setup();
     if (localeSetup && localeSetup.translations[localeSetup.locale]) {
         Object.assign(
             localeSetup.translations[localeSetup.locale],
             translations[localeSetup.locale]
         );
     }
 };
 
 const EXTENSION_ID = 'numberbank';
 
 /**
  * URL to get this extension as a module.
  * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
  * @type {string}
  */
 let extensionURL = 'https://con3office.github.io/xcx-numberbank/dist/numberbank.mjs';
 
 
 
 /**
  * Scratch 3.0 blocks for example of Xcratch.
  */
 class ExtensionBlocks {
 
     /**
      * @return {string} - the name of this extension.
      */
     static get EXTENSION_NAME() {
         return formatMessage({
             id: 'numberbank.name',
             default: 'NumberBank1.0',
             description: 'name of the extension'
         });
     }
 
     /**
      * @return {string} - the ID of this extension.
      */
     static get EXTENSION_ID() {
         return EXTENSION_ID;
     }
 
     /**
      * URL to get this extension.
      * @type {string}
      */
     static get extensionURL() {
         return extensionURL;
     }
 
     /**
      * Set URL to get this extension.
      * The extensionURL will be changed to the URL of the loading server.
      * @param {string} url - URL
      */
     static set extensionURL(url) {
         extensionURL = url;
     }
 
     /**
      * Construct a set of blocks for NumberBank1.0.
      * @param {Runtime} runtime - the Scratch 3.0 runtime.
      */
     constructor(runtime) {
         /**
          * The Scratch 3.0 runtime.
          * @type {Runtime}
          */
         this.runtime = runtime;
 
         if (runtime.formatMessage) {
             // Replace 'formatMessage' to a formatter which is used in the runtime.
             formatMessage = runtime.formatMessage;
         }
     }
 
 
 
     putNum(args) {
 
         if (masterSha256 == '') { return; }
 
         if (args.BANK == '' || args.CARD == '' || args.NUM == '') { return; }
 
         if (inoutFlag) { return; }
         inoutFlag = true;
 
         //console.log("putNum...");
 
         bankKey = bankName = args.BANK;
         cardKey = args.CARD;
 
         uniKey = bankKey.trim().concat(cardKey.trim());
         //console.log("uniKey: " + uniKey);    
 
         if (args.NUM != '' && args.NUM != undefined) {
             settingNum = args.NUM;
             //console.log("settingNum: " + settingNum);    
         }
 
         if (!crypto) {
             throw Error("crypto is not supported.");
         }
 
         if (bankKey != '' && bankKey != undefined) {
             ioWaiter(1)
                 .then(() => {
                     bankSha256 = encryptSha256(new TextEncoder().encode(bankKey));
                     //console.log("bankSha256: " + bankSha256);    
                 })
                 .then(() => {
                     cardSha256 = encryptSha256(new TextEncoder().encode(cardKey));
                     //console.log("cardSha256: " + cardSha256);
                 })
                 .then(() => {
                     uniSha256 = encryptSha256(new TextEncoder().encode(uniKey));
                     //console.log("uniSha256: " + uniSha256);
                 })
                 .then(() => {
                     //console.log("masterSha256: " + masterSha256);
 
                     if (masterSha256 != '' && masterSha256 != undefined) {
 
                         const now = Date.now();
                         setDoc(doc(db, 'card', uniSha256), {
                             number: settingNum,
                             bank_key: bankSha256,
                             card_key: cardSha256,
                             master_key: masterSha256,
                             time_stamp: now
                         })
                             .then(() => {
                                 setDoc(doc(db, 'bank', bankSha256), {
                                     bank_name: bankName,
                                     time_stamp: now
                                 })
                             })
                             .then(() => {
                                 inoutFlag = false;
                             })
                             .catch(function (error) {
                                 console.error("Error writing document: ", error);
                                 inoutFlag = false;
                             });
 
                     } else {
                         console.log("No MasterKey!");
                         inoutFlag = false;
                     }
 
 
 
                 });
 
         }
 
         return ioWaiter(interval.MsPut);
 
     }
 
 
     setNum(args, util) {
 
         if (masterSha256 == '') { return; }
 
         if (args.BANK == '' || args.CARD == '') { return; }
 
         if (inoutFlag) { return; }
         inoutFlag = true;
 
         //console.log("setNum...");
 
         const variable = util.target.lookupOrCreateVariable(null, args.VAL);
 
         bankKey = bankName = args.BANK;
         cardKey = args.CARD;
 
         uniKey = bankKey.trim().concat(cardKey.trim());
         //console.log("uniKey: " + uniKey);    
 
         if (!crypto) {
             throw Error("crypto is not supported.");
         }
 
         if (bankKey != '' && bankKey != undefined) {
             ioWaiter(1)
                 .then(() => {
                     bankSha256 = encryptSha256(new TextEncoder().encode(bankKey));
                     //console.log("bankSha256: " + bankSha256);    
                 })
                 .then(() => {
                     cardSha256 = encryptSha256(new TextEncoder().encode(cardKey));
                     //console.log("cardSha256: " + cardSha256);
                 })
                 .then(() => {
                     uniSha256 = encryptSha256(new TextEncoder().encode(uniKey));
                     //console.log("uniSha256: " + uniSha256);
                 })
                 .then(() => {
                     //console.log("masterSha256: " + masterSha256);
 
                     if (masterSha256 != '' && masterSha256 != undefined) {
 
                         //v8
                         // cardDb.doc(uniSha256).get().then(function (ckey) {
                         getDoc(doc(db, 'card', uniSha256)).then(function (ckey) {
 
                             if (ckey.exists) {
 
                                 // cardDb.doc(uniSha256).get()
                                 getDoc(doc(db, 'card', uniSha256))
                                     .then((doc) => {
                                         let data = doc.data();
                                         variable.value = data.number;
                                     })
                                     .then(() => {
                                         inoutFlag = false;
                                     })
                                     .catch(function (error) {
                                         console.error("Error getting document: ", error);
                                     });
 
                             } else {
                                 //console.log("No Card!");
                                 variable.value = '';
                                 inoutFlag = false;
                             }
 
                         }).catch(function (error) {
                             console.log("Error cheking document:", error);
                             inoutFlag = false;
                         });
 
                     } else {
                         // doc.data() will be undefined in this case
                         console.log("No MasterKey!");
                         inoutFlag = false;
                     }
 
 
 
 
 
 
                 });
 
         }
 
         return ioWaiter(interval.MsSet);
 
     }
 
 
     inoutDone() {
         return !inoutFlag;
     }
 
 
     getNum(args) {
 
         cloudNum = '';
 
         if (masterSha256 == '') { return; }
 
         if (args.BANK == '' || args.CARD == '') { return; }
 
         if (inoutFlag) { return; }
         inoutFlag = true;
 
         //console.log("getNum...");
 
         bankKey = bankName = args.BANK;
         cardKey = args.CARD;
 
         uniKey = bankKey.trim().concat(cardKey.trim());
         //console.log("uniKey: " + uniKey);    
 
         if (!crypto) {
             throw Error("crypto is not supported.");
         }
 
         if (bankKey != '' && bankKey != undefined) {
             ioWaiter(1)
                 .then(() => {
                     bankSha256 = encryptSha256(new TextEncoder().encode(bankKey));
                     //console.log("bankSha256: " + bankSha256);    
                 })
                 .then(() => {
                     cardSha256 = encryptSha256(new TextEncoder().encode(cardKey));
                     //console.log("cardSha256: " + cardSha256);
                 })
                 .then(() => {
                     uniSha256 = encryptSha256(new TextEncoder().encode(uniKey));
                     //console.log("uniSha256: " + uniSha256);
                 })
                 .then(() => {
                     //console.log("masterSha256: " + masterSha256);
 
 
                     if (masterSha256 != '' && masterSha256 != undefined) {
 
                         getDoc(doc(db, 'card', uniSha256)).then(function (ckey) {
 
                             if (ckey.exists) {
 
                                 getDoc(doc(db, 'card', uniSha256))
                                     .then((doc) => {
                                         let data = doc.data();
                                         cloudNum = data.number;
                                     })
                                     .then(() => {
                                         inoutFlag = false;
                                     })
                                     .catch(function (error) {
                                         console.error("Error getting document: ", error);
                                     });
 
                             } else {
                                 //console.log("No Card!");
                                 cloudNum = '';
                                 inoutFlag = false;
                             }
 
                         }).catch(function (error) {
                             console.log("Error cheking document:", error);
                             inoutFlag = false;
                         });
 
                     } else {
                         // doc.data() will be undefined in this case
                         console.log("No MasterKey!");
                         inoutFlag = false;
                     }
 
 
                 });
 
         }
 
         return ioWaiter(interval.MsGet);
 
     }
 
 
     repNum(args, util) {
         return cloudNum;
     }
 
 
     repCloudNum(args) {
 
         if (masterSha256 == '') { return; }
 
         if (args.BANK == '' || args.CARD == '') { return; }
 
         if (inoutFlag) { return; }
         inoutFlag = true;
 
         //console.log("repCloudNum...");
 
         bankKey = bankName = args.BANK;
         cardKey = args.CARD;
 
         uniKey = bankKey.trim().concat(cardKey.trim());
         //console.log("uniKey: " + uniKey);
 
         if (!crypto) {
             throw Error("crypto is not supported.");
         }
 
         if (bankKey != '' && bankKey != undefined) {
             ioWaiter(1)
                 .then(() => {
                     bankSha256 = encryptSha256(new TextEncoder().encode(bankKey));
                     //console.log("bankSha256: " + bankSha256);
                 })
                 .then(() => {
                     cardSha256 = encryptSha256(new TextEncoder().encode(cardKey));
                     //console.log("cardSha256: " + cardSha256);
                 })
                 .then(() => {
                     uniSha256 = encryptSha256(new TextEncoder().encode(uniKey));
                     //console.log("uniSha256: " + uniSha256);
                 })
                 .then(() => {
                     //console.log("masterSha256: " + masterSha256);
 
 
                     if (masterSha256 != '' && masterSha256 != undefined) {
 
                         getDoc(doc(db, 'card', uniSha256)).then(function (ckey) {
 
                             if (ckey.exists) {
 
                                 getDoc(doc(db, 'card', uniSha256))
                                     .then((doc) => {
                                         let data = doc.data();
                                         cloudNum = data.number;
                                     })
                                     .then(() => {
                                         inoutFlag = false;
                                     })
                                     .catch(function (error) {
                                         console.error("Error getting document: ", error);
                                     });
 
                             } else {
                                 //console.log("No Card!");
                                 cloudNum = '';
                                 inoutFlag = false;
                             }
 
                         }).catch(function (error) {
                             console.log("Error cheking document:", error);
                             inoutFlag = false;
                         });
 
                     } else {
                         // doc.data() will be undefined in this case
                         console.log("No MasterKey!");
                         inoutFlag = false;
                     }
 
 
                 });
 
         }
 
         return reportNumWaiter(interval.MsRep);
 
     }
 
 
     boolAvl(args, util) {
 
         if (masterSha256 == '') { return; }
 
         if (args.BANK == '' || args.CARD == '') { return; }
 
         if (inoutFlag) { return; }
         inoutFlag = true;
 
         //console.log("boolAvl...");
 
         bankKey = bankName = args.BANK;
         cardKey = args.CARD;
 
         uniKey = bankKey.trim().concat(cardKey.trim());
         //console.log("uniKey: " + uniKey);    
 
         if (!crypto) {
             throw Error("crypto is not supported.");
         }
 
         if (bankKey != '' && bankKey != undefined) {
 
             ioWaiter(1)            
                 .then(() => {
                     uniSha256 = encryptSha256(new TextEncoder().encode(uniKey));
                     //console.log("uniSha256: " + uniSha256);
                 })
                 .then(() => {
                     //console.log("masterSha256: " + masterSha256);
 
 
 
                     if (masterSha256 != '' && masterSha256 != undefined) {
 
                         getDoc(doc(db, 'card', uniSha256)).then(function (ckey) {
 
                             if (ckey.exists) {
                                 //console.log("Available!");
                                 inoutFlag = false;
                                 availableFlag = true;
                             } else {
                                 //console.log("No Available!");
                                 inoutFlag = false;
                                 availableFlag = false;
                             }
 
                         }).catch(function (error) {
                             console.log("Error checking document:", error);
                             inoutFlag = false;
                             availableFlag = false;
                         });
 
                     } else {
                         // doc.data() will be undefined in this case
                         console.log("No MasterKey!");
                         inoutFlag = false;
                         availableFlag = false;
                     }
 
 
                 })
 
         }
 
         return availableWaiter(interval.MsAvl);
 
     }
 
 
     setMaster(args) {
 
         if (args.KEY == '') { return; }
 
         masterSha256 = '';
         masterKey = args.KEY;
 
         mkbUrl = mkbBaseUrl + '?mkey=' + masterKey;
 
         mkbRequest = new Request(mkbUrl, { mode: 'cors' });
         fetch(mkbRequest)
             .then(response => {
                 inoutFlag = true;
 
                 if (response.ok) {
                     console.log(JSON.stringify(response.json()));
                     return response.json();
                 } else {
                     throw new Error('Unexpected responce status ${response.status} or content type');
                 }
 
             }).then((resBody) => {
 
                 cloudConfig_mkey.masterKey = resBody.masterKey;
                 cloudConfig_mkey.apiKey = resBody.apiKey;
                 cloudConfig_mkey.authDomain = resBody.authDomain;
                 cloudConfig_mkey.projectId = resBody.projectId;
                 cloudConfig_mkey.storageBucket = resBody.storageBucket;
                 cloudConfig_mkey.messagingSenderId = resBody.messagingSenderId;
                 cloudConfig_mkey.appId = resBody.appId;
                 cloudConfig_mkey.measurementId = resBody.measurementId;
                 interval.MsPut = resBody.intervalMsPut;
                 interval.MsSet = resBody.intervalMsSet;
                 interval.MsGet = resBody.intervalMsGet;
                 interval.MsRep = resBody.intervalMsRep;
                 interval.MsAvl = resBody.intervalMsAvl;
 
                 console.log('cloudConfig_mkey:', cloudConfig_mkey);
                 console.log('interval:', interval);
 
 
                 inoutFlag = false;
 
                 return ioWaiter(1);
             }).then(() => {
                 inoutFlag = true;
                 // Initialize Firebase
 
                 try {
                     fbApp = initializeApp(cloudConfig_mkb);
                     db = getFirestore(fbApp);
                     // fnc = getFunctions();
                 } catch (e) {
                     // v8
                     firebase.initializeApp(cloudConfig_mkb);
                     db = firebase.firestore();
                     // fnc = getFunctions();
                 }
 
                 bankDb = collection(db, 'bank');
                 cardDb = collection(db, 'card');
 
                 // console.log('fb_db_cpmplete');
 
                 inoutFlag = false;
                 return ioWaiter(1);
 
             });
 
 
 
         if (!crypto) {
             throw Error("crypto is not supported.");
         }
 
         ioWaiter(1)        
             .then(() => {
                 masterSha256 = encryptSha256(new TextEncoder().encode(masterKey));
             })
             .then(() => {
                 //console.log("MasterKey:", masterKey);
                 //console.log("masterSha256:", masterSha256);
                 console.log("MasterKey setted!");
 
             })
             .catch(function (error) {
                 console.log("Error setting MasterKey:", error);
             });
 
 
 
     }
 
 
 
 
     /**
      * @returns {object} metadata for this extension and its blocks.
      */
     getInfo() {
         setupTranslations();
         return {
             id: ExtensionBlocks.EXTENSION_ID,
             name: ExtensionBlocks.EXTENSION_NAME,
             extensionURL: ExtensionBlocks.extensionURL,
             blockIconURI: blockIcon,
             showStatusButton: false,
             blocks: [
                 {
                     opcode: 'putNum',
                     blockType: BlockType.COMMAND,
                     text: formatMessage({
                         id: 'numberbank.putNum',
                         default: 'put[NUM]to[CARD]of[BANK]',
                         description: 'put number to Firebase'
                     }),
                     arguments: {
                         BANK: {
                             type: ArgumentType.STRING,
                             defaultValue: formatMessage({
                                 id: 'numberbank.argments.bank',
                                 default: 'bank'
                             })
                         },
                         CARD: {
                             type: ArgumentType.STRING,
                             defaultValue: formatMessage({
                                 id: 'numberbank.argments.card',
                                 default: 'card'
                             })
                         },
                         NUM: {
                             type: ArgumentType.NUMBER,
                             defaultValue: '10'
                         }
                     }
                 },
                 '---',
                 {
                     opcode: 'setNum',
                     blockType: BlockType.COMMAND,
                     text: formatMessage({
                         id: 'numberbank.setNum',
                         default: 'set [VAL] to number of[CARD]of[BANK]',
                         description: 'set number by Firebase'
                     }),
                     arguments: {
                         BANK: {
                             type: ArgumentType.STRING,
                             defaultValue: formatMessage({
                                 id: 'numberbank.argments.bank',
                                 default: 'bank'
                             })
                         },
                         CARD: {
                             type: ArgumentType.STRING,
                             defaultValue: formatMessage({
                                 id: 'numberbank.argments.card',
                                 default: 'card'
                             })
                         },
                         VAL: {
                             type: ArgumentType.STRING,
                             fieldName: 'VARIABLE',
                             //                            variableType: Variable.SCALAR_TYPE,            
                             menu: 'valMenu'
                         }
                     }
                 },
                 '---',
                 {
                     opcode: 'getNum',
                     blockType: BlockType.COMMAND,
                     text: formatMessage({
                         id: 'numberbank.getNum',
                         default: 'get number of[CARD]of[BANK]',
                         description: 'get number from Firebase'
                     }),
                     arguments: {
                         BANK: {
                             type: ArgumentType.STRING,
                             defaultValue: formatMessage({
                                 id: 'numberbank.argments.bank',
                                 default: 'bank'
                             })
                         },
                         CARD: {
                             type: ArgumentType.STRING,
                             defaultValue: formatMessage({
                                 id: 'numberbank.argments.card',
                                 default: 'card'
                             })
                         }
                     }
                 },
                 {
                     opcode: 'repNum',
                     text: formatMessage({
                         id: 'numberbank.repNum',
                         default: 'cloud number',
                         description: 'report Number'
                     }),
                     blockType: BlockType.REPORTER
                 },
                 '---',
                 {
                     opcode: 'repCloudNum',
                     blockType: BlockType.REPORTER,
                     text: formatMessage({
                         id: 'numberbank.repCloudNum',
                         default: 'number of[CARD]of[BANK]',
                         description: 'report Cloud number'
                     }),
                     arguments: {
                         BANK: {
                             type: ArgumentType.STRING,
                             defaultValue: formatMessage({
                                 id: 'numberbank.argments.bank',
                                 default: 'bank'
                             })
                         },
                         CARD: {
                             type: ArgumentType.STRING,
                             defaultValue: formatMessage({
                                 id: 'numberbank.argments.card',
                                 default: 'card'
                             })
                         }
                     }
                 },
                 '---',
                 {
                     opcode: 'boolAvl',
                     blockType: BlockType.BOOLEAN,
                     text: formatMessage({
                         id: 'numberbank.boolAvl',
                         default: '[CARD]of[BANK] available?',
                         description: 'report Number'
                     }),
                     arguments: {
                         BANK: {
                             type: ArgumentType.STRING,
                             defaultValue: formatMessage({
                                 id: 'numberbank.argments.bank',
                                 default: 'bank'
                             })
                         },
                         CARD: {
                             type: ArgumentType.STRING,
                             defaultValue: formatMessage({
                                 id: 'numberbank.argments.card',
                                 default: 'card'
                             })
                         }
                     }
                 },
                 '---',
                 {
                     opcode: 'setMaster',
                     blockType: BlockType.COMMAND,
                     text: formatMessage({
                         id: 'numberbank.setMaster',
                         default: 'set Master[KEY]',
                         description: 'readFirebase'
                     }),
                     arguments: {
                         KEY: {
                             type: ArgumentType.STRING,
                             defaultValue: formatMessage({
                                 id: 'numberbank.argments.key',
                                 default: 'key'
                             })
                         }
                     }
 
                 }
             ],
             menus: {
                 valMenu: {
                     acceptReporters: true,
                     items: 'getDynamicMenuItems'
                 }
             }
         };
     }
 
 
     getDynamicMenuItems() {
         return this.runtime.getEditingTarget().getAllVariableNamesInScopeByType(Variable.SCALAR_TYPE);
     }
 
 
 
 }
 
 
 
 
 function sleep(msec) {
     return new Promise(resolve =>
         setTimeout(() => {
             resolve();
         }, msec)
     );
 }
 
 function ioWaiter(msec) {
     return new Promise((resolve, reject) =>
         setTimeout(() => {
             if (inoutFlag) {
                 reject();
             } else {
                 resolve();
             }
         }, msec)
     )
         .catch(() => {
             return ioWaiter(msec);
         });
 }
 
 function reportNumWaiter(msec) {
     return new Promise((resolve, reject) =>
         setTimeout(() => {
             if (inoutFlag) {
                 reject();
             } else {
                 resolve(cloudNum);
             }
         }, msec)
     )
         .catch(() => {
             return reportNumWaiter(msec);
         });
 }
 
 function availableWaiter(msec) {
     return new Promise((resolve, reject) =>
         setTimeout(() => {
             if (inoutFlag) {
                 reject();
             } else {
                 resolve(availableFlag);
             }
         }, msec)
     )
         .catch(() => {
             return availableWaiter(msec);
         });
 }
 
 
 
 const encryptSha256 = (str) => {
     const hash = crypto.createHash('sha256');
     hash.update(str);
     return hash.digest('hex')
 }
 
 
 
 
 // Variables
 let bankDb;
 let cardDb;
 let masterKey = '';
 let bankName = '';
 let bankKey = '';
 let cardKey = '';
 let uniKey = '';
 let cloudNum = '';
 let settingNum = '';
 let masterSha256 = '';
 let bankSha256 = '';
 let cardSha256 = '';
 let uniSha256 = '';
 let inoutFlag = false;
 let availableFlag = false;
 let mkbRequest;
 let mkbUrl;
 const mkbBaseUrl = 'https://us-central1-masterkey-bank.cloudfunctions.net/mkeybank/';
 
 
 const interval = {
     MsPut: 1500,
     MsSet: 1000,
     MsGet: 1000,
     MsRep: 1000,
     MsAvl: 100,
 }
 
 // mkBank格納用
 const cloudConfig_mkb = {
     cloudType: '',
     apiKey: '',
     authDomain: '',
     projectId: '',
     storageBucket: '',
     messagingSenderId: '',
     appId: '',
     measurementId: '',
     Version: '',
     AccessKeyId: '',
     SecretAccessKey: '',
     SessionToken: '',
     Expiration: ''
 };
 
 
 // mKey格納用
 const cloudConfig_mkey = {
     cloudType: '',
     apiKey: '',
     authDomain: '',
     projectId: '',
     storageBucket: '',
     messagingSenderId: '',
     appId: '',
     measurementId: '',
     Version: '',
     AccessKeyId: '',
     SecretAccessKey: '',
     SessionToken: '',
     Expiration: ''
 };
 
 
 
 export {
     ExtensionBlocks as default,
     ExtensionBlocks as blockClass
 };
 