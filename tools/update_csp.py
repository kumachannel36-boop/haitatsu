"""index.html の中のスクリプトを書き換えたら実行する（CSPのハッシュを付け直す）。
使い方: python3 tools/update_csp.py
"""
import base64, hashlib, re, sys, time

P = "index.html"
s = open(P, encoding="utf-8").read()

m = re.search(r"<script>(.*?)</script>", s, re.S)
if not m:
    sys.exit("inline script not found")
h = base64.b64encode(hashlib.sha256(m.group(1).encode("utf-8")).digest()).decode()

csp = "; ".join([
    "default-src 'self'",
    f"script-src 'self' 'sha256-{h}' https://cdn.jsdelivr.net blob: 'wasm-unsafe-eval' 'unsafe-eval'",
    "worker-src 'self' blob:",
    "connect-src 'self' https://bhznwbncnzlnpbieetah.supabase.co https://cdn.jsdelivr.net https://tessdata.projectnaptha.com blob: data:",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "manifest-src 'self'",
])
tag = f'<meta http-equiv="Content-Security-Policy" content="{csp}">'
ref = '<meta name="referrer" content="no-referrer">'

if 'http-equiv="Content-Security-Policy"' in s:
    s = re.sub(r'<meta http-equiv="Content-Security-Policy" content="[^"]*">', lambda _: tag, s)
else:
    s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + tag + "\n" + ref, 1)

v = time.strftime("%Y%m%d%H%M")
s = re.sub(r'src="(dcr|fuel)\.js\?v=\d+"', lambda mm: f'src="{mm.group(1)}.js?v={v}"', s)
open(P, "w", encoding="utf-8").write(s)
print("sha256-" + h)
