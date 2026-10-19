import tseslint from "typescript-eslint";
export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "KaziCoach_TZ_2_Project_Kit/**",
      "supabase/.temp/**",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}", "functions/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "no-debugger": "error",
      "no-unreachable": "error",
      "no-constant-condition": "error",
      "constructor-super": "error",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
    },
  },
];
