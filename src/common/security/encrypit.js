import crypto from "node:crypto"
import { ENCRYPTION_KEYS} from "../../../config/config.service.js";
const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEYS)
const IV_LENGTH = 16; 
console.log(ENCRYPTION_KEY.length);

export function Encrypt(plainText) {
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);  

    let encrypted = cipher.update(plainText, 'utf8', 'hex');

    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}


export function decrypt(text) {

    const [ivHex, encryptedText] = text.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');    

    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY , iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');

    decrypted += decipher.final('utf8');

    return decrypted;
}