# Local quality gate. `make verify` is the pre-push hook.
SONAR_URL := http://localhost:9000
SONAR_TOKEN_FILE := $(HOME)/.config/sonarqube/analysis-token

.PHONY: verify check doc-coverage secrets audit sonar-scan

verify: check secrets audit sonar-scan

check:
	pnpm typecheck
	pnpm lint
	pnpm knip
	pnpm format:check
	pnpm test:coverage
	$(MAKE) --no-print-directory doc-coverage

# Documentation coverage: exports of src/ preceded by a doc block, floor 90 % (owner rule).
doc-coverage:
	@git ls-files 'src/**/*.ts' | xargs awk ' \
	  /^export (type [A-Za-z]+ = \(typeof|\{)/ { next } \
	  /^export / { total++; if (prev !~ /\*\/[[:space:]]*$$/) missing++ } \
	  !/^[[:space:]]*$$/ { prev = $$0 } \
	  END { pct = total ? (total - missing) * 100 / total : 100; \
	        printf "doc coverage: %d/%d exports documented (%.1f %%, floor 90)\n", total - missing, total, pct; \
	        exit (pct < 90) }'

secrets:
	gitleaks git --redact --no-banner

audit:
	pnpm audit --audit-level high

# Global analysis token (infra-accounts token model): $SONAR_TOKEN, else the token file.
sonar-scan:
	@curl -sf -m 5 "$(SONAR_URL)/api/system/status" | grep -q '"status":"UP"' || { echo "SonarQube is not UP at $(SONAR_URL)."; exit 1; }
	@TOKEN="$${SONAR_TOKEN:-$$(cat "$(SONAR_TOKEN_FILE)" 2>/dev/null)}"; test -n "$$TOKEN" || { echo "No SONAR_TOKEN and no $(SONAR_TOKEN_FILE)."; exit 1; }; \
	SONAR_TOKEN="$$TOKEN" sonar-scanner -Dsonar.host.url="$(SONAR_URL)" -Dsonar.projectVersion="$$(node -p "require('./package.json').version")"
