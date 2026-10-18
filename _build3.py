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

def stat(icon, label, val, unit, sub, iconcls):
    return ('<div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">'
      '<div class="flex items-center justify-between"><span class="font-label-sm text-label-sm text-on-surface-variant">' + label + '</span>'
      '<span class="material-symbols-outlined text-[20px] ' + iconcls + '">' + icon + '</span></div>'
      '<div class="font-display-lg text-display-lg text-on-surface mt-1">' + val + '<span class="font-body-sm text-body-sm text-on-surface-variant">' + unit + '</span></div>'
      '<span class="font-label-sm text-label-sm text-on-surface-variant">' + sub + '</span></div>')

def soon(co, job, dd, score, red=False):
    badge = 'bg-error-container text-on-error-container' if red else 'bg-surface-container text-on-surface-variant'
    return ('<div class="flex items-center gap-space-sm bg-surface-container-lowest rounded-lg p-space-sm shadow-sm">'
      '<span class="px-2 py-0.5 rounded-full ' + badge + ' font-label-sm text-[11px] font-bold shrink-0">' + dd + '</span>'
      '<div class="min-w-0 flex-1"><span class="font-label-sm text-label-sm text-on-surface-variant block">' + co + '</span>'
      '<p class="font-body-sm text-body-sm font-semibold text-on-surface truncate">' + job + '</p></div>'
      '<span class="font-code-sm text-[12px] text-primary font-bold shrink-0">' + str(score) + '</span></div>')

def rec(logo_bg, init, co, job, tags, score, dd):
    return ('<div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs">'
      '<div class="flex items-center gap-space-sm"><div class="w-9 h-9 rounded-lg ' + logo_bg + ' flex items-center justify-center text-on-primary font-label-md text-label-md font-bold shrink-0">' + init + '</div>'
      '<div class="min-w-0 flex-1"><span class="font-label-sm text-label-sm text-on-surface-variant block">' + co + '</span><h3 class="font-body-md text-body-md font-semibold text-on-surface truncate">' + job + '</h3></div>'
      '<span class="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-code-sm text-[11px] font-bold shrink-0">매칭 ' + str(score) + '</span></div>'
      '<div class="flex flex-wrap gap-1">' + tags + '</div>'
      '<div class="flex items-center justify-between pt-1 border-t border-surface-container mt-1"><span class="font-label-sm text-[11px] text-error font-bold">' + dd + '</span><button class="font-label-sm text-label-sm text-secondary font-semibold">상세 →</button></div></div>')

tag = lambda t: '<span class="px-2 py-0.5 rounded bg-surface-container font-label-sm text-[10px] text-on-surface-variant">' + t + '</span>'

def mini(title, n, dot):
    return ('<div class="flex-1 bg-surface-container-lowest rounded-lg p-space-sm shadow-sm border-t-4 ' + dot + '">'
      '<span class="font-label-sm text-label-sm text-on-surface-variant block">' + title + '</span>'
      '<span class="font-headline-md text-headline-md text-on-surface">' + n + '</span></div>')

stats = ''.join([
    stat('send','지원 중','10','건','서류 준비 2 · 지원 완료 3 · 진행 5','text-secondary'),
    stat('task_alt','서류 통과','3','건','서류 합격률 46.2%','text-tertiary'),
    stat('groups','면접 예정','2','건','다음: 카카오 10.24 화상','text-primary'),
    stat('emoji_events','최종 합격','1','건','메쉬코리아 데이터 인턴','text-tertiary')])

soons = ''.join([
    soon('라인','Data Platform 엔지니어','D-5',78,True),
    soon('네이버','프론트엔드 신입','D-6',92,True),
    soon('토스뱅크','백엔드 엔지니어','D-7',83,False),
    soon('우아한형제들','백엔드 개발자','D-8',81,False)])

recs = ''.join([
    rec('bg-[#03c75a]','N','네이버','프론트엔드 개발자 (신입)', tag('React')+tag('TypeScript')+tag('Next.js'), 92, 'D-6'),
    rec('bg-[#fae100] text-[#3c1e1e]','카','카카오','백엔드 엔지니어', tag('Java')+tag('Spring')+tag('MySQL'), 88, 'D-9'),
    rec('bg-[#ff6f0f]','당','당근마켓','DevOps 엔지니어 (인턴)', tag('Docker')+tag('Kubernetes'), 92, 'D-14')])

