import express from 'express'
import FetchRitoApi from './FetchRiotApi.js'

const app = express()
const port = 8081

app.get('/', (req, res) => {
    res.send('Hello World!')
})

//TODO user이름을 바탕으로 user의 정보들 (레벨, 티어, 최근 게임 등) 가져오기
//
app.get("/user/:username", (req, res) => {
    const userName = req.params.username
    FetchRitoApi.getUserInfoByUserName(userName)
        .then(userInfo => {
            res.send(userInfo)
        })
        .catch((error) => console.log(error)) //TODO 에러처리
})

app.listen(port, () => {
    console.log(`Server is Running on port ${port}`)
})
