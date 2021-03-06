module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  parserOptions: {
    sourceType: "module",
    requireConfigFile: false,
  },
  extends: [
    "@nuxtjs",
    "@nuxtjs/eslint-config-typescript",
    "prettier/prettier",
    "eslint:recommended",
    "plugin:vue/recommended",
    "plugin:prettier/recommended",
    "plugin:nuxt/recommended",
  ],
  ignorePatterns: ["helpers/backend/graphql.ts"],
  plugins: ["vue", "nuxt", "prettier"],
  // add your custom rules here
  rules: {
    semi: [2, "never"],
    "import/named": "off", // because, named import issue with typescript see: https://github.com/typescript-eslint/typescript-eslint/issues/154
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "vue/multi-word-component-names": "off",
    "import/no-named-as-default": "off",
    "import/no-named-as-default-member": "off",
    "import/default": "off",
    "no-undef": "off",
    "no-prototype-builtins": 0,
    "no-unused-vars": 0,
    "@typescript-eslint/no-unused-vars": 0,
  },
  globals: {
    $nuxt: true,
  },
}
