# Agents guidelines when building React applications with AI-powered tools

- *OBJECTIVE:* Building production-ready React applications with TypeScript and AI-powered tools.
- *REASON:* Enables rapid prototyping and design collaboration while delivering production-quality, maintainable code.
- *DESCRIPTION:* Use these instructions when building React applications in TypeScript, independent of specific UI frameworks.
- *INSTRUCTIONS:* Create responsive, accessible React applications with TypeScript using strict configuration.
- *IMPORTANT!* Before you start a task, or make a new change, follow these *rules*:
- DO NOT change the visual design, theme styling, or composition of the UI once a ``checkpoint and/or a component or pattern has been established.
- DO NOT revert any "styling" (CSS/Layout) or "scripting" (TS/JSX) change intentionally by me.
- DO NOT make changes outside the scope of the requested feature, i.e., don't modify the main navigation when asked to build a data table.
- ALWAYS break out code into reusable components ready for export via ES module
- Keep styling logic (MUI sx props or styled-components) clearly separated from business logic (API calls/state). Do not merge them into monolithic blocks.
- Before proceeding with any change that modifies an existing UI component, state the current checkpoint name and ask for confirmation that this change does not violate the established design.
- When providing code updates, provide the entire file rather than snippets with '...' or 'rest of code here' to ensure no logic is lost during the rewrite.
