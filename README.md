# First Claude Agent SDK question and answer

PortfolioPilot is a teaching project for a stock portfolio manager. This workspace has completed milestones 00–04. The current application has a React demo interface with six pages, fixed sample portfolio and news data, and a working **Assistant** question and answer screen in local development.

## Purpose of this learning activity

Milestone 04 asks a coding agent to connect a browser question to a server-side agent without building the later database, authentication, streaming, or worker infrastructure. Students learn how to:

- Share a request and response format between the browser and API without exposing server code or secrets to the browser.
- Put two implementations behind an `AgentService` interface: a predictable mock and a Claude adapter.
- Use the **Claude Agent SDK** `query` API with explicit tool, cost, turn, workspace, and time limits. An adapter is a small layer that translates an application's needs into a library's API.
- Keep an experimental endpoint available only during local development, and report an actual Claude failure instead of silently returning a mock answer.

The mock path lets every student run the full browser-to-API interaction without AI credentials. The optional Claude path is for an application API key, not a coding assistant's personal login.

## What was built, in order

1. **Inspected the existing project.** The project plan and state showed that milestone 03 had built the frontend shell, while the Assistant input was still disabled. The installed `@anthropic-ai/claude-agent-sdk` version was `0.3.276`. Its `sdk.d.ts` file was read before writing the adapter. It declares `query({ prompt, options })` and the options used here, including `tools`, `model`, `maxTurns`, `maxBudgetUsd`, `abortController`, `cwd`, and `persistSession`.
2. **Defined shared data and server configuration.** [packages/contracts/src/index.ts](packages/contracts/src/index.ts) now validates a trimmed question of 1–500 characters and a completed answer. [packages/config/src/server.ts](packages/config/src/server.ts) adds `AGENT_MODE`, `AGENT_MODEL_ID`, and `AGENT_WORKSPACE_DIR`. The API's [environment example](apps/api/.env.example) lists the server variables; it contains no credential values.
3. **Implemented the agent boundary.** [packages/agent/src/index.ts](packages/agent/src/index.ts) exports `AgentService`, `MockAgentService`, and `ClaudeAgentService`. Mock mode returns a fixed answer labeled `[Mock answer]`. Claude mode calls the installed Agent SDK's `query` API with a configured model, `tools: []` (no built-in tools), one turn, a USD 0.02 estimated SDK budget, and a 20-second timeout. It requires an API key and an absolute SDK workspace outside the source repository. SDK session persistence is disabled. The model ID is supplied by configuration rather than guessed in code.
4. **Added the temporary API route.** [apps/api/app/api/demo/ask/route.ts](apps/api/app/api/demo/ask/route.ts) handles `POST /api/demo/ask` on the Node.js runtime. It accepts at most 2,048 characters of JSON request body, validates the question, selects the configured adapter, and returns one completed answer. It returns clear errors for bad requests, missing live credentials, timeouts, and agent failures. The route returns 404 outside local development; the API development server binds to `127.0.0.1`.
5. **Connected the Assistant page.** [apps/web/src/app.tsx](apps/web/src/app.tsx) now has an enabled question form, loading and error states, and a visible answer. The page says that portfolio context and current market data are not connected yet. The [styles](apps/web/src/styles.css) support the answer card and form.
6. **Added verification and teaching notes.** Tests were added for request validation, missing credentials, adapter failure, SDK option selection, and the browser mock flow. [docs/lessons/04-first-agent-slice.md](docs/lessons/04-first-agent-slice.md) explains the design; [docs/project-state.md](docs/project-state.md) records the observed results and next milestone. The package lockfile was updated for the API's agent workspace dependency.

The [official Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview) distinguishes the local Agent SDK from the Messages client and Managed Agents. This project uses the local Agent SDK.

## Results observed

With the development servers running in mock mode, a browser question on the Assistant page produced a visible completed answer. The browser test passed. The answer text was:

```text
[Mock answer] This is a deterministic demo response. Portfolio analysis and current market facts are unavailable in this question-and-answer demo.
```

