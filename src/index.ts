import express from 'express'

import { router } from './routes/index.routes'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.use(router)

app.get('/', (_req, res) => {
    res.send('Hello, TypeScript + Express!')
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} yes`)
})
