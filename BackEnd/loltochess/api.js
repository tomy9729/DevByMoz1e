const express = require('express')
const app = express()
const port = 8081

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get("/user/:nickname", (req, res) => {
    res.send(req.params)
})

app.listen(port, () => {
    console.log(`Server is Running on port ${port}`)
})