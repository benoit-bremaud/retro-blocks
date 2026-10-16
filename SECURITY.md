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

- **Secret detection** — Gitleaks runs in CI on every push and pull request, plus a weekly
  schedule. Any finding fails the check; there is no advisory mode for secrets.
- **Pinned actions** — every GitHub Actions step is pinned to a full commit SHA, never a tag.
- **Dependency monitoring** — Dependabot alerts and update PRs are enabled for the repository.
- **No backend, no personal data** — a static web page with no server, no account and no network
  call. Settings and the local hall of fame (planned) will stay in the browser's `localStorage`
  and hold nothing personal beyond a chosen name.
- **No secrets in the repository** — the project holds no credential; real dotenv files are
  gitignored.

Thank you for helping keep the project secure.
