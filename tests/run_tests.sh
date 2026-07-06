#!/usr/bin/env bash
# Portfolio CI test suite
# Runs HTML structure, CSS, asset, and JSON validation checks.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0

fail() { echo "  FAIL: $1"; ERRORS=$((ERRORS + 1)); }
pass() { echo "  OK:   $1"; }

# ─── 1. HTML Structure Checks ────────────────────────────────────────────────
echo ""
echo "=== HTML Structure Checks ==="

HTML_FILES=("index.html" "blog.html" "cv.html" "projects.html")

for f in "${HTML_FILES[@]}"; do
    path="$REPO_ROOT/$f"
    if [ ! -f "$path" ]; then
        fail "$f is missing"
        continue
    fi
    pass "$f exists"

    # DOCTYPE
    if head -1 "$path" | grep -qi '<!doctype html>'; then
        pass "$f has DOCTYPE"
    else
        fail "$f missing <!DOCTYPE html>"
    fi

    # charset meta
    if grep -qi 'charset=' "$path"; then
        pass "$f has charset"
    else
        fail "$f missing charset meta tag"
    fi

    # viewport meta (mobile support)
    if grep -qi 'name="viewport"' "$path"; then
        pass "$f has viewport meta"
    else
        fail "$f missing viewport meta tag (breaks mobile)"
    fi

    # title tag (allow attributes, e.g. <title data-i18n="...">)
    if grep -qiE '<title(\s[^>]*)?>' "$path"; then
        pass "$f has <title>"
    else
        fail "$f missing <title> tag"
    fi

    # lang attribute on <html>
    if grep -qi '<html[^>]*lang=' "$path"; then
        pass "$f has lang attribute"
    else
        fail "$f missing lang attribute on <html>"
    fi

    # Closing tags
    if grep -qi '</html>' "$path"; then
        pass "$f has closing </html>"
    else
        fail "$f missing closing </html> tag"
    fi
done

# ─── 2. CSS Validation ───────────────────────────────────────────────────────
echo ""
echo "=== CSS Validation ==="

CSS_FILES=("style.css" "css/index.css")

for f in "${CSS_FILES[@]}"; do
    path="$REPO_ROOT/$f"
    if [ ! -f "$path" ]; then
        fail "$f is missing"
        continue
    fi
    pass "$f exists"

    # Check for balanced braces
    OPEN=$(tr -cd '{' < "$path" | wc -c)
    CLOSE=$(tr -cd '}' < "$path" | wc -c)
    if [ "$OPEN" -eq "$CLOSE" ]; then
        pass "$f has balanced braces ($OPEN pairs)"
    else
        fail "$f unbalanced braces: { = $OPEN, } = $CLOSE"
    fi

    # Check that CSS custom properties are defined in :root or [data-theme]
    if grep -q '\-\-bg-color' "$path" && grep -q '\-\-text-primary' "$path"; then
        pass "$f uses CSS custom properties"
    fi
done

# ─── 3. Theme Integrity ──────────────────────────────────────────────────────
echo ""
echo "=== Theme Integrity ==="

STYLE="$REPO_ROOT/style.css"

# Dark theme variables in :root
DARK_VARS=("--bg-color" "--surface-color" "--text-primary" "--text-secondary" "--accent-color" "--accent-glow" "--nav-bg" "--nav-border" "--nav-text")

for v in "${DARK_VARS[@]}"; do
    if grep -qF -- "$v" "$STYLE"; then
        pass "Dark theme defines $v"
    else
        fail "Dark theme missing $v"
    fi
done

# Light theme selector exists
if grep -q '\[data-theme="light"\]' "$STYLE"; then
    pass "Light theme selector exists in style.css"
else
    fail "Light theme selector [data-theme=\"light\"] missing"
fi

# Light theme defines all required variables
LIGHT_BLOCK=$(sed -n '/\[data-theme="light"\] {/,/^}/p' "$STYLE" | head -30)
for v in "${DARK_VARS[@]}"; do
    if echo "$LIGHT_BLOCK" | grep -qF -- "$v"; then
        pass "Light theme defines $v"
    else
        fail "Light theme missing $v"
    fi
done

# ─── 4. Asset References ─────────────────────────────────────────────────────
echo ""
echo "=== Asset Reference Checks ==="

# Check that CSS files referenced in HTML exist
for f in "${HTML_FILES[@]}"; do
    path="$REPO_ROOT/$f"
    # Extract local stylesheet hrefs (skip CDN/external)
    HREFS=$(grep -oP 'href="(?!https?://)[^"]*\.css"' "$path" | sed 's/href="//;s/"//' || true)
    for href in $HREFS; do
        if [ -f "$REPO_ROOT/$href" ]; then
            pass "$f -> $href exists"
        else
            fail "$f references missing CSS: $href"
        fi
    done

    # Extract local script srcs
    SRCS=$(grep -oP 'src="(?!https?://)[^"]*\.js"' "$path" | sed 's/src="//;s/"//' || true)
    for src in $SRCS; do
        if [ -f "$REPO_ROOT/$src" ]; then
            pass "$f -> $src exists"
        else
            fail "$f references missing JS: $src"
        fi
    done
done

