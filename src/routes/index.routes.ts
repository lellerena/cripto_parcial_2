import { Router } from 'express'

const router = Router()

router.get('/hola', (_req, res) => {
    res.send('Hello, TypeScript + Express!a')
})

export { router }
