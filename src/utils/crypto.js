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
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText;
    } catch (e) {
        console.error('Decryption error:', e);
        // Return original text if decryption fails (backward compatibility for unencrypted data)
        return ciphertext;
    }
};
