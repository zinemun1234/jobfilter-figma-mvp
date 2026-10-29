# -*- coding: utf-8 -*-
"""figma_src/s*.html → jobfilter-web/app/**/page.tsx JSX 변환기."""
import json
import os
import re

SRC = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(SRC, '..', 'jobfilter-web')

# 파일 → 라우트
PAGES = {
    's10_dashboard.html': 'app/dashboard/page.tsx',
    's11_listings.html': 'app/jobs/page.tsx',
    's12_detail.html': 'app/jobs/[id]/page.tsx',
    's14_kanban.html': 'app/applications/page.tsx',
    's15_coverletter.html': 'app/resume-coaching/page.tsx',
    's16_analysis.html': 'app/resume-coaching/analysis/page.tsx',
    's27_profile.html': 'app/profile/page.tsx',
    's31_company_post.html': 'app/company/post/page.tsx',
    's33_applicants.html': 'app/company/applicants/page.tsx',
    's41_admin_review.html': 'app/admin/review/page.tsx',
    's42_admin.html': 'app/admin/upload/page.tsx',
}

# kebab-case SVG/HTML 속성 → JSX camelCase
ATTR_MAP = {
    'class': 'className', 'for': 'htmlFor',
    'stroke-width': 'strokeWidth', 'stroke-dasharray': 'strokeDasharray',
    'stroke-dashoffset': 'strokeDashoffset', 'stroke-linecap': 'strokeLinecap',
    'stroke-linejoin': 'strokeLinejoin', 'stroke-miterlimit': 'strokeMiterlimit',
    'stroke-opacity': 'strokeOpacity', 'fill-opacity': 'fillOpacity',
    'clip-path': 'clipPath', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule',
    'xlink:href': 'xlinkHref', 'xmlns:xlink': 'xmlnsXlink', 'xml:space': 'xmlSpace',
    'tabindex': 'tabIndex', 'colspan': 'colSpan', 'rowspan': 'rowSpan',
    'maxlength': 'maxLength', 'minlength': 'minLength', 'readonly': 'readOnly',
    'autocomplete': 'autoComplete', 'autofocus': 'autoFocus',
    'datetime': 'dateTime', 'formaction': 'formAction', 'formmethod': 'formMethod',
    'novalidate': 'noValidate', 'spellcheck': 'spellCheck',
    'contenteditable': 'contentEditable', 'srcset': 'srcSet',
    'crossorigin': 'crossOrigin', 'usemap': 'useMap', 'playsinline': 'playsInline',
    'accept-charset': 'acceptCharset', 'http-equiv': 'httpEquiv',
    'allowfullscreen': 'allowFullScreen', 'frameborder': 'frameBorder',
}

VOID = 'img|br|hr|input|meta|link|source|area|base|col|embed|track|wbr|param'


def camel(s):
    parts = s.split('-')
    return parts[0] + ''.join(p[:1].upper() + p[1:] for p in parts[1:])


def style_to_obj(m):
    """style="k:v;k2:v2" → style={{k:'v',k2:'v2'}}"""
    body = m.group(1)
    pairs = []
    for decl in body.split(';'):
        decl = decl.strip()
        if not decl or ':' not in decl:
            continue
        k, v = decl.split(':', 1)
        pairs.append('%s:%s' % (camel(k.strip()), json.dumps(v.strip())))
    return 'style={{%s}}' % ','.join(pairs)


def icon_span(m):
    classes = ' '.join(c for c in m.group(1).split() if c != 'material-symbols-outlined')
    attrs = m.group(2) or ''
    name = m.group(3).strip()
    fill = 'FILL' in attrs and ('1' in attrs)
    # style에서 FILL 표기된 경우 fill prop으로
    style_m = re.search(r'style="([^"]*)"', attrs)
    style_prop = ''
    if style_m and 'font-variation-settings' not in style_m.group(1):
        pairs = []
        for decl in style_m.group(1).split(';'):
            decl = decl.strip()
            if ':' in decl:
                k, v = decl.split(':', 1)
                pairs.append('%s:%s' % (camel(k.strip()), json.dumps(v.strip())))
        if pairs:
            style_prop = ' style={{%s}}' % ','.join(pairs)
    out = '<Icon name="%s"' % name
    if fill:
        out += ' fill'
    if classes:
        out += ' className="%s"' % classes
    out += style_prop + ' />'
    return out


def textarea_conv(m):
    attrs = m.group(1)
    body = m.group(2)
    return '<textarea%s defaultValue={%s} />' % (attrs, json.dumps(body))


