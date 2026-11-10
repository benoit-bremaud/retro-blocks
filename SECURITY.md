# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| `main` (HEAD) | Yes |
| Anything else | No |

Only the current state of `main` receives security fixes. Tagged releases are snapshots; a fix
ships as a new release from `main`.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Use GitHub's private vulnerability reporting: on the repository page, open the **Security** tab
and click **Report a vulnerability**. The report is visible only to the repository owner, who
enables this feature in the repository settings. Include:

- a description of the vulnerability and its potential impact;
- steps to reproduce, or a proof of concept;
- the commit or release where you observed it.

You will receive an acknowledgment within **72 hours**. A fix is prioritised by severity and
disclosed through a GitHub security advisory once released.

## Security practices

- **Secret detection** — gitleaks runs on every commit (staged files), on every push (full
  history) and every night, with TruffleHog nightly (ADR-0005). Any finding fails the tier; there
  is no advisory mode for secrets.
- **Static analysis and dependencies** — Semgrep Community Edition and `pnpm audit` (high and
  above) run before every push; no GitHub workflow runs, so there is no Action to pin.
- **Attested merges** — `main` requires the `gate` status; the control is the SSH-signed note on
  the exact head SHA that `just gate` writes with it, verified by `just merge` against the
  `.github/allowed_signers` of `origin/main` (ADR-0005).
- **Dependency monitoring** — Dependabot alerts and update PRs are enabled for the repository.
- **No backend, no personal data** — a static web page with no server, no account and no network
  call. Settings and the local hall of fame (planned) will stay in the browser's `localStorage`
  and hold nothing personal beyond a chosen name.
- **No secrets in the repository** — the project holds no credential; real dotenv files are
  gitignored.

Thank you for helping keep the project secure.
