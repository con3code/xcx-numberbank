/*
//
// NumberBank for Xcratch
// 20260601 - ver2.5(2502)
//
//
*/

import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import translations from './translations.json';
import blockIcon from './numberbank_icon.png';

import Variable from '/usr/local/xcratch/scratch-editor/packages/scratch-vm/src/engine/variable';
//import Variable from '../../engine/variable';

import {initializeApp, getApps, deleteApp} from 'firebase/app';
import * as firestore from 'firebase/firestore';
import {initializeFirestore, doc, getDoc, setDoc, onSnapshot} from 'firebase/firestore';


//
const encoder = new TextEncoder();
const decoderUtf8 = new TextDecoder('utf-8');

const numberbankVersion = 'NumberBank 2.5(2502)';


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
class Scratch3NumberbankBlocks {

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
        this.listeningBankCard_flag = false;
        //onSnapshot
        this.unsubscribe = () => {};

        console.log(numberbankVersion);

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
            if (masterSha256 == '') { resolve(); return; }
            if (args.BANK == '' || args.CARD == '' || args.VAL == '') { resolve(); return; }

            const localBankKey = String(args.BANK);
            const localBankName = args.BANK;
            const localCardKey = String(args.CARD);
            const localSettingNum = args.VAL;

            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
                return;
            }

            computeHashes(localBankKey, localCardKey)
                .then(({bankSha256: localBankSha256, cardSha256: localCardSha256, uniSha256: localUniSha256}) => {
                    if (masterSha256 == '' || masterSha256 == undefined) {
                        console.log("No MasterKey!");
                        resolve();
                        return;
                    }
                    const now = Date.now();
                    const cardDocRef = doc(db, 'card', localUniSha256);
                    const bankDocRef = doc(db, 'bank', localBankSha256);

                    enqueueApiCall(() =>
                        setDoc(cardDocRef, {
                            number: localSettingNum,
                            bank_key: localBankSha256,
                            card_key: localCardSha256,
                            master_key: masterSha256,
                            time_stamp: now
                        })
                        .then(() => setDoc(bankDocRef, {
                            bank_name: localBankName,
                            time_stamp: now
                        }))
                    )
                    .then(() => resolve())
                    .catch(error => {
                        console.error("Error writing document: ", error);
                        reject(error);
                    });
                })
                .catch(error => {
                    console.error("Error: ", error);
                    reject(error);
                });
        }).then(() => new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, interval.MsPut);
        }));

    }


    setNum(args, util) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(); return; }
            if (args.BANK == '' || args.CARD == '') { resolve(); return; }

            const variable = util.target.lookupOrCreateVariable(null, args.VAR);
            const cacheKey = args.BANK + '\x00' + args.CARD;
            const localBankKey = String(args.BANK);
            const localCardKey = String(args.CARD);

            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
                return;
            }

            computeHashes(localBankKey, localCardKey)
                .then(({uniSha256: localUniSha256}) => {
                    if (masterSha256 != '' && masterSha256 != undefined) {
                        enqueueApiCall(() => getDoc(doc(db, 'card', localUniSha256))
                            .then(docSnapshot => {
                                if (docSnapshot.exists()) {
                                    const value = docSnapshot.data().number;
                                    cloudReadCache[cacheKey] = value;
                                    variable.value = value;
                                    resolve();
                                } else {
                                    cloudReadCache[cacheKey] = '';
                                    variable.value = '';
                                    resolve();
                                }
                            })
                            .catch(error => {
                                console.error("Error getting document: ", error);
                                reject();
                            }));
                    } else {
                        console.log("No MasterKey!");
                        resolve();
                    }
                }).catch(error => {
                    console.error("Error: ", error);
                    reject(error);
                });
        }).then(() => new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, interval.MsSet);
        }));

    }


    getNum(args) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(''); return; }
            if (args.BANK == '' || args.CARD == '') { resolve(''); return; }

            cloudNum = '';

            const localBankKey = String(args.BANK);
            const localCardKey = String(args.CARD);

            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
                return;
            }

            computeHashes(localBankKey, localCardKey)
                .then(({uniSha256: localUniSha256}) => {
                    if (masterSha256 != '' && masterSha256 != undefined) {
                        enqueueApiCall(() => getDoc(doc(db, 'card', localUniSha256))
                            .then(docSnapshot => {
                                if (docSnapshot.exists()) {
                                    cloudNum = docSnapshot.data().number;
                                    resolve(cloudNum);
                                } else {
                                    cloudNum = '';
                                    resolve(cloudNum);
                                }
                            })
                            .catch(error => {
                                console.error("Error getting document: ", error);
                                reject(error);
                            }));
                    } else {
                        console.log("No MasterKey!");
                        resolve('');
                    }
                })
                .catch(error => {
                    console.error("Error: ", error);
                    reject(error);
                });
        }).then(ret => new Promise(resolve => {
            setTimeout(() => {
                resolve(ret);
            }, interval.MsGet);
        }));

    }


    repNum(args, util) {
        return cloudNum;
    }


    repCloudNum(args) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(''); return; }
            if (args.BANK == '' || args.CARD == '') { resolve(''); return; }

            const cacheKey = args.BANK + '\x00' + args.CARD;
            const localBankKey = String(args.BANK);
            const localCardKey = String(args.CARD);

            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
                return;
            }

            computeHashes(localBankKey, localCardKey)
                .then(({uniSha256: localUniSha256}) => {
                    if (masterSha256 != '' && masterSha256 != undefined) {
                        enqueueApiCall(() => getDoc(doc(db, 'card', localUniSha256))
                            .then(docSnapshot => {
                                if (docSnapshot.exists()) {
                                    const value = docSnapshot.data().number;
                                    cloudReadCache[cacheKey] = value;
                                    resolve(value);
                                } else {
                                    cloudReadCache[cacheKey] = '';
                                    resolve('');
                                }
                            })
                            .catch(error => {
                                console.error("Error getting document: ", error);
                                reject(error);
                            }));
                    } else {
                        console.log("No MasterKey!");
                        resolve('');
                    }
                })
                .catch(error => {
                    console.error("Error: ", error);
                    reject(error);
                });
        }).then(ret => new Promise(resolve => {
            setTimeout(() => {
                resolve(ret);
            }, interval.MsRep);
        }));

    }


    boolAvl(args, util) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(false); return; }
            if (args.BANK == '' || args.CARD == '') { resolve(false); return; }

            const localBankKey = String(args.BANK);
            const localCardKey = String(args.CARD);

            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
                return;
            }

            computeHashes(localBankKey, localCardKey)
                .then(({uniSha256: localUniSha256}) => {
                    if (masterSha256 != '' && masterSha256 != undefined) {
                        enqueueApiCall(() => getDoc(doc(db, 'card', localUniSha256))
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
                            }));
                    } else {
                        console.log("No MasterKey!");
                        reject('');
                    }
                })
                .catch(error => {
                    console.error("Error: ", error);
                    reject(error);
                });
        }).then(ret => new Promise(resolve => {
            setTimeout(() => {
                resolve(ret);
            }, interval.MsAvl);
        }));

    }


    setMaster(args) {
        return new Promise((resolve, reject) => {
            if (args.KEY == '') { resolve(''); return; }
            if (inoutFlag_setting) { resolve(); return; }

            inoutFlag_setting = true;
            inoutFlag = true;

            masterSha256 = '';
            masterSetted = args.KEY;

            mkbUrl = FBaseUrl + 'mkeybank/?mkey=' + masterSetted;
            mkbRequest = new Request(mkbUrl, { mode: 'cors' });

            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
                return;
            }

            crypto.subtle.digest('SHA-256', encoder.encode(masterSetted))
                .then(masterStr => {
                    masterSha256 = hexString(masterStr);

                    enqueueApiCall(() => fetch(mkbRequest).then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error(`Unexpected response status ${response.status} or content type`);
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
                    }),
                    );

                })
                .catch((error) => {
                        console.log('Error:', error);
                        reject(error);
                });

        })
        .then(() => ioSettingWaiter(1))
        .then(() => ResponseMaster);

    }


    lisningNum(args, util) {
        if (masterSha256 == '') { return false; }
        if (args.BANK == '' || args.CARD == '') { return false; }

        const state = args.LISNING_STATE;

        if(state === Listening.ON) {

            //onSnapshotに登録

            return new Promise((resolve, reject) => {

                const localBankKey = String(args.BANK);
                const localCardKey = String(args.CARD);

                if (!crypto || !crypto.subtle) {
                    reject("crypto.subtle is not supported.");
                    return;
                }

                computeHashes(localBankKey, localCardKey)
                    .then(({bankSha256: localBankSha256, cardSha256: localCardSha256, uniSha256: localUniSha256}) => {
                        Listening.BANK = localBankSha256;
                        Listening.CARD = localCardSha256;
                        Listening.UNI = localUniSha256;

                        if (masterSha256 != '' && masterSha256 != undefined) {

                            this.unsubscribe();
                            Listening.FIRST = true;
                            this.unsubscribe = onSnapshot(doc(db, 'card', localUniSha256), (doc) => {
                                this.listeningState();
                            },
                            (err) => {
                                console.log("onSnapshot Error:", err);
                            });

                            console.log("= Listening ON =");

                            resolve(state);

                        } else {
                            console.log("No MasterKey!");
                            resolve();  // MasterKeyがない場合
                        }

                    }).catch(error => {
                        console.error("Error: ", error);
                        reject(error);
                    });

            });


        } else {

            console.log("= Listening OFF =");

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
    listeningState () {
        const first = Listening.FIRST;
        if (first) {
            Listening.FIRST = false;
            this.listeningBankCard_flag = false;
        } else {
            this.listeningBankCard_flag = true;
            this.snapshotCalled();
        }
    }


    static get Listening () {
        return Listening;
    }


    whenUpdatedCalled(blockId) {
        let callCount = this.whenUpdatedCallCountMap.get(blockId) || 0;

        if (this.listeningBankCard_flag) {
            if(callCount > 0){
                callCount -= 1;
                this.whenUpdatedCallCountMap.set(blockId, callCount);
            }
            this.checkAllWhenUpdatedCalled();
        } else {
            this.whenUpdatedCallCountMap.set(blockId, callCount);
        }

    }


    checkAllWhenUpdatedCalled() {
        const allCalled = Array.from(this.whenUpdatedCallCountMap.values()).every(count => count === 0);

        if (allCalled) {
            this.listeningBankCard_flag = false;
        }
    }


    whenUpdated(args, util) {
        const blockId = util.thread.topBlock;

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
    get LISTENING_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'lisning.off',
                    default: 'off',
                    description: 'Option for the "lisning [STATE]" block'
                }),
                value: Listening.OFF
            },
            {
                name: formatMessage({
                    id: 'lisning.on',
                    default: 'on',
                    description: 'Option for the "lisning [STATE]" block'
                }),
                value: Listening.ON
            }
        ];
    }



    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        setupTranslations();
        return {
            id: Scratch3NumberbankBlocks.EXTENSION_ID,
            name: Scratch3NumberbankBlocks.EXTENSION_NAME,
            extensionURL: Scratch3NumberbankBlocks.extensionURL,
            blockIconURI: blockIcon,
            showStatusButton: false,
            color1: '#78A0B4',
            color2: '#78A0B4',
            blocks: [
                {
                    opcode: 'putNum',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'numberbank.putNum',
                        default: 'put [VAL] to [CARD]of[BANK]',
                        description: 'put value to Firebase'
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
                        default: 'set [VAR] to [CARD]of[BANK]',
                        description: 'set variable by Firebase'
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
                        VAR: {
                            type: ArgumentType.STRING,
                            fieldName: 'VARIABLE',
                            variableType: Variable.SCALAR_TYPE,
                            menu: 'varMenu'
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
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'numberbank.repNum',
                        default: 'cloud value',
                        description: 'report value'
                    })
                },
                '---',
                {
                    opcode: 'repCloudNum',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'numberbank.repCloudNum',
                        default: 'value of [CARD]of[BANK]',
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
                        default: 'turn lisning [CARD]of[BANK] [LISNING_STATE]',
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
                            defaultValue: Listening.ON
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
                varMenu: {
                    acceptReporters: true,
                    items: 'getDynamicMenuItems'
                },
                lisningMenu: {
                    acceptReporters: true,
                    items: this._buildMenu(this.LISTENING_INFO)
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
    .catch(() => ioWaiter(msec));
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
    .catch(() => ioSettingWaiter(msec));
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


function computeHashes(bankKey, cardKey) {
    const uniKey = bankKey.trim().concat(cardKey.trim());
    return crypto.subtle.digest('SHA-256', encoder.encode(bankKey))
        .then(bankBuf => {
            const bankSha256 = hexString(bankBuf);
            return crypto.subtle.digest('SHA-256', encoder.encode(cardKey))
                .then(cardBuf => {
                    const cardSha256 = hexString(cardBuf);
                    return crypto.subtle.digest('SHA-256', encoder.encode(uniKey))
                        .then(uniBuf => ({
                            bankSha256,
                            cardSha256,
                            uniSha256: hexString(uniBuf)
                        }));
                });
        });
}



// Firebase関連
var fbApp;
var db;

// API呼び出し管理キュー
let apiCallQueue = [];
let processing = false;

//onSnapshot対象
const Listening = {
    OFF: 'off',
    ON: 'on',
    BANK: '',
    CARD: '',
    UNI: '',
    FIRST: false
}

// Variables
let masterSetted = '';
let ResponseMaster = '';
let cloudNum = '';
const cloudReadCache = {};
let masterSha256 = '';
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
    return decoderUtf8.decode(data);
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
    Scratch3NumberbankBlocks as default,
    Scratch3NumberbankBlocks as blockClass
};
