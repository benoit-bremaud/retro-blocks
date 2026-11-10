# Nightly local CI (tier L3, ADR-0005)

`retro-blocks-nightly.timer` runs `mise x -- just nightly` every day at 05:10 (catching up after
the PC was off); a failure raises a desktop notification. Install once, from the repository root:

```bash
systemctl --user link "$PWD"/scripts/systemd/retro-blocks-nightly.service "$PWD"/scripts/systemd/retro-blocks-nightly-failed.service "$PWD"/scripts/systemd/retro-blocks-nightly.timer && systemctl --user enable --now retro-blocks-nightly.timer
```

Check: `systemctl --user list-timers retro-blocks-nightly.timer`; logs:
`journalctl --user -u retro-blocks-nightly.service`.
