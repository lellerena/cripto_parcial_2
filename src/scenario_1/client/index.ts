// client/index.ts
import { io } from 'socket.io-client'
import {
    generatePrivateKey,
    generatePublicKey,
    generateSharedKey
} from '../server/dh'
import {
    deriveSymmetricKey,
    encryptMessageChaCha20,
    decryptMessageChaCha20
} from '../server/stream-cipher'
import crypto from 'crypto'
import readline from 'readline'

const socket = io('http://localhost:3000')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const clientPrivateKey = generatePrivateKey(256)
let clientPublicKey: bigint
let symKey: Buffer
let serverPubKeyBig: bigint

socket.on('dh-params', ({ p, g, serverPublicKey }) => {
    const pBig = BigInt(p)
    const gBig = BigInt(g)
    serverPubKeyBig = BigInt(serverPublicKey)

    clientPublicKey = generatePublicKey(pBig, gBig, clientPrivateKey)
    socket.emit('client-public-key', clientPublicKey.toString())

    const sharedKey = generateSharedKey(pBig, serverPubKeyBig, clientPrivateKey)
    symKey = deriveSymmetricKey(sharedKey)

    console.log('🔑 Clave pública del cliente:', clientPublicKey.toString())
    console.log('🔑 Clave privada del cliente:', clientPrivateKey.toString())
    console.log('✅ Intercambio de clave completo. Puedes escribir mensajes:')

    startInputLoop()
})

socket.on('secure-message', ({ ciphertext, nonce, tag }) => {
    const decrypted = decryptMessageChaCha20(
        Buffer.from(ciphertext, 'base64'),
        symKey,
        Buffer.from(nonce, 'base64'),
        Buffer.from(tag, 'base64')
    )

    console.log(`🟩 Servidor: ${decrypted}`)
})

function startInputLoop() {
    rl.on('line', (input) => {
        if (!symKey) {
            console.log('❌ Aún no se ha establecido una clave.')
            return
        }

        const nonce = crypto.randomBytes(12)
        const { ciphertext, tag } = encryptMessageChaCha20(input, symKey, nonce)

        socket.emit('secure-reply', {
            ciphertext: ciphertext.toString('base64'),
            nonce: nonce.toString('base64'),
            tag: tag.toString('base64'),
            clientPubKey: clientPublicKey.toString()
        })
    })
}
