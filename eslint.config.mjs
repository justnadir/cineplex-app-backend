import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            "prettier/prettier": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
    prettierConfig,
    {
        ignores: ["dist/", "node_modules/"],
    }
);