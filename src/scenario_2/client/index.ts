// client/index.ts
import { io } from 'socket.io-client'
import crypto from 'crypto'
import readline from 'readline'
import {
    deriveAES192Key,
    encryptAES192CBC,
    decryptAES192CBC
} from '../cryptoUtils'

const ecdh = crypto.createECDH('prime256v1')
ecdh.generateKeys()
const clientPublicKey = ecdh.getPublicKey()

const socket = io('http://localhost:3000')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

let aesKey: Buffer

socket.on('server-public-key', (serverKeyBase64: string) => {
    socket.emit('client-public-key', clientPublicKey.toString('base64'))

    const serverPubKey = Buffer.from(serverKeyBase64, 'base64')
    const sharedSecret = ecdh.computeSecret(serverPubKey)
    aesKey = deriveAES192Key(sharedSecret)
})

socket.on('secure-message', ({ iv, ciphertext }) => {
    const message = decryptAES192CBC(
        Buffer.from(ciphertext, 'base64'),
        aesKey,
        Buffer.from(iv, 'base64')
    )
    console.log('🟩 Servidor:', message)
    promptUserInput()
})

function promptUserInput() {
    rl.question('📤 Escribe un mensaje: ', (input) => {
        const { iv, ciphertext } = encryptAES192CBC(input, aesKey)
        socket.emit('secure-reply', {
            iv: iv.toString('base64'),
            ciphertext: ciphertext.toString('base64')
        })
        promptUserInput()
    })
}
