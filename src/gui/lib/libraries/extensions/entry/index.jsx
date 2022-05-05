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
            default: 'NumberBank1.0',
            description: 'Store Numbers to Cloud.'
        });
    },
    extensionId: 'numberbank',
    extensionURL: 'https://con3office.github.io/xcx-numberbank/dist/numberbank.mjs',
    collaborator: 'con3office',
    iconURL: iconURL,
    insetIconURL: insetIconURL,
    get description() {
        return formatMessage({
            defaultMessage: 'an extension for Xcratch',
            description: 'Store Numbers to Cloud.',
            id: 'numberbank.entry.description'
        });
    },
    featured: true,
    disabled: false,
    bluetoothRequired: false,
    internetConnectionRequired: true,
    helpLink: 'https://con3office.github.io/xcx-numberbank/',
    setFormatMessage: formatter => {
        formatMessage = formatter;
    },
    translationMap: translations
};

export { entry }; // loadable-extension needs this line.
export default entry;
