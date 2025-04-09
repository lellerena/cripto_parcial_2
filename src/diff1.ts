import * as fs from 'fs'

// Función para realizar la exponenciación modular (base^exp % mod) con BigInt
function modExp(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n
    base = base % mod
    while (exp > 0n) {
        if (exp % 2n === 1n) {
            result = (result * base) % mod
        }
        exp = exp / 2n
        base = (base * base) % mod
    }
    return result
}

// Función para generar una clave pública con BigInt
function generatePublicKey(p: bigint, g: bigint, privateKey: bigint): bigint {
    return modExp(g, privateKey, p)
}

// Función para generar la clave compartida con BigInt
function generateSharedKey(
    p: bigint,
    otherPublicKey: bigint,
    privateKey: bigint
): bigint {
    return modExp(otherPublicKey, privateKey, p)
}

// Cargar los parámetros desde un archivo JSON como BigInt
function loadParametersFromFile(
    filePath: string
): { p: bigint; g: bigint; q: bigint }[] {
    const data = fs.readFileSync(filePath, 'utf-8')
    const rawParams = JSON.parse(data).parameters

    return rawParams.map((param: any) => ({
        p: BigInt(param.p),
        g: BigInt(param.g),
        q: BigInt(param.q)
    }))
}

// Función principal con claves privadas grandes
function diffieHellmanExchange(
    filePath: string,
    privateKeyA: bigint,
    privateKeyB: bigint
): void {
    const parameters = loadParametersFromFile(filePath)

    parameters.forEach((param) => {
        const { p, g, q } = param

        console.log(`\nIntercambio de llaves usando p=${p}, g=${g}, q=${q}`)

        const publicKeyA = generatePublicKey(p, g, privateKeyA)
        const publicKeyB = generatePublicKey(p, g, privateKeyB)

        console.log(`Clave pública de A: ${publicKeyA}`)
        console.log(`Clave pública de B: ${publicKeyB}`)

        const sharedKeyA = generateSharedKey(p, publicKeyB, privateKeyA)
        const sharedKeyB = generateSharedKey(p, publicKeyA, privateKeyB)

        console.log(`Clave compartida calculada por A: ${sharedKeyA}`)
        console.log(`Clave compartida calculada por B: ${sharedKeyB}`)

        if (sharedKeyA === sharedKeyB) {
            // console.log('¡La clave compartida es correcta!')
        } else {
            console.log('¡Error! Las claves compartidas no coinciden.')
        }
    })
}

// Claves privadas como BigInt
const privateKeyA = BigInt('123456789123456789123456789') // Ejemplo largo
const privateKeyB = BigInt('987654321987654321987654321')

// Ruta al archivo JSON
const filePath = './parameters.json'

// Ejecutar
diffieHellmanExchange(filePath, privateKeyA, privateKeyB)
