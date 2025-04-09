// server/dh.ts
import { randomBytes } from 'crypto'

export function generatePrivateKey(bits = 256): bigint {
    const byteLength = bits / 8
    const randomBuffer = randomBytes(byteLength)
    return BigInt('0x' + randomBuffer.toString('hex'))
}

export function modExp(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n
    base %= mod
    while (exp > 0n) {
        if (exp % 2n === 1n) result = (result * base) % mod
        exp /= 2n
        base = (base * base) % mod
    }
    return result
}

export function generatePublicKey(
    p: bigint,
    g: bigint,
    privateKey: bigint
): bigint {
    return modExp(g, privateKey, p)
}

export function generateSharedKey(
    p: bigint,
    otherPublicKey: bigint,
    privateKey: bigint
): bigint {
    return modExp(otherPublicKey, privateKey, p)
}