def convert(inner):
    s = inner
    # 스크립트·주석 제거
    s = re.sub(r'<script[\s\S]*?</script>', '', s)
    s = re.sub(r'<!--[\s\S]*?-->', '', s)
    # 이벤트 핸들러 속성 제거 (페이지별 인터랙션은 클라이언트 컴포넌트로 이식)
    s = re.sub(r'\s+on\w+="[^"]*"', '', s)
    # textarea → defaultValue (속성 변환·이스케이프 전에 본문 캡처)
    s = re.sub(r'<textarea([^>]*)>([\s\S]*?)</textarea>', textarea_conv, s)
    # 텍스트 노드의 리터럴 중괄호·따옴표 이스케이프 (속성 값 내부는 제외)
    parts = re.split(r'(<[^>]+>)', s)
    def esc(t):
        return (t.replace('{', '{"{"}').replace('}', '{"}"}')
                 .replace('"', '&quot;').replace("'", '&apos;'))
    s = ''.join(p if p.startswith('<') else esc(p) for p in parts)
    # material-symbols-outlined 스팬 → <Icon/>
    s = re.sub(
        r'<span class="([^"]*material-symbols-outlined[^"]*)"([^>]*)>\s*([a-z0-9_]+)\s*</span>',
        icon_span, s)
    # 북마크 버튼 → BookmarkButton
    def bookmark_conv(m):
        btn_attrs = m.group(1)
        cls = re.search(r'className="([^"]*)"', btn_attrs)
        ic_cls = re.search(r'className="([^"]*)"', m.group(0))
        out = '<BookmarkButton'
        if cls:
            out += ' className="%s"' % cls.group(1)
        if ic_cls and ic_cls.group(1):
            out += ' iconClassName="%s"' % ic_cls.group(1)
        return out + ' />'
    s = re.sub(
        r'<button([^>]*)><Icon name="bookmark(_border)?"[^>]*/></button>',
        bookmark_conv, s)
    # 속성명 매핑
    def attr_conv(m):
        name = m.group(0).rstrip('=')
        if name in ATTR_MAP:
            return ATTR_MAP[name] + '='
        return m.group(0)
    s = re.sub(r'\b[a-zA-Z][a-zA-Z0-9_:-]*=', attr_conv, s)
    # style 문자열 → 객체 (아이콘 스팬 변환 후 남은 것)
    s = re.sub(r'style="([^"]*)"', style_to_obj, s)
    # checked → defaultChecked (radio/checkbox)
    s = re.sub(r'\bchecked="[^"]*"', 'defaultChecked', s)
    s = re.sub(r'\bchecked(?=[\s/>])', 'defaultChecked', s)
    # 숫자 전용 속성 → JSX number
    s = re.sub(r'\b(rows|cols|maxLength|minLength|size|tabIndex|start|colSpan|rowSpan|width|height)="(\d+)"', r'\1={\2}', s)
    # boolean 속성의 빈/문자열 값 → bare attribute
    s = re.sub(r'\b(disabled|required|multiple|autoFocus|readOnly|noValidate|formNoValidate|allowFullScreen|hidden|defaultChecked)="[^"]*"', r'\1', s)
    # selected on <option> → defaultValue 보존 어려우므로 data-selected로 유지
    s = re.sub(r'\bselected(?=[\s/>])', 'data-selected="true"', s)
    # disabled bare → 그대로 둠 (JSX boolean attr 유효)
    # void 엘리먼트 자기닫힘 + img alt 보장
    def void_conv(m):
        tag, attrs = m.group(1), m.group(2) or ''
        if tag == 'img' and not re.search(r'(?:^|\s)alt=', attrs):
            data_alt = re.search(r'data-alt="([^"]*)"', attrs)
            attrs += ' alt="%s"' % (data_alt.group(1) if data_alt else '')
        return '<' + tag + attrs + ' />'
    s = re.sub(r'<(' + VOID + r')(\s[^>]*?)?/?>', void_conv, s)
    # 들여쓰기 정리
    s = '\n'.join(line.rstrip() for line in s.splitlines() if line.strip())
    return s


def page_name(route):
    parts = [re.sub(r'[^a-zA-Z0-9]', '', p) for p in route.split('/')[1:-1]]
    return '_'.join(p for p in parts if p) or 'home'


def main():
    for html_file, route in PAGES.items():
        h = open(os.path.join(SRC, html_file), encoding='utf-8').read()
        mi = h.find('<main')
        mstart = h.find('>', mi) + 1
        mend = h.rfind('</main>')
        inner = h[mstart:mend]
        jsx = convert(inner)
        uses_icon = '<Icon ' in jsx
        uses_ring = '<ScoreRing' in jsx
        uses_bm = '<BookmarkButton' in jsx
        imports = []
        if uses_icon:
            imports.append('import Icon from "@/components/Icon";')
        if uses_ring:
            imports.append('import ScoreRing from "@/components/ScoreRing";')
        if uses_bm:
            imports.append('import BookmarkButton from "@/components/BookmarkButton";')
        name = ''.join(w.title() for w in page_name(route).split('_')) + 'Page'
        out = '\n'.join(imports) + '\n\nexport default function ' + name + '() {\n  return (\n    <>\n'
        out += '\n'.join('      ' + l for l in jsx.splitlines())
        out += '\n    </>\n  );\n}\n'
        dst = os.path.join(WEB, route)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, 'w', encoding='utf-8').write(out)
        print('%-28s → %s (%d lines)' % (html_file, route, out.count('\n')))


if __name__ == '__main__':
    main()
