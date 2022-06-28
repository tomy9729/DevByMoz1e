import { apiKey } from "./apiKey.js"
import fetch from "node-fetch"
import axios from 'axios'

const url = "https://kr.api.riotgames.com/tft/summoner/v1/summoners/by-name/"
const userName = "moz1e"
const key = `?api_key=${apiKey}`

fetch(`${url}${userName}${key}`)
    .then((res) => res.json())
    .then((data) => console.log(data))

axios.get(`${url}${userName}${key}`, { headers: { charset: "utf-8" } })
    .then((res) => console.log(res.data))
