import io
shell = io.open('_shell.html', encoding='utf-8').read()
FOOT = '</main></div></body></html>'

def build(active, content, fname):
    s = shell
    i = s.find('data-path="%s"' % active)
    a_start = s.rfind('<a class="', 0, i)
    s = s[:a_start+len('<a class="')] + 'bg-primary-container text-on-primary font-label-md shadow-sm ' + s[a_start+len('<a class="'):]
    s = s.replace('text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-body-md text-body-md" data-path="'+active, 'flex items-center gap-space-md px-space-md py-space-sm rounded-lg" data-path="'+active)
    io.open(fname, 'w', encoding='utf-8').write(s + content + FOOT)
    print(fname, 'written')

def cat(name, score, mx, pct, warn=False):
    bar = 'bg-error' if warn else 'bg-secondary'
    txt = 'text-error font-bold' if warn else 'text-on-surface font-semibold'
    return ('<div class="flex items-center gap-space-sm">'
      '<span class="w-28 font-label-sm text-label-sm text-on-surface-variant shrink-0">' + name + '</span>'
      '<div class="flex-1 bg-surface-container h-2.5 rounded-full"><div class="' + bar + ' h-full rounded-full" style="width:' + str(pct) + '%"></div></div>'
      '<span class="w-14 text-right font-code-sm text-[12px] ' + txt + '">' + str(score) + '/' + str(mx) + '</span></div>')

def kw(t, n, level):
    styles = {3:'bg-primary text-on-primary font-semibold',2:'bg-secondary-fixed text-on-secondary-fixed-variant',1:'bg-surface-container text-on-surface-variant',0:'bg-surface-container-highest text-outline border border-dashed border-outline'}
    return '<span class="px-2.5 py-1 rounded-lg ' + styles[level] + ' font-label-sm text-label-sm flex items-center gap-1">' + t + ' <span class="font-code-sm text-[10px]">' + str(n) + '</span></span>'

