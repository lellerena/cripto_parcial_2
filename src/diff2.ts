// Funciones auxiliares para operaciones modulares
// 1. Exponentiación modular
function modExp(base: number, exponent: number, modulus: number): number {
    let result = 1
    base = base % modulus // Para evitar base > modulus

    while (exponent > 0) {
        if (exponent % 2 === 1) {
            // Si el exponente es impar
            result = (result * base) % modulus
        }
        exponent = Math.floor(exponent / 2)
        base = (base * base) % modulus
    }
    return result
}

// 2. Inversa modular usando el algoritmo extendido de Euclides
function modInverse(a: number, m: number): number {
    let m0 = m,
        t,
        q
    let x0 = 0,
        x1 = 1
    if (m === 1) return 0
    while (a > 1) {
        q = Math.floor(a / m)
        t = m
        m = a % m
        a = t
        t = x0
        x0 = x1 - q * x0
        x1 = t
    }
    if (x1 < 0) x1 += m0
    return x1
}

// 3. Cargar parámetros desde un archivo JSON
import * as fs from 'fs'

// Función para leer el archivo JSON (en el mismo directorio)
function loadParameters(filePath: string): any {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data).parameters[3]
}

// 4. Protocolo de intercambio de llaves Diffie-Hellman
class DiffieHellman {
    p: number // Número primo p
    g: number // Base g
    private privateKey: number // Clave privada
    publicKey: number // Clave pública

    constructor(p: number, g: number) {
        this.p = p
        this.g = g
        this.privateKey = this.generatePrivateKey()
        this.publicKey = this.calculatePublicKey()
    }

    // Generar una clave privada aleatoria
    private generatePrivateKey(): number {
        return Math.floor(Math.random() * (this.p - 2)) + 1 // Número aleatorio entre 1 y p-1
    }

    // Calcular la clave pública: g^privateKey mod p
    private calculatePublicKey(): number {
        return modExp(this.g, this.privateKey, this.p)
    }

    // Calcular la clave compartida: publicKey^privateKey mod p
    public calculateSharedKey(otherPublicKey: number): number {
        return modExp(otherPublicKey, this.privateKey, this.p)
    }
}

// Simulación del protocolo de intercambio de llaves
function simulateDiffieHellmanExchange() {
    // Cargar los parámetros p y g desde el archivo JSON
    const params = loadParameters('./parameters.json')
    const p = params.p
    const g = params.g

    console.log(`Parámetros cargados: p = ${p}, g = ${g}`)

    // Alice y Bob crean instancias de DiffieHellman
    const alice = new DiffieHellman(p, g)
    const bob = new DiffieHellman(p, g)

    console.log(`Clave pública de Alice: ${alice.publicKey}`)
    console.log(`Clave pública de Bob: ${bob.publicKey}`)

    // Alice y Bob intercambian sus claves públicas y calculan la clave compartida
    const sharedKeyAlice = alice.calculateSharedKey(bob.publicKey)
    const sharedKeyBob = bob.calculateSharedKey(alice.publicKey)

    console.log(`Clave compartida calculada por Alice: ${sharedKeyAlice}`)
    console.log(`Clave compartida calculada por Bob: ${sharedKeyBob}`)

    // Verificar que ambas claves compartidas son iguales
    if (sharedKeyAlice === sharedKeyBob) {
        console.log(
            '¡El intercambio de llaves fue exitoso! La clave compartida es:',
            sharedKeyAlice
        )
    } else {
        console.log('Error en el intercambio de llaves.')
    }
}

// Llamar a la simulación del protocolo
simulateDiffieHellmanExchange()
