// server/index.ts
import { Server } from 'socket.io'
import http from 'http'
import crypto from 'crypto'
import {
    deriveAES192Key,
    encryptAES192CBC,
    decryptAES192CBC
} from '../cryptoUtils'

const server = http.createServer()
const io = new Server(server)

const ecdh = crypto.createECDH('prime256v1')
ecdh.generateKeys()
const publicKey = ecdh.getPublicKey()

io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado')

    socket.emit('server-public-key', publicKey.toString('base64'))

    socket.on('client-public-key', (clientPubKeyBase64: string) => {
        const clientKey = Buffer.from(clientPubKeyBase64, 'base64')
        const sharedSecret = ecdh.computeSecret(clientKey)
        const aesKey = deriveAES192Key(sharedSecret)

        const { iv, ciphertext } = encryptAES192CBC(
            'Bienvenido al servidor seguro 🔐',
            aesKey
        )
        socket.emit('secure-message', {
            iv: iv.toString('base64'),
            ciphertext: ciphertext.toString('base64')
        })

        socket.on('secure-reply', ({ iv, ciphertext }) => {
            const message = decryptAES192CBC(
                Buffer.from(ciphertext, 'base64'),
                aesKey,
                Buffer.from(iv, 'base64')
            )

            console.log('📩 Cliente:', message)

            // Respuesta automática del servidor
            const autoResponse = `Servidor recibió: "${message}"`
            const { iv: responseIv, ciphertext: responseCipher } =
                encryptAES192CBC(autoResponse, aesKey)

            socket.emit('secure-message', {
                iv: responseIv.toString('base64'),
                ciphertext: responseCipher.toString('base64')
            })
        })
    })
})

server.listen(3000, () => {
    console.log('🟢 Servidor en puerto 3000')
})
