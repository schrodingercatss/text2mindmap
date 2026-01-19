import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-dev-key-do-not-use-in-prod';

export const encryptData = (text) => {
    if (!text) return '';
    try {
        return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    } catch (e) {
        console.error('Encryption error:', e);
        return text;
    }
};

export const decryptData = (ciphertext) => {
    if (!ciphertext) return '';
    // Check if it's a legacy plain text (doesn't start with Salted__)
    if (!ciphertext.startsWith('U2FsdGVkX1')) {
        return ciphertext;
    }
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        // If decryption results in empty string (e.g. wrong key), return original
        return originalText || ciphertext;
    } catch (e) {
        console.error('Decryption error:', e);
        // Return original text if decryption fails
        return ciphertext;
    }
};
