import { io } from 'socket.io-client'
import {
    encryptMessageChaCha20,
    decryptMessageChaCha20
} from '../../scenario_1/server/stream-cipher'
import {
    encryptAES192CBC,
    decryptAES192CBC
} from '../../scenario_2/cryptoUtils'
import { encryptRSA, decryptRSA, generateRSAKeys } from '../rsaComm'
import {
    encryptElGamal,
    decryptElGamal,
    generateElGamalKeys
} from '../elgamalComm'
import crypto from 'crypto'

const socket = io('http://localhost:3000')

function measureTime<T>(fn: () => T): { result: T; time: number } {
    const start = process.hrtime.bigint()
    const result = fn()
    const end = process.hrtime.bigint()
    const time = Number(end - start) / 1e6 // ms
    return { result, time }
}

async function runBenchmark() {
    const message = 'Este es un mensaje de prueba secreto muy secreto.'
    const iterations = 100

    const results = {
        ChaCha20: { enc: 0, dec: 0, size: 0 },
        AES192: { enc: 0, dec: 0, size: 0 },
        RSA: { enc: 0, dec: 0, size: 0 },
        ElGamal: { enc: 0, dec: 0, size: 0 }
    }

    // === ChaCha20 ===
    for (let i = 0; i < iterations; i++) {
        const key = crypto.randomBytes(32)
        const nonce = crypto.randomBytes(12)

        const { result: encrypted, time: encTime } = measureTime(() =>
            encryptMessageChaCha20(message, key, nonce)
        )
        const { time: decTime } = measureTime(() =>
            decryptMessageChaCha20(
                encrypted.ciphertext,
                key,
                nonce,
                encrypted.tag
            )
        )
        results.ChaCha20.enc += encTime
        results.ChaCha20.dec += decTime
        results.ChaCha20.size +=
            encrypted.ciphertext.length + encrypted.tag.length
    }

    // === AES-192 CBC ===
    for (let i = 0; i < iterations; i++) {
        const key = crypto.randomBytes(24)
        const {
            result: { ciphertext, iv },
            time: encTime
        } = measureTime(() => encryptAES192CBC(message, key))
        const { time: decTime } = measureTime(() =>
            decryptAES192CBC(ciphertext, key, iv)
        )
        results.AES192.enc += encTime
        results.AES192.dec += decTime
        results.AES192.size += ciphertext.length + iv.length
    }

    // === RSA OAEP ===
    const { publicKey, privateKey } = generateRSAKeys()
    for (let i = 0; i < iterations; i++) {
        const { result: ciphertext, time: encTime } = measureTime(() =>
            encryptRSA(message, publicKey)
        )
        const { time: decTime } = measureTime(() =>
            decryptRSA(ciphertext, privateKey)
        )
        results.RSA.enc += encTime
        results.RSA.dec += decTime
        results.RSA.size += ciphertext.length
    }

    // === ElGamal ECIES ===
    const { publicKey: pubEl, privateKey: privEl } = generateElGamalKeys()
    for (let i = 0; i < iterations; i++) {
        const { result: encrypted, time: encTime } = measureTime(() =>
            encryptElGamal(message, pubEl)
        )
        const { time: decTime } = measureTime(() =>
            decryptElGamal(
                encrypted.ciphertext,
                encrypted.iv,
                encrypted.ephemeralPublicKey,
                privEl
            )
        )
        results.ElGamal.enc += encTime
        results.ElGamal.dec += decTime
        results.ElGamal.size +=
            Buffer.byteLength(encrypted.ciphertext, 'base64') +
            Buffer.byteLength(encrypted.iv, 'base64') +
            Buffer.byteLength(encrypted.ephemeralPublicKey, 'hex')
    }

    // === Mostrar Resultados ===
    console.log('\n🔐 Benchmark de Cifradores')
    console.log('===========================')
    console.log('🔍 Mensaje de prueba:', message)
    for (const [method, { enc, dec, size }] of Object.entries(results)) {
        console.log(`\n📦 ${method}`)
        console.log(`⏱️  Promedio cifrado: ${(enc / iterations).toFixed(3)} ms`)
        console.log(
            `⏱️  Promedio descifrado: ${(dec / iterations).toFixed(3)} ms`
        )
        console.log(
            `📊  Tamaño promedio transmitido: ${(size / iterations).toFixed(
                1
            )} bytes`
        )
    }

    socket.disconnect()
}

socket.on('connect', () => {
    console.log('Conectado al servidor. Iniciando benchmark...')
    runBenchmark()
})
