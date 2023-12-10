// NumberBank for Xcratch
// 20231210 - ver2.0(2001)
//

import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import translations from './translations.json';
import blockIcon from './numberbank_icon.png';

import Variable from '../../engine/variable';

import { initializeApp, getApps, deleteApp } from 'firebase/app';
import * as firestore from 'firebase/firestore';
import { initializeFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';


//
const encoder = new TextEncoder();
const deoder_utf8 = new TextDecoder('utf-8');


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
let extensionURL = 'https://con3code.github.io/xcx-numberbank/dist/numberbank.mjs';



/**
 * Scratch 3.0 blocks for example of Xcratch.
 */
class Scratch3Numberbank {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME() {
        return formatMessage({
            id: 'numberbank.name',
            default: 'NumberBank',
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

        this.firstInstall = true;

        //updated
        this.whenUpdatedCallCountMap = new Map();
        this.LisningBankCard_flag = false;
        //onSnapshot
        this.unsubscribe = () => {};

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        }
    }


    /**
     * Create data for a menu in scratch-blocks format, consisting of an array
     * of objects with text and value properties. The text is a translated
     * string, and the value is one-indexed.
     * @param {object[]} info - An array of info objects each having a name
     *   property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu (info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = entry.value || String(index + 1);
            return obj;
        });
    }


    putNum(args) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(); }
            if (args.BANK == '' || args.CARD == '' || args.NUM == '') { resolve(); }

            bankKey = new String(args.BANK);
            bankName = args.BANK;
            cardKey = new String(args.CARD);

            uniKey = bankKey.trim().concat(cardKey.trim());

            if (args.NUM != '' && args.NUM != undefined) {
                settingNum = args.NUM;
            }

            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
            }

            if (bankKey != '' && bankKey != undefined) {
                crypto.subtle.digest('SHA-256', encoder.encode(bankKey))
                    .then(bankStr => {
                        bankSha256 = hexString(bankStr);

                        return crypto.subtle.digest('SHA-256', encoder.encode(cardKey));
                    })
                    .then(cardStr => {
                        cardSha256 = hexString(cardStr);

                        return crypto.subtle.digest('SHA-256', encoder.encode(uniKey));
                    })
                    .then(uniStr => {
                        uniSha256 = hexString(uniStr);

                        return sleep(1);
                    })
                    .then(() => {
                        if (masterSha256 != '' && masterSha256 != undefined) {
                            const now = Date.now();
                            const cardDocRef = doc(db, 'card', uniSha256);
                            const bankDocRef = doc(db, 'bank', bankSha256);

                            enqueueApiCall(() => {
                                return setDoc(cardDocRef, {
                                    number: settingNum,
                                    bank_key: bankSha256,
                                    card_key: cardSha256,
                                    master_key: masterSha256,
                                    time_stamp: now
                                })
                                .then(() => {
                                    return setDoc(bankDocRef, {
                                        bank_name: bankName,
                                        time_stamp: now
                                    });
                                })
                                .catch(error => {
                                    console.error("Error writing document: ", error);
                                    reject();
                                });
                            });
                            
                            resolve();

                        } else {
                            console.log("No MasterKey!");
                            resolve();  // MasterKeyがない場合
                        }
                    }).catch(error => {
                        console.error("Error: ", error);
                        reject(error);
                    });
            } else {
                resolve();
            }
        }).then(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, interval.MsPut);
            });
        });

    }


    setNum(args, util) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(); }
            if (args.BANK == '' || args.CARD == '') { resolve(); }

            const variable = util.target.lookupOrCreateVariable(null, args.VAL);

            bankKey = new String(args.BANK);
            bankName = args.BANK;
            cardKey = new String(args.CARD);

            uniKey = bankKey.trim().concat(cardKey.trim());

            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
            }

            if (bankKey != '' && bankKey != undefined) {
                crypto.subtle.digest('SHA-256', encoder.encode(bankKey))
                    .then(bankStr => {
                        bankSha256 = hexString(bankStr);

                        return crypto.subtle.digest('SHA-256', encoder.encode(cardKey));
                    })
                    .then(cardStr => {
                        cardSha256 = hexString(cardStr);

                        return crypto.subtle.digest('SHA-256', encoder.encode(uniKey));
                    })
                    .then(uniStr => {
                        uniSha256 = hexString(uniStr);

                        return sleep(1);
                    })
                    .then(() => {
                        if (masterSha256 != '' && masterSha256 != undefined) {
                            enqueueApiCall(() => {
                                return getDoc(doc(db, 'card', uniSha256))
                                    .then(docSnapshot => {
                                        if (docSnapshot.exists()) {
                                            let data = docSnapshot.data();
                                            variable.value = data.number;
                                            resolve();
                                        } else {
                                            variable.value = '';
                                            resolve();
                                        }
                                    })
                                    .catch(error => {
                                        console.error("Error getting document: ", error);
                                        reject();
                                    })
                            });
                            
                            resolve();

                        } else {
                            console.log("No MasterKey!");
                            resolve();  // MasterKeyがない場合
                        }
                    }).catch(error => {
                        console.error("Error: ", error);
                        reject(error);
                    });
            } else {
                resolve();
            }
        }).then(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, interval.MsSet);
            });
        });
        
    }


    getNum(args) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(''); }
            if (args.BANK == '' || args.CARD == '') { resolve(''); }

            cloudNum = '';

            bankKey = new String(args.BANK);
            bankName = args.BANK;
            cardKey = new String(args.CARD);

            uniKey = bankKey.trim().concat(cardKey.trim());

            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
            }

            if (bankKey != '' && bankKey != undefined) {
                crypto.subtle.digest('SHA-256', encoder.encode(bankKey))
                    .then(bankStr => {
                        bankSha256 = hexString(bankStr);

                        return crypto.subtle.digest('SHA-256', encoder.encode(cardKey));
                    })
                    .then(cardStr => {
                        cardSha256 = hexString(cardStr);

                        return crypto.subtle.digest('SHA-256', encoder.encode(uniKey));
                    })
                    .then(uniStr => {
                        uniSha256 = hexString(uniStr);

                        return sleep(1);
                    })
                    .then(() => {
                        if (masterSha256 != '' && masterSha256 != undefined) {
                            enqueueApiCall(() => {
                                return getDoc(doc(db, 'card', uniSha256))
                                    .then(docSnapshot => {
                                        if (docSnapshot.exists()) {
                                            let data = docSnapshot.data();
                                            cloudNum = data.number;
                                            resolve(cloudNum);
                                        } else {
                                            cloudNum = '';
                                            resolve(cloudNum);
                                        }
                                    })
                                    .catch(error => {
                                        console.error("Error getting document: ", error);
                                        reject(error);
                                    })
                            });

                        } else {
                            console.log("No MasterKey!");
                            resolve('');  // MasterKeyがない場合
                        }
                    }).catch(error => {
                        console.error("Error: ", error);
                        reject(error);
                    });
            } else {
                resolve('');
            }
        }).then((ret) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ret);
                }, interval.MsGet);
            });
        });

    }


    repNum(args, util) {
        return cloudNum;
    }


    repCloudNum(args) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(''); }
            if (args.BANK == '' || args.CARD == '') { resolve(''); }
    
            let rep_cloudNum = '';
    
            bankKey = new String(args.BANK);
            bankName = args.BANK;
            cardKey = new String(args.CARD);
    
            uniKey = bankKey.trim().concat(cardKey.trim());
    
            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
            }
    
            if (bankKey != '' && bankKey != undefined) {
                crypto.subtle.digest('SHA-256', encoder.encode(bankKey))
                    .then(bankStr => {
                        bankSha256 = hexString(bankStr);
    
                        return crypto.subtle.digest('SHA-256', encoder.encode(cardKey));
                    })
                    .then(cardStr => {
                        cardSha256 = hexString(cardStr);
    
                        return crypto.subtle.digest('SHA-256', encoder.encode(uniKey));
                    })
                    .then(uniStr => {
                        uniSha256 = hexString(uniStr);
    
                        return sleep(1);
                    })
                    .then(() => {
                        if (masterSha256 != '' && masterSha256 != undefined) {
                            enqueueApiCall(() => {
                                return getDoc(doc(db, 'card', uniSha256))
                                    .then(docSnapshot => {
                                        if (docSnapshot.exists()) {
                                            let data = docSnapshot.data();
                                            rep_cloudNum = data.number;
                                            resolve(rep_cloudNum);
                                        } else {
                                            rep_cloudNum = '';
                                            resolve(rep_cloudNum);
                                        }
                                    })
                                    .catch(error => {
                                        console.error("Error getting document: ", error);
                                        reject(error);
                                    })
                            });

                        } else {
                            console.log("No MasterKey!");
                            resolve('');  // MasterKeyがない場合
                        }
                    })
                    .catch(error => {
                        console.error("Error: ", error);
                        reject(error);
                    });
            } else {
                resolve('');  // bankKeyがない場合
            }
        }).then((ret) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ret);
                }, interval.MsRep);
            });
        });

    }


    boolAvl(args, util) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(''); }
            if (args.BANK == '' || args.CARD == '') { resolve(false); }
    
            bankKey = new String(args.BANK);
            bankName = args.BANK;
            cardKey = new String(args.CARD);
    
            uniKey = bankKey.trim().concat(cardKey.trim());
    
            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
            }
    
            if (bankKey != '' && bankKey != undefined) {
                crypto.subtle.digest('SHA-256', encoder.encode(uniKey))
                .then(uniStr => {
                    uniSha256 = hexString(uniStr);
    
                    return sleep(1);
                })
                .then(() => {
                    if (masterSha256 != '' && masterSha256 != undefined) {
                        enqueueApiCall(() => {
                            return getDoc(doc(db, 'card', uniSha256))
                                .then(ckey => {
                                    if (ckey.exists()) {
                                        resolve(true);
                                    } else {
                                        resolve(false);
                                    }
                                })
                                .catch(error => {
                                    console.log("Error checking document:", error);
                                    reject(error);
                                })
                        });
                        
                    } else {
                        console.log("No MasterKey!");
                        reject('');  // MasterKeyがない場合
                    }
                }).catch(error => {
                    console.error("Error: ", error);
                    reject(error);
                });
            } else {
                resolve('');
            }
        }).then((ret) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ret);
                }, interval.MsAvl);
            });
        });

    }


    setMaster(args) {
        return new Promise((resolve, reject) => {
            if (args.KEY == '') { resolve(''); }
            if (inoutFlag_setting) { resolve(); }

            inoutFlag_setting = true;
            inoutFlag = true;
    
            masterSha256 = '';
            masterSetted = args.KEY;

            mkbUrl = FBaseUrl + 'mkeybank/?mkey=' + masterSetted;
            mkbRequest = new Request(mkbUrl, { mode: 'cors' });
    
            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
            }
    
            crypto.subtle.digest('SHA-256', encoder.encode(masterSetted))
                .then(masterStr => {
                    masterSha256 = hexString(masterStr);
    
                    enqueueApiCall(() => fetch(mkbRequest).then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error('Unexpected responce status ${response.status} or content type');
                        }
                        
                    }).then((resBody) => {
        
                        cloudConfig_mkey.masterKey = resBody.masterKey;
                        cloudConfig_mkey.cloudType = resBody.cloudType;
                        cloudConfig_mkey.apiKey = resBody.apiKey;
                        cloudConfig_mkey.authDomain = resBody.authDomain;
                        cloudConfig_mkey.databaseURL = resBody.databaseURL;
                        cloudConfig_mkey.projectId = resBody.projectId;
                        cloudConfig_mkey.storageBucket = resBody.storageBucket;
                        cloudConfig_mkey.messagingSenderId = resBody.messagingSenderId;
                        cloudConfig_mkey.appId = resBody.appId;
                        cloudConfig_mkey.measurementId = resBody.measurementId;
                        cloudConfig_mkey.cccCheck = resBody.cccCheck;
                        interval.MsPut = resBody.intervalMsPut;
                        interval.MsSet = resBody.intervalMsSet;
                        interval.MsGet = resBody.intervalMsGet;
                        interval.MsRep = resBody.intervalMsRep;
                        interval.MsAvl = resBody.intervalMsAvl;
        
        
                        inoutFlag = false;
                        crypt_decode(cloudConfig_mkey, firebaseConfig);
                        return ioWaiter(1);
        
                    }).then(() => {
                        inoutFlag = true;
        
                        // Initialize Firebase
                        try {
                            if(!getApps().length){ //V9
                            //if (!firebase.apps.length) {
                                        
                                fbApp = initializeApp(firebaseConfig, masterSetted); //V9
                                //db = initializeFirestore(fbApp, {localCache: PersistentLocalCache});
                                db = initializeFirestore(fbApp, {});

                                inoutFlag_setting = false;
                                inoutFlag = false;
            
                            } else {
            
                                deleteApp(fbApp)
                                .then(() => {

                                    fbApp = initializeApp(firebaseConfig, masterSetted); //V9
                                    //db = initializeFirestore(fbApp, {localCache: PersistentLocalCache}); 
                                    db = initializeFirestore(fbApp, {});

                                    inoutFlag_setting = false;
                                })
                                .catch((error) => {
                                    console.log('Error deleting fbApp:', error);
                                    inoutFlag_setting = false;
                                })

                                inoutFlag = false;

                            }

                        } catch (error) {
                            console.log('Error initializing or deleting fbApp:', error);
                            inoutFlag = false;
                            inoutFlag_setting = false;
                            reject();
                        }
            
                        return sleep(1);
        
                    }).then(() => {
                        ResponseMaster = masterSetted;
                        console.log("= MasterKey:", masterSetted);
                        console.log('= Interval:', interval);
                        console.log("= MasterKey Accepted =");

                        resolve(ResponseMaster);
        
                    })
                    .catch((error) => {
                        ResponseMaster = 'No masterkey';  // MasterKeyがマッチしない場合
                        console.log("= No such MasterKey =");
                        inoutFlag_setting = false;
                        resolve(ResponseMaster);
                    }));

                })
                .catch((error) => {
                        console.log('Erorr:', error);
                        reject(error);
                });

        })
        .then(() => {
            return ioSettingWaiter(1);
        })
        .then(() => {
            return ResponseMaster;
        });
        
    }


    lisningNum(args, util) {
        if (masterSha256 == '') { return false; }
        if (args.BANK == '' || args.CARD == '') { return false; }

        const state = args.LISNING_STATE;

        if(state === Lisning.ON) {

            //onSnapshotに登録

            return new Promise((resolve, reject) => {
        
                bankKey = bankName = new String(args.BANK);
                cardKey = new String(args.CARD);
    
                uniKey = bankKey.trim().concat(cardKey.trim());
    
                if (!crypto || !crypto.subtle) {
                    reject("crypto.subtle is not supported.");
                }
    
                if (bankKey != '' && bankKey != undefined) {
                    crypto.subtle.digest('SHA-256', encoder.encode(bankKey))
                        .then(bankStr => {
                            bankSha256 = Lisning.BANK = hexString(bankStr);
    
                            return crypto.subtle.digest('SHA-256', encoder.encode(cardKey));
                        })
                        .then(cardStr => {
                            cardSha256 = Lisning.CARD = hexString(cardStr);
    
                            return crypto.subtle.digest('SHA-256', encoder.encode(uniKey));
                        })
                        .then(uniStr => {
                            uniSha256 = Lisning.UNI = hexString(uniStr);

                            if (masterSha256 != '' && masterSha256 != undefined) {
    
                                this.unsubscribe();
                                Lisning.FIRST = true;
                                this.unsubscribe = onSnapshot(doc(db, 'card', uniSha256), (doc) => {
                                    this.lisningState();
                                    //console.log("Current data: ", doc.data());
                                },
                                (err) => {
                                    console.log("onSnapshot Error:",err);
                                
                                });

                                console.log("= Lisning ON =");

                                resolve(state);
                                                                    
                            } else {
                                console.log("No MasterKey!");
                                resolve();  // MasterKeyがない場合
                            }
    
                        }).catch(error => {
                            console.error("Error: ", error);
                            reject(error);
                        });

                } else {
                    resolve(state);
                }
            });


        } else {

            console.log("= Lisning OFF =");

            //onSnapshotを解除
            this.unsubscribe();
         
        }

        return state;
    }


    snapshotCalled() {

        for (let [blockId, callCount] of this.whenUpdatedCallCountMap.entries()) {
            callCount += 1;
            this.whenUpdatedCallCountMap.set(blockId, callCount);
        }

    }


    //onSnapshot設定時にトリガーしてしまう初回を回避
    lisningState () {
        const first = Lisning.FIRST;
        if (first) {
            Lisning.FIRST = false;
            this.LisningBankCard_flag = false;
        } else {
            this.LisningBankCard_flag = true;
            this.snapshotCalled();
        }
    }
        

    static get Lisning () {
        return Lisning;
    }
    

    whenUpdatedCalled(blockId) {
        //console.log('Called:', instanceId);
        let callCount = this.whenUpdatedCallCountMap.get(blockId) || 0;

        if (this.LisningBankCard_flag) {
            if(callCount > 0){
                callCount -= 1;
                this.whenUpdatedCallCountMap.set(blockId, callCount);
            } 
            //console.log('checkCalled', Array.from(this.whenUpdatedCallCountMap));
            this.checkAllWhenUpdatedCalled();
        } else {
            this.whenUpdatedCallCountMap.set(blockId, callCount);
        }

    }

    
    checkAllWhenUpdatedCalled() {
        const allCalled = Array.from(this.whenUpdatedCallCountMap.values()).every(count => count === 0);
        //console.log('checkCalled', Array.from(this.whenUpdatedCallCountMap));

        if (allCalled) {
            this.LisningBankCard_flag = false;
        } 
    }


    whenUpdated(args, util) {
        const blockId = util.thread.topBlock;
        //console.log('util:', util.thread.topBlock);

        let callCount = this.whenUpdatedCallCountMap.get(blockId) || 0;

        this.whenUpdatedCalled(blockId);

        return callCount > 0;
    }


    /**
     * An array of info on video state options for the "lisning" block.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the state menu
     * @param {string} value - the serializable value stored in the block
     */
    get LISNING_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'lisning.off',
                    default: 'off',
                    description: 'Option for the "lisning [STATE]" block'
                }),
                value: Lisning.OFF
            },
            {
                name: formatMessage({
                    id: 'lisning.on',
                    default: 'on',
                    description: 'Option for the "lisning [STATE]" block'
                }),
                value: Lisning.ON
            }
        ];
    }



    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        setupTranslations();
        return {
            id: Scratch3Numberbank.EXTENSION_ID,
            name: Scratch3Numberbank.EXTENSION_NAME,
            extensionURL: Scratch3Numberbank.extensionURL,
            blockIconURI: blockIcon,
            showStatusButton: false,
            color1: '#78A0B4',
            color2: '#78A0B4',
            blocks: [
                {
                    opcode: 'putNum',
                    text: formatMessage({
                        id: 'numberbank.putNum',
                        default: 'put[VAL]to[CARD]of[BANK]',
                        description: 'put value to Firebase'
                    }),
                    blockType: BlockType.COMMAND,
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
                        default: 'set [VAL] to [CARD]of[BANK]',
                        description: 'set value by Firebase'
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
                            variableType: Variable.SCALAR_TYPE,
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
                        default: 'get [CARD]of[BANK]',
                        description: 'get value from Firebase'
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
                        default: 'cloud value',
                        description: 'report value'
                    }),
                    blockType: BlockType.REPORTER
                },
                '---',
                {
                    opcode: 'repCloudNum',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'numberbank.repCloudNum',
                        default: 'value of[CARD]of[BANK]',
                        description: 'report cloud value'
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
                        description: 'report value'
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
                        description: 'initFirebase'
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

                },
                '---',
                {
                    opcode: 'lisningNum',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'numberbank.lisningNum',
                        default: ' turn lisning [CARD]of[BANK][LISNING_STATE]',
                        description: 'lisning value by Firebase'
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
                        LISNING_STATE: {
                            type: ArgumentType.STRING,
                            menu: 'lisningMenu',
                            defaultValue: Lisning.ON
                        }
                    }
                },
                {
                    opcode: 'whenUpdated',
                    blockType: BlockType.HAT,
                    text: formatMessage({
                        id: 'numberbank.whenUpdated',
                        default: 'when updated',
                        description: 'whenFirebaseUpdated'
                    }),
                },
            ],
            menus: {
                valMenu: {
                    acceptReporters: true,
                    items: 'getDynamicMenuItems'
                },
                lisningMenu: {
                    acceptReporters: true,
                    items: this._buildMenu(this.LISNING_INFO)
                }
            }
        };
    }


    getDynamicMenuItems() {
        return this.runtime.getEditingTarget().getAllVariableNamesInScopeByType(Variable.SCALAR_TYPE);
    }


}


