export default [
  {
    files: ["src/**/*.js", "src/**/*.jsx"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        navigator: "readonly",
        location: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-empty": "off",
      "no-constant-condition": "off"
    }
  }
];