minis = ''.join([
    mini('서류 준비','2','border-surface-container-highest'), mini('지원 완료','3','border-secondary'),
    mini('서류 합격','3','border-tertiary'), mini('면접 예정','2','border-primary'),
    mini('최종 합격','1','border-tertiary'), mini('불합격','2','border-outline')])

c10 = '''<div class="flex flex-col w-full gap-space-lg">
<section class="flex items-end justify-between">
  <div><span class="font-label-sm text-label-sm text-secondary font-bold tracking-wider">F-10 STUDENT DASHBOARD</span>
  <h1 class="font-display-lg text-display-lg text-on-surface mt-1">안녕하세요, 김민준 학생</h1>
  <p class="font-body-md text-body-md text-on-surface-variant mt-1">이번 주 새로 올라온 컴공 관련 공고 <strong class="text-primary font-bold">12건</strong> · 오늘도 좋은 하루 되세요.</p></div>
  <div class="bg-surface-container-lowest rounded-xl px-space-md py-3 shadow-sm w-72">
    <div class="flex items-center justify-between mb-1"><span class="font-label-sm text-label-sm text-on-surface-variant">프로필 완성도</span><span class="font-label-sm text-label-sm text-primary font-bold">85%</span></div>
    <div class="w-full bg-surface-container h-2 rounded-full"><div class="bg-primary h-full rounded-full" style="width:85%"></div></div>
    <span class="font-label-sm text-[11px] text-on-surface-variant">자격증·프로젝트를 더 입력하면 매칭 정확도가 올라갑니다</span>
  </div>
</section>

<section class="grid grid-cols-4 gap-space-md">__STATS__</section>

<div class="grid grid-cols-12 gap-space-lg">
  <section class="col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
    <div class="flex items-center justify-between mb-space-sm"><h2 class="font-headline-sm text-headline-sm text-on-surface">마감 임박 공고</h2><button class="font-label-sm text-label-sm text-secondary font-semibold">전체 보기 →</button></div>
    <div class="flex flex-col gap-space-sm">__SOONS__</div>
  </section>
  <section class="col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
    <div class="flex items-center justify-between mb-space-sm"><h2 class="font-headline-sm text-headline-sm text-on-surface">내 프로필 추천 공고</h2><span class="font-label-sm text-label-sm text-on-surface-variant">매칭 점수순</span></div>
    <div class="grid grid-cols-3 gap-space-sm">__RECS__</div>
  </section>
</div>

<div class="grid grid-cols-12 gap-space-lg">
  <section class="col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
    <div class="flex items-center justify-between mb-space-sm"><h2 class="font-headline-sm text-headline-sm text-on-surface">지원 현황 요약</h2><button class="font-label-sm text-label-sm text-secondary font-semibold">칸반으로 이동 →</button></div>
    <div class="flex gap-space-sm">__MINIS__</div>
  </section>
  <section class="col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
    <h2 class="font-headline-sm text-headline-sm text-on-surface mb-space-sm">이번 주 일정</h2>
    <div class="flex flex-col gap-space-xs font-body-sm text-body-sm">
      <div class="flex items-center gap-space-sm"><span class="w-14 shrink-0 font-label-sm text-label-sm text-on-surface-variant">10.22 목</span><span class="w-1.5 h-1.5 rounded-full bg-error shrink-0"></span><span class="text-on-surface">라인 공고 마감</span></div>
      <div class="flex items-center gap-space-sm"><span class="w-14 shrink-0 font-label-sm text-label-sm text-on-surface-variant">10.23 금</span><span class="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0"></span><span class="text-on-surface">자소서 v3 분석 리마인드</span></div>
      <div class="flex items-center gap-space-sm"><span class="w-14 shrink-0 font-label-sm text-label-sm text-on-surface-variant">10.24 토</span><span class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span><span class="text-on-surface">카카오 1차 면접 (화상)</span></div>
    </div>
  </section>
</div>
</div>'''

c10 = (c10.replace('__STATS__', stats).replace('__SOONS__', soons)
          .replace('__RECS__', recs).replace('__MINIS__', minis))
build('dashboard', c10, 's10_dashboard.html')
