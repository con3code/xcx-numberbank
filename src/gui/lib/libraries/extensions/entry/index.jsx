/**
 * This is an extension for Xcratch.
 */

import iconURL from './numberbank_entry.png';
import insetIconURL from './numberbank_inset.svg';
import translations from './translations.json';

/**
 * Formatter to translate the messages in this extension.
 * This will be replaced which is used in the React component.
 * @param {object} messageData - data for format-message
 * @returns {string} - translated message for the current locale
 */
let formatMessage = messageData => messageData.defaultMessage;

const entry = {
    get name() {
        return formatMessage({
            id: 'numberbank.entry.name',
            default: 'NumberBank 2.0',
            description: 'name of the extension'
        });
    },
    extensionId: 'numberbank',
    extensionURL: 'https://con3code.github.io/xcx-numberbank/dist/numberbank.mjs',
    collaborator: 'con3office',
    iconURL: iconURL,
    insetIconURL: insetIconURL,
    get description() {
        return formatMessage({
            defaultMessage: 'Store value to cloud.',
            description: 'description of the extension',
            id: 'numberbank.entry.description'
        });
    },
    featured: true,
    disabled: false,
    bluetoothRequired: false,
    internetConnectionRequired: true,
    helpLink: 'https://con3.com/numberbank/',
    setFormatMessage: formatter => {
        formatMessage = formatter;
    },
    translationMap: translations
};

export { entry }; // loadable-extension needs this line.
export default entry;
