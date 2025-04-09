// server/index.ts
import { generatePrivateKey, generatePublicKey, generateSharedKey } from './dh'
import {
    deriveSymmetricKey,
    encryptMessageChaCha20,
    decryptMessageChaCha20
} from './stream-cipher'
import { createServer } from 'http'
import { Server } from 'socket.io'
import * as fs from 'fs'
import crypto from 'crypto'

// Load Diffie-Hellman parameters from a JSON file

const paramsIndex = process.argv[2]
const params = JSON.parse(fs.readFileSync('./parameters.json', 'utf8'))
    .parameters[paramsIndex]
const p = BigInt(params.p)
const g = BigInt(params.g)

const httpServer = createServer()
const io = new Server(httpServer, { cors: { origin: '*' } })

const serverPrivateKey = generatePrivateKey(256)
const serverPublicKey = generatePublicKey(p, g, serverPrivateKey)

const clientSymmetricKeys = new Map<string, Buffer>() // key: socket.id

io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id)

    socket.emit('dh-params', {
        p: p.toString(),
        g: g.toString(),
        serverPublicKey: serverPublicKey.toString()
    })

    console.log('🔑 Clave pública del servidor:', serverPublicKey.toString())
    console.log('🔑 Clave privada del servidor:', serverPrivateKey.toString())


    socket.on('client-public-key', (clientPubKeyStr: string) => {
        const clientPubKey = BigInt(clientPubKeyStr)
        const sharedKey = generateSharedKey(p, clientPubKey, serverPrivateKey)
        const symKey = deriveSymmetricKey(sharedKey)
        clientSymmetricKeys.set(socket.id, symKey)

        const nonce = crypto.randomBytes(12)
        const { ciphertext, tag } = encryptMessageChaCha20(
            'Hola desde el servidor 👋',
            symKey,
            nonce
        )

        socket.emit('secure-message', {
            ciphertext: ciphertext.toString('base64'),
            nonce: nonce.toString('base64'),
            tag: tag.toString('base64')
        })
    })

    socket.on('secure-reply', ({ ciphertext, nonce, tag, clientPubKey }) => {
        const symKey = clientSymmetricKeys.get(socket.id)

        if (!symKey) {
            console.log('❌ No se encontró la clave para este cliente.')
            return
        }

        const decrypted = decryptMessageChaCha20(
            Buffer.from(ciphertext, 'base64'),
            symKey,
            Buffer.from(nonce, 'base64'),
            Buffer.from(tag, 'base64')
        )

        if (decrypted === null) {
            console.log('❌ Error al descifrar mensaje.')
        } else {
            console.log(`📥 Cliente ${socket.id} dice:`, decrypted)
        }
    })
})
httpServer.listen(3000, () => {
    console.log('🚀 Servidor escuchando en http://localhost:3000')
})