//
function processQueue() {
    if (processing || apiCallQueue.length === 0) {
      return;
    }
    processing = true;
    const apiCall = apiCallQueue.shift();
  
    apiCall().then(() => {
      processing = false;
      processQueue();
    }).catch(error => {
      console.error(error);
      processing = false;
      processQueue();
    });
  }
  
  
  //
  function enqueueApiCall(apiCall) {
      return new Promise((resolve, reject) => {
        apiCallQueue.push(() => apiCall().then(resolve).catch(reject));
        processQueue();
      });
  }
  
  
  function resetQueue() {
      apiCallQueue = [];
      processing = false;
    }


//
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


function ioSettingWaiter(msec) {
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            if (inoutFlag_setting) {
                reject();
            } else {
                resolve();
            }
        }, msec)
    )
        .catch(() => {
            return ioSettingWaiter(msec);
        });
}


//
function hexString(textStr) {
    const byteArray = new Uint8Array(textStr);
    const hexCodes = [...byteArray].map(value => {
        const hexCode = value.toString(16);
        const paddedHexCode = hexCode.padStart(2, '0');
        return paddedHexCode;
    });
    return hexCodes.join('');
}



// Firebase関連
var fbApp;
var db;

// API呼び出し管理キュー
let apiCallQueue = [];
let processing = false;

