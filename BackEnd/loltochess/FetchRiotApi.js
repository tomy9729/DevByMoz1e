import { apiKey } from "./apiKey.js"
import axios from 'axios'
import AxiosUtil from "./AxiosUtil.js"
const url = "https://kr.api.riotgames.com/tft/summoner/v1/summoners/by-name/"
const key = `?api_key=${apiKey}`

class FetchRitoApi {
    getUserInfoByUserName(userName) {
        const encodeUserName = encodeURI(userName)
        return AxiosUtil.handle(axios.get(`${url}${encodeUserName}${key}`))
    }
}


Object.freeze(FetchRitoApi)
export default new FetchRitoApi()