c16 = '''<div class="flex flex-col w-full gap-space-lg">
<section class="flex items-end justify-between">
  <div><span class="font-label-sm text-label-sm text-secondary font-bold tracking-wider">F-16 RESUME ANALYSIS · F-17 KEYWORD HEATMAP · F-28 CRITERIA</span>
  <h1 class="font-display-lg text-display-lg text-on-surface mt-1">자소서 분석 결과</h1>
  <p class="font-body-md text-body-md text-on-surface-variant mt-1">네이버 프론트엔드 신입 · 자기소개서 v3 · 방금 분석됨</p></div>
  <div class="flex gap-space-sm">
    <button class="px-space-lg py-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-high font-label-md text-label-md text-on-surface flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">download</span>PDF 다운로드</button>
    <button class="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-2 shadow-sm"><span class="material-symbols-outlined text-[18px]">edit</span>수정해서 다시 분석</button>
  </div>
</section>

<div class="grid grid-cols-12 gap-space-lg">
  <div class="col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col items-center justify-center">
    <span class="font-label-sm text-label-sm text-on-surface-variant mb-space-sm">종합 점수</span>
    <div class="relative w-36 h-36"><svg class="w-36 h-36 -rotate-90" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" fill="none" stroke="#e7eeff" stroke-width="3"/><circle cx="18" cy="18" r="15.5" fill="none" stroke="#1a4f8f" stroke-width="3" stroke-dasharray="74 100" stroke-linecap="round"/></svg><div class="absolute inset-0 flex flex-col items-center justify-center"><span class="font-display-lg text-[40px] text-primary font-bold leading-none">74</span><span class="font-label-sm text-label-sm text-on-surface-variant">/ 100</span></div></div>
    <span class="mt-space-sm px-space-md py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-bold">분석 완료</span>
    <p class="mt-space-sm font-body-sm text-body-sm text-on-surface-variant text-center">상위 32% · 평균(58점)보다 16점 높음</p>
  </div>
  <div class="col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
    <div class="flex items-center justify-between mb-space-md"><h2 class="font-headline-md text-headline-md text-on-surface">항목별 채점</h2><span class="px-space-md py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">rule</span>규칙 기반 분석</span></div>
    <div class="flex flex-col gap-space-sm">__CATS__</div>
    <p class="mt-space-sm font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[16px] text-error">flag</span>약점: 수치(근거·수치 부족), 협업 표현</p>
  </div>
</div>

<div class="grid grid-cols-2 gap-space-lg">
  <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm"><h3 class="font-headline-sm text-headline-sm text-tertiary flex items-center gap-2 mb-space-sm"><span class="material-symbols-outlined">check_circle</span>잘된 점</h3>
  <ul class="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface">
    <li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-tertiary shrink-0">check</span>React·TypeScript 등 직군 키워드 16/20점 반영</li>
    <li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-tertiary shrink-0">check</span>상황-행동-결과 STAR 서술 구조 안정적</li>
    <li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-tertiary shrink-0">check</span>분량 충실 — 문항당 710~720자로 기준 충족</li>
  </ul></div>
  <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm"><h3 class="font-headline-sm text-headline-sm text-error flex items-center gap-2 mb-space-sm"><span class="material-symbols-outlined">warning</span>보완할 점</h3>
  <ul class="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface">
    <li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-error shrink-0">priority_high</span>정량 수치 부족 — "개선했다" 대신 "응답시간 40% 단축"처럼 수치 제시</li>
    <li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-error shrink-0">priority_high</span>협업 경험 표현 약함 — 팀 프로젝트 역할·갈등 해결 경험 추가</li>
    <li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-error shrink-0">priority_high</span>"열심히" 등 진부 표현 3회 반복 — 구체 동사로 교체</li>
  </ul></div>
</div>

<div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
  <div class="flex items-center justify-between mb-space-md"><h2 class="font-headline-md text-headline-md text-on-surface">JD 키워드 히트맵</h2><span class="font-label-sm text-label-sm text-on-surface-variant">공고 요구 키워드 ↔ 자소서 매칭 횟수 (단어 경계 기준)</span></div>
  <div class="flex flex-wrap gap-space-sm">__KWS__</div>
  <div class="flex items-center gap-space-md mt-space-md pt-space-sm border-t border-surface-container font-label-sm text-label-sm text-on-surface-variant">
    <span>범례:</span>
    <span class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-surface-container-highest border border-dashed border-outline"></span>0회</span>
    <span class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-surface-container"></span>1회</span>
    <span class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-secondary-fixed"></span>2회</span>
    <span class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-primary"></span>3회+</span>
  </div>
</div>

<details class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm"><summary class="flex items-center justify-between cursor-pointer"><h2 class="font-headline-sm text-headline-sm text-on-surface">평가 기준 공개 — 이 점수는 이렇게 계산됩니다</h2><span class="material-symbols-outlined text-outline">expand_more</span></summary>
<div class="mt-space-md grid grid-cols-2 gap-space-md">
  <div><table class="w-full font-body-sm text-body-sm"><tbody>
    <tr class="border-b border-surface-container"><td class="py-1.5 text-on-surface">STAR 구조</td><td class="py-1.5 text-right font-code-sm text-primary font-bold">25점</td></tr>
    <tr class="border-b border-surface-container"><td class="py-1.5 text-on-surface">직군 키워드</td><td class="py-1.5 text-right font-code-sm text-primary font-bold">20점</td></tr>
    <tr class="border-b border-surface-container"><td class="py-1.5 text-on-surface">표현 / 수치</td><td class="py-1.5 text-right font-code-sm text-primary font-bold">15점 ×2</td></tr>
    <tr class="border-b border-surface-container"><td class="py-1.5 text-on-surface">분량 / 문장 길이</td><td class="py-1.5 text-right font-code-sm text-primary font-bold">10점 ×2</td></tr>
    <tr><td class="py-1.5 text-on-surface">협업</td><td class="py-1.5 text-right font-code-sm text-primary font-bold">5점</td></tr>
  </tbody></table></div>
  <div class="font-body-sm text-body-sm text-on-surface-variant flex flex-col gap-space-xs">
    <p><strong class="text-on-surface">'분석 불가' 판정:</strong> 단독 자모 비율 · 유효 단어 수 · 문자 비율이 기준 미달이면 분석을 거부합니다.</p>
    <p>모든 채점은 사전에 공개된 규칙으로 계산되며, 점수 산출 근거를 각 항목에서 확인할 수 있습니다.</p>
  </div>
</div>
</details>
</div>'''

cats = ''.join([
    cat('분량',10,10,100), cat('표현',11,15,73), cat('수치',8,15,53,True),
    cat('STAR 구조',19,25,76), cat('직군 키워드',16,20,80), cat('문장 길이',8,10,80), cat('협업',2,5,40,True)])
kws = ''.join([
    kw('React',5,3),kw('TypeScript',4,3),kw('Next.js',2,2),kw('GraphQL',0,0),kw('테스트 코드',1,1),
    kw('성능 최적화',2,2),kw('협업',0,0),kw('CI/CD',1,1),kw('웹 접근성',0,0),kw('REST API',3,3)])
c16 = c16.replace('__CATS__', cats).replace('__KWS__', kws)
build('resume-coaching', c16, 's16_analysis.html')
