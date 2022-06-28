var http = require('http')

var server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' })
    response.end('Hello node.js!!asdasd')
})

server.listen(8081, function () {
    console.log('Server is running...');
})