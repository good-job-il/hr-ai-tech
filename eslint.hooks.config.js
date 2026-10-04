import config from "./eslint.config.js"

// Same parser and Hooks policy as the application, without unrelated lint debt.
export default config.map((entry) => ({
  ...entry,
  ...(entry.rules
    ? {
        rules: Object.fromEntries(
          Object.entries(entry.rules).filter(([name]) => name.startsWith("react-hooks/")),
        ),
      }
    : {}),
}))
