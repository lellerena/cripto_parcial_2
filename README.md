## 🛡️ Parcial 2 - Criptografía  
**Universidad del Norte**  
**Departamento de Ingeniería de Sistemas y Computación**  
**Criptografía - Análisis de Seguridad y Eficiencia en Sistemas de Llave Pública**

### 👥 Integrantes del grupo
- **Camilo Andrés Heras Gómez**
- **Jaymed Daniel Linero Caro**
- **Luis Eduardo Llerena Trujillo**

---

## 🚀 Scripts de Ejecución

Los scripts están definidos en el archivo `package.json`. Para ejecutarlos, usa el siguiente formato:

```bash
npm run <nombre-del-script>
```

### 🧪 Escenario 1 – Intercambio DH + ChaCha20 + BSGS
| Componente | Script              | Descripción                                  |
|------------|---------------------|----------------------------------------------|
| Servidor   | `npm run server`    | Inicia el servidor del Escenario 1           |
| Cliente    | `npm run client`    | Inicia el cliente que se conecta al servidor |

### 🕵️ Escenario 2 – DH-ECC (P256) + AES-192 CBC + Ataque MitM
| Componente | Script              | Descripción                                  |
|------------|---------------------|----------------------------------------------|
| Servidor   | `npm run server:2`  | Inicia el servidor legítimo del escenario 2  |
| Cliente    | `npm run client:2`  | Inicia el cliente legítimo del escenario 2   |
| Atacante   | `npm run attacker`  | Ejecuta el atacante (MitM) que intercepta    |

> ⚠️ Para que el ataque MitM funcione, el cliente debe conectarse al **atacante** (puerto 4000) y no directamente al servidor (puerto 3000). Asegúrate de que `client/index.ts` apunte a `http://localhost:4000`.

### 🔐 Escenario 3 – RSA-OAEP vs ElGamal + Comparación
| Componente | Script              | Descripción                                  |
|------------|---------------------|----------------------------------------------|
| Servidor   | `npm run server:3`  | Inicia el servidor para pruebas de asimétricos |

---

## 📜 Instrucciones Generales

1. Asegúrate de tener instaladas las dependencias:

```bash
npm install
```

2. Ejecuta cada escenario con los scripts correspondientes según las pruebas.
3. El atacante debe poder interceptar, desencriptar y reenviar mensajes entre cliente y servidor.

---

