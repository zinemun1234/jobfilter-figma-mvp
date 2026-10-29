# Material Symbols 아이콘을 인라인 SVG 맵으로 생성해 app.js에 주입하는 스크립트.
# - *.html + app.js 에서 material-symbols-outlined 리거처 이름을 수집
# - jsdelivr @material-symbols/svg-400 에서 outlined / fill 변형 SVG를 내려받음
# - app.js 의 /* JF_ICONS_BEGIN */ ~ /* JF_ICONS_END */ 마커 사이를 재생성
import io, re, glob, json, urllib.request, concurrent.futures

BASE = 'https://cdn.jsdelivr.net/npm/@material-symbols/svg-400/outlined/'

# 1) 사용된 아이콘 이름 수집
names = set()
for f in glob.glob('*.html') + ['app.js']:
    src = io.open(f, encoding='utf-8').read()
    for m in re.finditer(r'material-symbols-outlined[^>]*>\s*([a-z_0-9]+)\s*<', src):
        names.add(m.group(1))
    for m in re.finditer(r"icon:\s*'([a-z_0-9]+)'", src):
        names.add(m.group(1))
    # showToast('..', '..', 'icon') 세 번째 인자
    for m in re.finditer(r"showToast\([^)]*?,\s*'([a-z_0-9]+)'\s*\)", src):
        names.add(m.group(1))
    # textContent = 'icon' 토글
    for m in re.finditer(r"textContent\s*=\s*'([a-z_0-9]+)'", src):
        names.add(m.group(1))
    # 삼항 연산자 등으로 삽입되는 아이콘명
    for m in re.finditer(r"\?\s*'([a-z_0-9]+)'\s*:\s*'([a-z_0-9]+)'\s*\)", src):
        names.update(m.groups())
# 수동 확인된 동적 아이콘명
names.update(['bookmark', 'delete', 'pending'])
print('icons found:', len(names))

# 2) fill 변형: 동적 FILL 토글(bookmark·네비 활성 등)이 있으므로 전 아이콘 수집
fill_names = set(names)
print('fill variants:', len(fill_names))

# Material Icons 레거시 리거처명 → Material Symbols 패키지 파일명
ALIAS = {
    'bookmark_border': 'bookmark',
    'cloud_queue': 'cloud',
    'person_outline': 'person',
    'work_outline': 'work',
}

def fetch(name, fill):
    url = BASE + ALIAS.get(name, name) + ('-fill.svg' if fill else '.svg')
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            svg = r.read().decode('utf-8')
        vb = re.search(r'viewBox="([^"]+)"', svg)
        inner = ''.join(re.findall(r'<path[^>]*>', svg))
        return name + ('__fill' if fill else ''), (vb.group(1), inner)
    except Exception as e:
        print('FAIL', url, e)
        return None, None

jobs = [(n, False) for n in sorted(names)] + [(n, True) for n in sorted(fill_names)]
icons = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex:
    for key, val in ex.map(lambda a: fetch(*a), jobs):
        if key:
            icons[key] = val

missing = [n for n in sorted(names) if n not in icons]
if missing:
    print('MISSING:', missing)
print('fetched:', len(icons))

# 3) app.js 마커 사이 주입
body = 'var JF_ICONS = {\n'
for k in sorted(icons):
    vb, inner = icons[k]
    body += '  %s: { v: %s, p: %s },\n' % (json.dumps(k), json.dumps(vb), json.dumps(inner))
body += '};'

BEGIN, END = '/* JF_ICONS_BEGIN */', '/* JF_ICONS_END */'
app = io.open('app.js', encoding='utf-8').read()
if BEGIN in app:
    a, rest = app.split(BEGIN, 1)
    _, b = rest.split(END, 1)
    new = a + BEGIN + '\n' + body + '\n' + END + b
else:
    # 첫 실행: 'use strict' 직후에 마커+맵 삽입
    new = app.replace("'use strict';", "'use strict';\n\n  " + BEGIN + '\n  ' + body.replace('\n', '\n  ') + '\n  ' + END, 1)
io.open('app.js', 'w', encoding='utf-8').write(new)
print('app.js updated:', len(new), 'bytes')
