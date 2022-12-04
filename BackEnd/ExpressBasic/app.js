const express = require("express")
const app = express()
const port = 8081

app.listen(port, () => {
    console.log(`안녕 나의 port는 ${port}야`)
})

app.get("/", (request, response) => {
    response.send("hello world")
})