# Check that images/media referenced exist
MEDIA_REFS=$(grep -rohP 'src="(?!https?://)[^"]*\.(jpg|png|gif|mp4|webp|svg)"' "$REPO_ROOT"/*.html | sed 's/src="//;s/"//' | sort -u || true)
for ref in $MEDIA_REFS; do
    if [ -f "$REPO_ROOT/$ref" ]; then
        pass "Media asset $ref exists"
    else
        fail "Missing media asset: $ref"
    fi
done

# ─── 5. SEO & Metadata Validation ────────────────────────────────────────────
echo ""
echo "=== SEO & Metadata Checks ==="

for f in "sitemap.xml" "robots.txt" "404.html" "content/preview-card.png"; do
    if [ -f "$REPO_ROOT/$f" ]; then
        pass "$f exists"
    else
        fail "$f is missing"
    fi
done

# sitemap.xml is well-formed XML
if python3 -c "import xml.etree.ElementTree as ET; ET.parse('$REPO_ROOT/sitemap.xml')" 2>/dev/null; then
    pass "sitemap.xml is valid XML"
else
    fail "sitemap.xml has invalid XML syntax"
fi

# Each main page has a meta description and canonical URL
for f in "${HTML_FILES[@]}"; do
    path="$REPO_ROOT/$f"
    if grep -qi 'name="description"' "$path"; then
        pass "$f has meta description"
    else
        fail "$f missing meta description"
    fi
    if grep -qi 'rel="canonical"' "$path"; then
        pass "$f has canonical URL"
    else
        fail "$f missing canonical URL"
    fi
done

# JSON-LD on the homepage is valid JSON and its CSP hash is current.
# (The CSP meta must whitelist the exact sha256 of the JSON-LD content,
# otherwise browsers report a violation for the structured-data block.)
JSONLD_CHECK=$(python3 -c "
import hashlib, base64, json, re, sys
s = open('$REPO_ROOT/index.html').read()
m = re.search(r'<script type=\"application/ld\+json\">(.*?)</script>', s, re.S)
if not m:
    print('no JSON-LD block found'); sys.exit(1)
try:
    json.loads(m.group(1))
except Exception as e:
    print(f'invalid JSON-LD: {e}'); sys.exit(1)
h = base64.b64encode(hashlib.sha256(m.group(1).encode()).digest()).decode()
if f'sha256-{h}' not in s:
    print(f'CSP hash stale — expected sha256-{h}'); sys.exit(1)
print('ok')
" 2>&1) && pass "index.html JSON-LD is valid and CSP hash matches" || fail "index.html JSON-LD: $JSONLD_CHECK"

# Regression guard: no inline style= attributes (blocked by our CSP)
INLINE_STYLES=$(grep -n 'style="' "$REPO_ROOT"/*.html | grep -v 'stylesheet' || true)
if [ -z "$INLINE_STYLES" ]; then
    pass "No inline style attributes in HTML (CSP-safe)"
else
    fail "Inline style attributes found (blocked by CSP): $INLINE_STYLES"
fi

# Regression guard: external links opening new tabs carry rel=noopener
UNSAFE_BLANK=$(grep -n 'target="_blank"' "$REPO_ROOT"/*.html | grep -v 'rel="noopener"' || true)
if [ -z "$UNSAFE_BLANK" ]; then
    pass "All target=_blank links have rel=noopener"
else
    fail "target=_blank without rel=noopener: $UNSAFE_BLANK"
fi

# ─── 6. CSS Light Theme Contrast Checks ──────────────────────────────────────
echo ""
echo "=== Light Theme Contrast Checks ==="

# Extract light theme colors and verify contrast ratios using Python
python3 -c "
import re, sys

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def relative_luminance(r, g, b):
    rs, gs, bs = [x / 255.0 for x in (r, g, b)]
    rs = rs / 12.92 if rs <= 0.04045 else ((rs + 0.055) / 1.055) ** 2.4
    gs = gs / 12.92 if gs <= 0.04045 else ((gs + 0.055) / 1.055) ** 2.4
    bs = bs / 12.92 if bs <= 0.04045 else ((bs + 0.055) / 1.055) ** 2.4
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs

def contrast_ratio(hex1, hex2):
    l1 = relative_luminance(*hex_to_rgb(hex1))
    l2 = relative_luminance(*hex_to_rgb(hex2))
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

# Read style.css
with open('$STYLE') as f:
    css = f.read()

# Extract light theme block
match = re.search(r'\[data-theme=\"light\"\]\s*\{([^}]+)\}', css)
if not match:
    print('  FAIL: Could not parse light theme block')
    sys.exit(1)

block = match.group(1)
vars = {}
for line in block.split('\n'):
    m = re.search(r'(--[\w-]+):\s*(#[0-9a-fA-F]{6})', line)
    if m:
        vars[m.group(1)] = m.group(2)

bg = vars.get('--bg-color')
if not bg:
    print('  FAIL: No --bg-color found in light theme')
    sys.exit(1)

errors = 0
pairs = {
    '--text-primary':   4.5,
    '--text-secondary': 4.5,
    '--accent-color':   4.5,
    '--nav-text':       4.5,
}

for var, min_ratio in pairs.items():
    color = vars.get(var)
    if not color:
        continue
    ratio = contrast_ratio(bg, color)
    if ratio >= min_ratio:
        print(f'  OK:   {var} ({color}) on {bg}: {ratio:.1f}:1 (>= {min_ratio}:1)')
    else:
        print(f'  FAIL: {var} ({color}) on {bg}: {ratio:.1f}:1 (need {min_ratio}:1)')
        errors += 1

sys.exit(errors)
" || ERRORS=$((ERRORS + $?))

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "================================"
if [ "$ERRORS" -eq 0 ]; then
    echo "ALL TESTS PASSED"
    exit 0
else
    echo "FAILED: $ERRORS error(s) found"
    exit 1
fi
