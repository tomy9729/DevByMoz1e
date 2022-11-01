const express = require("express")
const app = express()

function logger(req, res, next) {
    console.log("logger...")
    next()
}

function logger2(req, res, next) {
    console.log("logger2...")
    next()
}


app.use(logger)
app.use(logger2)

const server = app.listen(8081, () => {
    console.log("Start Server : localhost:8081")
})