//onSnapshot対象
const Lisning = {
    OFF: 'off',
    ON: 'on',
    BANK:'',
    CARD:'',
    UNI:'',
    FIRST:false
}

// Variables
let masterSetted = '';
let ResponseMaster = '';
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
let inoutFlag_setting = false;
let mkbRequest;
let mkbUrl;
const FBaseUrl = 'https://us-central1-masterkey-bank.cloudfunctions.net/';


const interval = {
    MsPut: 1500,
    MsSet: 1000,
    MsGet: 1000,
    MsRep: 1000,
    MsAvl: 100,
}

const firebaseConfig = {
    masterKey: '',
    cloudType: '',
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

// 格納用予備
const cloudConfig_mkb = {
    masterKey: '',
    cloudType: '',
    apiKey: '',
    authDomain: '',
    databaseURL: "",
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
    Version: '',
    AccessKeyId: '',
    SecretAccessKey: '',
    SessionToken: '',
    Expiration: '',
    cccCheck: '',
};


// mKey格納用
const cloudConfig_mkey = {
    masterKey: '',
    cloudType: '',
    apiKey: '',
    authDomain: '',
    databaseURL: "",
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
    Version: '',
    AccessKeyId: '',
    SecretAccessKey: '',
    SessionToken: '',
    Expiration: '',
    cccCheck: '',
};



// データ暗号化の下処理
/////////////////////////////////
/////////////////////////////////

function en_org(data) {
    return encoder.encode(data);
}

function en_store(data) {
    return firestore.Bytes.fromUint8Array(new Uint8Array(data)).toBase64();
}

function de_get(data) {
    return firestore.Bytes.fromBase64String(data).toUint8Array();
}

function de_disp(data) {
    return deoder_utf8.decode(data);
}

function en_crt(data) {
    return firestore.Bytes.fromUint8Array(data).toBase64();
}

function de_crt(data) {
    return firestore.Bytes.fromBase64String(data).toUint8Array();
}

////////////////////////////////
///////////////////////////////


function crypt_decode(cryptedConfigData, decodedConfigData) {

    decodedConfigData.cccCheck = cryptedConfigData.cccCheck;
    const cccCheck = de_crt(cryptedConfigData.cccCheck);

    const masterStr = crypto.subtle.digest('SHA-256', encoder.encode(masterSetted));
    const ckeyPromise = masterStr.then(masterStr => crypto.subtle.importKey('raw', masterStr, 'AES-CTR', false, ['encrypt', 'decrypt']));

    const propertiesToDecrypt = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'];

    const decryptPromises = propertiesToDecrypt.map(property => {
        return ckeyPromise.then(ckey => {
            const cryptedData = de_get(cryptedConfigData[property]);
            return crypto.subtle.decrypt({ name: 'AES-CTR', counter: cccCheck, length: 64 }, ckey, cryptedData);
        }).then(decodedData => {
            decodedConfigData[property] = de_disp(decodedData);
        }).catch(error => {
            console.error(`Error decrypting ${property}:`, error);
        });
    });

    return Promise.all(decryptPromises);
}


export {
    Scratch3Numberbank as default,
    Scratch3Numberbank as blockClass
};
