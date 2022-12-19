module.exports = {
    //// 20220630 vue-cli@5.0.6로 vue create ([Vue 3] babel, eslint)한 원본:
    root: true,
    env: {
        node: true
    },
    extends: [
        // 20220630 원본은 아래 주석
        // 'plugin:vue/vue3-essential',
        // '@vue/standard',
        "eslint:recommended",
        "plugin:vue/vue3-recommended",
        // "plugin:vue/vue3-essential",
        // "plugin:vue/vue3-strongly-recommended",
    ],
    parserOptions: {
        parser: '@babel/eslint-parser'
    },
    // rules: {}
    //// end of 20220630 vue-cli@5.0.6 ////////

    // VSCode에서 F12로 찾아가기 위한 세팅
    plugins: [
        "import"
    ],

    rules: {
        "no-unused-vars": ["error", { args: "none" }],
        "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",

        // var는 사용하지 않는다.
        "no-var": ["error"],

        // method는 반드시 property shorthand를 사용한다.
        "object-shorthand": ["error", "methods"],

        "import/extensions": ["error", { vue: "always" }],

        //// 20220630 plugin:vue/vue3-recommended중에서 customize ////////

        // 20220224 indent with 4 spaces
        "vue/html-indent": ["error", 4, {
            "attribute": 1,
            "baseIndent": 1,
            "closeBracket": 0,
            "alignAttributesVertically": true,
            "ignores": []
        }],

        // 20220224 camelCase attribute name
        "vue/attribute-hyphenation": ["error", "never", {
            "ignore": []
        }],

        // 20220701 v-on-event 이름 작성시 hyphenation을 꼭 사용할 필요는 없다.
        "vue/v-on-event-hyphenation": ["error", "never", {
            "autofix": false,
            "ignore": []
        }],

        // 20220308 디폴트가 잘못 되어 있다. https://github.com/vuejs/eslint-plugin-vue/issues/905 및
        // https://stackoverflow.com/a/3558200/4699260 참고
        "vue/html-self-closing": ["error", {
            "html": {
                "void": "always",
                "normal": "never",
                "component": "always"
            },
            "svg": "always",
            "math": "always"
        }],

        // 20220224 allow multiple attributes per line
        "vue/max-attributes-per-line": ["error", {
            "singleline": { "max": 99 },
            "multiline": { "max": 1 }
        }],

        // 20220308 어떨때는 this를 쓰고 싶은 경우도 있다.
        "vue/this-in-template": "off",

        // 20220324 vscode의 prettier랑 맞지 않는다
        // "vue/singleline-html-element-content-newline": ["error", {
        //     "ignoreWhenNoAttributes": true,
        //     "ignoreWhenEmpty": true,
        //     "ignores": ["pre", "textarea", ...INLINE_ELEMENTS]
        // }]
        "vue/singleline-html-element-content-newline": "off",

        //20220701 emit에 대해 정의하지 않으면 에러표시
        "vue/require-explicit-emits": ["error", {
            "allowProps": false
        }],

        "semi": [2, 'never']

        //// end of 20220630 plugin:vue/vue3-recommended중에서 customize ////////
    },

    settings: {
        // @ alias 찾기
        "import/resolver": {
            // This is why the npm eslint-import-resolver-alias package is necessary.
            // Putting a property into import/resolver object appends 'eslint-import-resolver-' to property name
            // @see https://github.com/johvin/eslint-import-resolver-alias/blob/master/README.md
            alias: {
                map: [
                    ["@", "./src"],
                    // default Vue `@` alias that exists even if `vue.config.js` is not present
                    // ... add your own aliases here, make sure they're in vue.config.js / webpack config file
                ],
                extensions: [".vue", ".json", ".js"],
            },
        },
    },
}
