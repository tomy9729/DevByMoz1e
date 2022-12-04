//// 20220630 vue-cli@5.0.6로 vue create ([Vue 3] babel, eslint)한 원본:
// const { defineConfig } = require('@vue/cli-service')
// module.exports = defineConfig({
//   transpileDependencies: true
// })
//// end of 20220630

const { defineConfig } = require('@vue/cli-service')
const fs = require("fs")
const path = require("path")
const webpack = require("webpack")

const inDev = process.env.NODE_ENV == "development"
const devConfig = (() => {
    const devConfig = {}
    if (inDev) {
        const configPath = path.resolve(__dirname, "user.config.js")
        if (fs.existsSync(configPath)) {
            devConfig.userConfig = require(configPath)
        } else {
            // user.config 파일 없음
            devConfig.userConfig = null
        }
    }
    return devConfig
})()

module.exports = defineConfig({
    transpileDependencies: true,
    lintOnSave: false,
    devServer: {
        // proxy: {
        //     '/':{
        //         "target":'https://zsaas.brainzcompany.com',
        //         // "pathRewrite":{'^/':''},
        //         // "changeOrigin":true,
        //         "secure":true,
        //         // "historyApiFallback": true,
        //     },
        // },
    },
    chainWebpack: (config) => {
        config.resolve.alias.set("@", path.resolve(__dirname, "src/"))
        if (inDev) config.resolve.alias.set("inferno", 'inferno/dist/index.dev.esm.js')
        config.plugin("define")
            .use(webpack.DefinePlugin, [{
                NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                DEV_CONFIG: JSON.stringify(devConfig)
            }])
    },
    css: {
        sourceMap: true,
        loaderOptions: {
            scss: {
                additionalData: `
                    //     @import "~@/assets/scss/variables/_variables.scss";
                    //     @import "~@/assets/scss/mixins/_mixins.scss";
                    //     @import "~@/assets/scss/functions/_functions.scss";
                `,
            },
        },
    },
})