The response also has a `mode` value of `mock` and a request ID. The request ID changes for each request. The browser shows an error if the API cannot complete a request; it does not fabricate a Claude answer.

The implementation checks recorded for milestone 04 were:

| Check | Observed result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Passed; 302 packages installed |
| `npm run build` | Passed, including the web build and Next.js API build |
| `npm run typecheck` | Passed |
| `npm run check:browser-boundary` | Passed; the browser dependency graph contains only web, contracts, and config |
| `npm run test` | Passed; 18 unit tests across contracts, config, agent, web, and API |
| `npm run test:browser --workspace=@portfolio-pilot/web` | Passed; 3 Chrome tests, including a visible mock answer |

The production build emitted non-fatal third-party `use client` directive warnings. A live Claude request was **not** run because no application API key, model ID, or agent workspace was configured in the test shell.

## Run the mock demo

You need Node.js **24.21.0**, npm **11.19.0**, and a local Chrome installation for the browser tests. The lockfile pins the project dependencies. No database, Redis server, or Anthropic credential is needed for mock mode.

From the repository root, run:

```powershell
npm ci
npm run build
npm run dev
```

Open <http://127.0.0.1:5173/assistant>, type a question, and select **Send message**. You should see **Mock answer** and the fixed text above. `npm run dev` starts Vite for the React site on port 5173 and Next.js for `/api` on port 3001. Vite forwards browser `/api` requests to Next.js; this is called a development proxy.

In another terminal, run the checks:

```powershell
npm run typecheck
npm run test
npm run check:browser-boundary
npm run test:browser --workspace=@portfolio-pilot/web
```

Keep `npm run dev` running while the browser test runs. Stop the servers with Ctrl+C afterward.

On the Windows host used for the recorded checks, the normal npm command was inactive because of its local Node version manager. The installed Node and npm CLI worked when invoked directly:

```powershell
$nodeDir = 'C:\Users\luisc\AppData\Local\Author Software\nvm\installs\v24.21.0'
$env:PATH = "$nodeDir;$env:PATH"
& "$nodeDir\node.exe" "$nodeDir\node_modules\npm\bin\npm-cli.js" run dev
```

Replace `run dev` with `ci`, `run build`, or `run test` as needed. Other machines with Node and npm active can use the normal commands.

## Optional Claude mode

Claude mode needs an Anthropic **application API key**, access to a model you choose, and a writable absolute directory outside this source repository for SDK runtime data. Set the following variables in the API server environment, then start or restart `npm run dev`:

```powershell
$env:AGENT_MODE = 'claude'
$env:AGENT_MODEL_ID = '<model ID available to your Anthropic API account>'
$env:AGENT_WORKSPACE_DIR = '<absolute path outside this repository>'
$env:ANTHROPIC_API_KEY = '<application API key>'
npm run dev
```

Ask one short question at <http://127.0.0.1:5173/assistant>. The configured SDK limits still apply. This is a **suggested verification step**, not a claim that live mode succeeded in this workspace. Missing credentials produce a configuration error and never switch to mock mode. Do not put real keys in files committed to a repository or in browser variables such as `VITE_*`.

## Current limits and unfinished work

- The live Claude path has type and failure tests but no credentialed smoke test. To verify it, configure the four server variables above and submit one short question within the USD 0.02 SDK budget.
- `POST /api/demo/ask` is a temporary, unauthenticated **local development** endpoint. It must be removed when authenticated agent run endpoints replace it. It is not a production user API.
- Answers arrive all at once. There is no chat history, streaming, durable cancellation, portfolio-aware context, news evidence, or citations yet.
- Portfolio, watchlist, and news figures on the other pages are deterministic demo fixtures. Database and Redis work begins in milestone 05.
- Only Chrome browser tests were run. This is not a complete accessibility or cross-browser audit.
- This workspace was not a Git repository during the implementation, so no commit was made. Existing Next.js-generated instruction files under `apps/api` remain in place.

For the full milestone sequence and exact project rules, see [docs/project-plan.md](docs/project-plan.md) and [AGENTS.md](AGENTS.md).
