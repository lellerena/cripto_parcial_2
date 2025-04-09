import { generateRSAKeys, encryptRSA, decryptRSA } from './rsaComm'

const { publicKey, privateKey } = generateRSAKeys()

const mensaje = 'Hola, soy RSA'
const cifrado = encryptRSA(mensaje, publicKey)
const descifrado = decryptRSA(cifrado, privateKey)

console.log('🔐 Enviado:', mensaje)
console.log('🔒 Cifrado (base64):', cifrado.toString('base64'))
console.log('🔓 Descifrado:', descifrado)

import {
    generateElGamalKeys,
    encryptElGamal,
    decryptElGamal
} from './elgamalComm'

const receiver = generateElGamalKeys()

const mensaje2 = 'Hola desde ElGamal'
const { ciphertext, iv, ephemeralPublicKey } = encryptElGamal(
    mensaje2,
    receiver.publicKey
)
const descifrado2 = decryptElGamal(
    ciphertext,
    iv,
    ephemeralPublicKey,
    receiver.privateKey
)

console.log('🔐 Enviado:', mensaje2)
console.log('🔒 Cifrado (base64):', ciphertext)
console.log('🔓 Descifrado:', descifrado2)
