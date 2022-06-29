const AxiosUtil = {}
AxiosUtil.handle = (promise) => {
    return promise.then(res => res.data)
        .catch(err => {
            console.error(err)
            return Promise.reject(err)
        })
}

Object.freeze(AxiosUtil)
export default AxiosUtil