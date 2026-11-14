# Nightly local CI (tier L3, ADR-0005)

`retro-blocks-nightly.timer` runs `mise x -- just nightly` every day at 05:10 (catching up after
the PC was off) in a dedicated worktree of `origin/main`, `~/.cache/nightly/retro-blocks`, fetched,
reset, cleaned and reinstalled from the lockfile on each run, never the working checkout
(agents-skills#427). Only known vulnerabilities and secrets fail it; a failure raises a desktop
notification. Install once, and again after every change to these units, from the repository root
on an up-to-date `main`:

```bash
cp scripts/systemd/retro-blocks-nightly.service scripts/systemd/retro-blocks-nightly-failed.service scripts/systemd/retro-blocks-nightly.timer ~/.config/systemd/user/ && systemctl --user daemon-reload && systemctl --user enable --now retro-blocks-nightly.timer
```

The units are copies, not symlinks: the live units do not depend on the branch checked out here.

Check: `systemctl --user list-timers retro-blocks-nightly.timer`; logs:
`journalctl --user -u retro-blocks-nightly.service`.
