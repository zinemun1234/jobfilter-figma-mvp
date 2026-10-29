# _build5.py — 구현(Next.js)과 정합화 갱신.
# 1) 공용 셸 외부 이미지(로고·프로필) → 로컬 아이콘/이니셜
# 2) 구 화면의 고정 수치 → 실구현 실측값으로 갱신
# 3) s13_bookmarks.html 신규 생성
# 모든 수치는 jobfilter-web의 실제 데이터 소스에서 계산된 값이다.
import io, re, glob, os

FOOT = '</main></div><script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script><script src="./app.js" defer></script></body></html>'
MAIN_RE = re.compile(r'(<main class="w-full pt-16 flex-1 bg-surface px-space-lg py-space-lg">).*(</main>)', re.S)

def read(f): return io.open(f, encoding='utf-8').read()
def write(f, s):
    io.open(f, 'w', encoding='utf-8').write(s)
    print('  updated', f)

def swap(fname, pairs):
    s = read(fname)
    for old, new in pairs:
        assert old in s, f'{fname}: NOT FOUND -> {old[:80]}'
        s = s.replace(old, new, 1)
    write(fname, s)

def replace_content(fname, content):
    s = read(fname)
    s2, n = MAIN_RE.subn(lambda m: m.group(1) + '\n' + content + '\n' + m.group(2), s, count=1)
    assert n == 1, fname
    write(fname, s2)

# ============ 1. 외부 이미지 제거 — 전체 생성 파일 + 셸 ============
LOGO_IMG = re.compile(r'<img alt="JobFilter Logo"[^>]*>')
LOGO_NEW = '<div class="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-[20px]">filter_alt</span></div>'
PROF_IMG = re.compile(r'<img alt="Profile"[^>]*>')
PROF_NEW = '<div title="김민준" class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md text-label-md font-bold select-none">김</div>'
ADVISOR_IMG = re.compile(r'<img class="w-12 h-12 rounded-full object-cover"[^>]*>')
ADVISOR_NEW = '<div class="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-headline-sm font-bold shrink-0">박</div>'

print('[1] 외부 이미지 → 로컬 아이콘/이니셜')
for f in glob.glob('*.html'):
    s = read(f)
    n = len(LOGO_IMG.findall(s)) + len(PROF_IMG.findall(s)) + len(ADVISOR_IMG.findall(s))
    if not n: continue
    s = LOGO_IMG.sub(LOGO_NEW, s)
    s = PROF_IMG.sub(PROF_NEW, s)
    s = ADVISOR_IMG.sub(ADVISOR_NEW, s)
    write(f, s)

# ============ 2. s81 학과 통계 — 칸반 시드 실측 집계 ============
# SEED 13장: applied+ 11 · screened+ 6 · interview+ 3 · offer 1 · 준비/불합격 4
# TOP5: 카카오 2/2/0/88 · 네이버 1/1/0/92 · 메쉬코리아 1/1/1/86 · 토스뱅크 1/1/0/83 · 우아한형제들 1/0/0/81
def funnel(label, count, pct, color, textcls, note):
    return ('<div class="flex items-center gap-space-md">'
      '<span class="w-24 font-label-sm text-label-sm text-on-surface-variant text-right">' + label + '</span>'
      '<div class="flex-1 h-9 bg-surface-container rounded-lg overflow-hidden"><div class="h-full ' + color + ' flex items-center px-space-sm" style="width:' + str(max(pct,4)) + '%"><span class="font-label-sm text-label-sm ' + textcls + ' font-bold">' + str(count) + '건</span></div></div>'
      '<span class="w-16 font-code-sm text-[11px] text-on-surface-variant">' + note + '</span></div>')

def grade(label, n, pct, color):
    return ('<div><div class="flex justify-between font-label-sm text-label-sm mb-1"><span class="text-on-surface">' + label + '</span><span class="text-on-surface-variant">' + str(n) + '명</span></div>'
      '<div class="h-2 bg-surface-container rounded-full"><div class="h-full ' + color + ' rounded-full" style="width:' + str(pct) + '%"></div></div></div>')

def trow(name, ap, docs, fin, match, last=False):
    b = '' if last else 'border-b border-surface-container '
    return ('<tr class="' + b + '"><td class="px-space-lg py-space-sm font-semibold text-on-surface">' + name + '</td>'
      '<td class="text-center px-space-md py-space-sm text-on-surface">' + str(ap) + '</td>'
      '<td class="text-center px-space-md py-space-sm text-on-surface">' + str(docs) + '</td>'
      '<td class="text-center px-space-md py-space-sm text-tertiary font-bold">' + str(fin) + '</td>'
      '<td class="px-space-md py-space-sm"><div class="flex items-center gap-space-xs"><div class="w-16 bg-surface-container h-1.5 rounded-full"><div class="bg-primary h-full rounded-full" style="width:' + str(match) + '%"></div></div><span class="font-code-sm text-[11px] text-on-surface-variant">' + str(match) + '</span></div></td></tr>')

def dwell(label):
    return ('<div class="flex justify-between"><span class="text-on-surface">' + label + '</span>'
      '<span class="font-code-sm text-code-sm text-primary font-bold">—</span></div>')

c81 = '''<div class="flex flex-col w-full gap-space-lg">
<section class="flex items-end justify-between">
  <div><span class="font-label-sm text-label-sm text-secondary font-bold tracking-wider">F-81 DEPARTMENT INSIGHT · IMP-05</span>
  <h1 class="font-display-lg text-display-lg text-on-surface mt-1">학과 취업 통계 · 2026년 2학기</h1></div>
  <div class="flex items-center gap-space-sm">
    <span class="px-2 py-1 rounded-lg bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">컴퓨터공학과</span>
    <button class="px-space-lg py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-low"><span class="material-symbols-outlined text-[18px]">download</span>엑셀 내보내기</button>
  </div>
</section>
<section class="grid grid-cols-4 gap-space-sm">
  <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm"><span class="font-label-sm text-label-sm text-on-surface-variant">학과 총 지원</span><div class="font-display-lg text-display-lg text-on-surface">11<span class="font-body-sm text-body-sm text-on-surface-variant">건</span></div></div>
  <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm"><span class="font-label-sm text-label-sm text-on-surface-variant">서류 전환율</span><div class="font-display-lg text-display-lg text-primary">54.5<span class="font-body-sm text-body-sm text-on-surface-variant">%</span></div></div>
  <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm"><span class="font-label-sm text-label-sm text-on-surface-variant">면접 전환율</span><div class="font-display-lg text-display-lg text-secondary">27.3<span class="font-body-sm text-body-sm text-on-surface-variant">%</span></div></div>
  <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm"><span class="font-label-sm text-label-sm text-on-surface-variant">최종 합격률</span><div class="font-display-lg text-display-lg text-tertiary font-bold">9.1<span class="font-body-sm text-body-sm text-on-surface-variant">%</span></div></div>
</section>
<section class="grid grid-cols-3 gap-space-lg">
  <div class="col-span-2 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
    <h2 class="font-headline-sm text-headline-sm text-on-surface mb-space-md">지원 → 합격 전환 퍼널</h2>
    <div class="flex flex-col gap-space-sm">''' + \
    funnel('지원', 11, 100, 'bg-primary', 'text-on-primary', '100%') + \
    funnel('서류 합격', 6, 54.5, 'bg-secondary', 'text-on-primary', '54.5%') + \
    funnel('면접 예정', 3, 27.3, 'bg-primary-container', 'text-on-primary', '27.3%') + \
    funnel('최종 합격', 1, 9.1, 'bg-tertiary-container', 'text-on-primary', '9.1%') + \
    funnel('준비/불합격', 4, 30.8, 'bg-surface-container-highest', 'text-on-surface-variant', '—') + '''
    </div>
    <p class="font-label-sm text-[10px] text-outline mt-space-md">원천 데이터: F-14 StatusHistory — 상태 전이 0건이 기록되어 실시간 집계됩니다.</p>
  </div>
  <div class="flex flex-col gap-space-lg">
    <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
      <h2 class="font-headline-sm text-headline-sm text-on-surface mb-space-md">학년별 지원 분포</h2>
      <div class="flex flex-col gap-space-sm">''' + \
      grade('4학년', 11, 100, 'bg-primary') + \
      grade('3학년', 11, 100, 'bg-secondary') + \
      grade('2학년', 2, 18, 'bg-tertiary') + '''
      </div>
      <p class="font-label-sm text-[10px] text-outline mt-space-sm">학과 코호트 24명 기준</p>
    </div>
    <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
      <h2 class="font-headline-sm text-headline-sm text-on-surface mb-space-sm">평균 단계 체류</h2>
      <div class="flex flex-col gap-space-xs font-body-sm text-body-sm">''' + \
      dwell('지원 → 서류 결과') + dwell('서류 → 면접') + dwell('면접 → 최종') + '''
      </div>
      <p class="font-label-sm text-[10px] text-outline mt-space-sm">칸반에서 카드를 단계 이동하면 전이 간 체류시간이 자동 집계됩니다.</p>
    </div>
    <div class="rounded-xl bg-surface-container-low border border-outline-variant p-space-md flex items-start gap-space-md">
      <span class="material-symbols-outlined text-on-surface-variant mt-0.5">verified_user</span>
      <p class="font-body-sm text-body-sm text-on-surface-variant">개인 식별 없는 집계만 표시됩니다. 학생 수 <strong>n&lt;5</strong>인 집단(2학년 인턴 유형 등)은 자동 마스킹됩니다.</p>
    </div>
  </div>
</section>
<section class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
  <div class="px-space-lg py-space-md border-b border-surface-container"><h2 class="font-headline-sm text-headline-sm text-on-surface">인기 지원 기업 TOP 5</h2></div>
  <table class="w-full">
    <thead><tr class="border-b border-surface-container">
      <th class="text-left px-space-lg py-space-sm font-label-sm text-label-sm text-on-surface-variant">기업</th>
      <th class="text-center px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant">지원</th>
      <th class="text-center px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant">서류 합격</th>
      <th class="text-center px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant">최종 합격</th>
      <th class="text-left px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant">평균 매칭</th>
    </tr></thead>
    <tbody class="font-body-sm text-body-sm">''' + \
    trow('카카오', 2, 2, 0, 88) + trow('네이버', 1, 1, 0, 92) + trow('메쉬코리아', 1, 1, 1, 86) + trow('토스뱅크', 1, 1, 0, 83) + trow('우아한형제들', 1, 0, 0, 81, True) + '''
    </tbody>
  </table>
</section>
</div>'''
print('[2] s81_dept_stats.html')
replace_content('s81_dept_stats.html', c81)

# ============ 3. s41 승인 큐 — 시드 실측 (5/2/0/7), 정확도 100% ============
print('[3] s41_admin_review.html')
swap('s41_admin_review.html', [
  ('게시 중</span><div class="font-display-lg text-display-lg text-on-surface">47<',
   '게시 중</span><div class="font-display-lg text-display-lg text-on-surface">2<'),
  ('반려</span><div class="font-display-lg text-display-lg text-error">2<',
   '반려</span><div class="font-display-lg text-display-lg text-error">0<'),
  ('자동 분류 정확도</span><div class="font-display-lg text-display-lg text-tertiary">86<span class="font-body-sm text-body-sm text-on-surface-variant">%</span></div><span class="font-label-sm text-[11px] text-on-surface-variant">정답셋 기준 (목표 ≥80%)</span>',
   '자동 분류 정확도</span><div class="font-display-lg text-display-lg text-tertiary">100<span class="font-body-sm text-body-sm text-on-surface-variant">%</span></div><span class="font-label-sm text-[11px] text-on-surface-variant">골드셋 33/33 실측 (목표 ≥80%)</span>'),
  ('게시 중 <span class="font-code-sm text-[11px]">47</span>',
   '게시 중 <span class="font-code-sm text-[11px]">2</span>'),
  ('반려 <span class="font-code-sm text-[11px]">2</span>',
   '반려 <span class="font-code-sm text-[11px]">0</span>'),
  ('전체 <span class="font-code-sm text-[11px]">54</span>',
   '전체 <span class="font-code-sm text-[11px]">7</span>'),
])

# ============ 4. s33 지원자 — 코호트24 × 네이버 프론트엔드 실측 ============
def arow(name, yr, score, date, status, last=False):
    scls = 'text-tertiary' if score >= 80 else ('text-secondary' if score >= 50 else 'text-on-surface-variant')
    stcls = {'서류 합격': 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
             '서류 검토': 'bg-secondary-fixed text-on-secondary-fixed-variant',
             '불합격': 'bg-surface-container-highest text-on-surface-variant'}[status]
    b = '' if last else 'border-b border-surface-container '
    return ('<tr class="' + b + 'hover:bg-surface-container-low transition-colors">'
      '<td class="py-3 px-3 font-body-sm text-body-sm font-semibold text-on-surface">' + name + '</td>'
      '<td class="py-3 px-3 font-body-sm text-body-sm text-on-surface-variant">컴퓨터공학과 ' + str(yr) + '학년</td>'
      '<td class="py-3 px-3"><span class="font-code-sm text-[13px] font-bold ' + scls + '">' + str(score) + '</span></td>'
      '<td class="py-3 px-3 font-code-sm text-[12px] text-on-surface-variant">' + date + '</td>'
      '<td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full ' + stcls + ' font-label-sm text-[11px] font-bold">' + status + '</span></td>'
      '<td class="py-3 px-3"><button class="px-3 py-1 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm">자소서 보기</button></td></tr>')

rows33 = ''.join([
    arow('이서연', 4, 80, '10.11', '서류 합격'),
    arow('이승우', 3, 80, '10.15', '서류 합격'),
    arow('서연우', 3, 60, '10.17', '서류 검토'),
    arow('배수아', 4, 60, '10.15', '서류 검토'),
    arow('신예린', 3, 40, '10.13', '불합격'),
    arow('김민준', 4, 20, '10.10', '불합격'),
    arow('박준혁', 4, 20, '10.12', '불합격'),
    arow('최지우', 4, 20, '10.13', '불합격', True),
])

c33 = '''<div class="flex flex-col w-full gap-space-lg">
<section class="flex items-end justify-between">
  <div><span class="font-label-sm text-label-sm text-secondary font-bold tracking-wider">F-33 COMPANY APPLICANTS</span>
  <h1 class="font-display-lg text-display-lg text-on-surface mt-1">지원자 목록</h1>
  <p class="font-body-md text-body-md text-on-surface-variant mt-1"><strong>본사가 등록한 공고</strong>의 지원자만 표시됩니다 (역할 분리 N-01)</p></div>
  <button class="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-2 shadow-sm"><span class="material-symbols-outlined text-[18px]">download</span>엑셀보내기</button>
</section>
<section class="flex items-center gap-space-sm">
  <span class="font-label-sm text-label-sm text-on-surface-variant">공고 선택:</span>
  <div class="relative">
    <button class="appearance-none px-space-md py-2 pr-9 rounded-lg bg-surface-container-lowest border border-surface-container-high font-label-md text-label-md text-on-surface">네이버 — 프론트엔드 개발자 (신입)</button>
    <span class="material-symbols-outlined text-[18px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
  </div>
  <div class="ml-auto flex gap-space-sm font-label-sm text-label-sm">
    <span class="px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-sm text-on-surface-variant">총 지원자 <strong class="text-on-surface">24</strong></span>
    <span class="px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-sm text-on-surface-variant">검토 중 <strong class="text-secondary">2</strong></span>
    <span class="px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-sm text-on-surface-variant">서류 합격 <strong class="text-tertiary">2</strong></span>
    <span class="px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-sm text-on-surface-variant">불합격 <strong>20</strong></span>
  </div>
</section>
<section class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
  <table class="w-full">
    <thead><tr class="border-b-2 border-surface-container-high font-label-sm text-label-sm text-on-surface-variant text-left">
      <th class="py-2 px-3">지원자</th><th class="py-2 px-3">학과 · 학년</th><th class="py-2 px-3">매칭 점수</th><th class="py-2 px-3">지원일</th><th class="py-2 px-3">전형 상태</th><th class="py-2 px-3">자소서</th>
    </tr></thead>
    <tbody>''' + rows33 + '''</tbody>
  </table>
  <div class="flex items-center justify-between mt-space-md pt-space-sm border-t border-surface-container">
    <span class="font-label-sm text-label-sm text-on-surface-variant">1~8 / 24명</span>
    <div class="flex gap-1"><button class="w-8 h-8 rounded-lg bg-primary text-on-primary font-label-md">1</button><button class="w-8 h-8 rounded-lg hover:bg-surface-container font-label-md text-on-surface-variant">2</button><button class="w-8 h-8 rounded-lg hover:bg-surface-container font-label-md text-on-surface-variant">3</button></div>
  </div>
  <p class="mt-space-sm font-label-sm text-[10px] text-outline">매칭 점수는 학과 코호트 보유 스킬과 공고 요구 스킬을 matchJobWith 공식으로 실시간 계산합니다.</p>
</section>
</div>'''
print('[4] s33_applicants.html')
replace_content('s33_applicants.html', c33)

# ============ 5. s42 업로드 — sample_jobs.xlsx 실제 파싱 결과 ============
def urow(idx, co, initial, loc, title, deadline, verdict, fit, tags, excluded=False):
    taghtml = ''.join('<span class="px-space-xs py-0.5 rounded bg-surface-container text-primary font-code-sm text-code-sm">' + t + '</span>' for t in tags[:4])
    if len(tags) > 4: taghtml += '<span class="font-code-sm text-code-sm text-on-surface-variant">+' + str(len(tags)-4) + '</span>'
    if not tags: taghtml = '<span class="font-body-sm text-body-sm text-outline">인식 없음</span>'
    if excluded:
        chip = '<span class="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm"><span class="material-symbols-outlined text-[16px]">cancel</span><span>제외 — ' + verdict + '</span></span>'
        act = '<span class="font-label-sm text-label-sm text-outline">자동 제외</span>'
        confcls = 'text-on-surface-variant bg-surface-container'
        conflv = 'Low' if fit < 40 else 'Mid'
    else:
        ok = fit >= 70
        chip = ('<span class="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full font-label-sm text-label-sm ' +
                ('bg-tertiary-container text-on-tertiary-container' if ok else 'bg-secondary-fixed text-on-secondary-fixed-variant') + '">'
                '<span class="material-symbols-outlined text-[16px]">' + ('check_circle' if ok else 'pending') + '</span>'
                '<span>' + ('적합 ✓ ' if ok else '검수 ') + str(fit) + '% — ' + verdict + '</span></span>')
        act = ('<button class="inline-flex items-center gap-space-xs px-space-md py-1 rounded-lg font-label-md text-label-md ' +
               ('bg-tertiary-container text-on-tertiary-container"><span class="material-symbols-outlined text-[16px]">verified_user</span>승인됨' if ok
                else 'bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-[16px]">pending</span>보류됨') + '</button>')
        confcls = 'text-tertiary bg-tertiary-fixed' if fit >= 70 else ('text-secondary bg-secondary-fixed' if fit >= 40 else 'text-on-surface-variant bg-surface-container')
        conflv = 'High' if fit >= 70 else ('Mid' if fit >= 40 else 'Low')
    rowcls = 'hover:bg-surface-container-low transition-colors' + (' opacity-50' if excluded else '')
    return ('<tr class="' + rowcls + '">'
      '<td class="py-space-md px-space-lg text-center font-code-sm text-code-sm text-on-surface-variant">' + str(idx) + '</td>'
      '<td class="py-space-md px-space-md align-middle"><div class="flex items-center gap-space-sm">'
      '<div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-label-md text-primary font-bold">' + initial + '</div>'
      '<div class="flex flex-col min-w-0"><span class="font-label-md text-label-md text-on-surface truncate font-semibold">' + co + '</span>'
      '<span class="font-code-sm text-code-sm text-on-surface-variant">' + loc + '</span></div></div></td>'
      '<td class="py-space-md px-space-md align-middle"><div class="flex flex-col"><span class="font-label-md text-label-md text-on-surface">' + title + '</span>'
      '<span class="font-body-sm text-body-sm text-on-surface-variant">마감 ' + deadline + '</span></div></td>'
      '<td class="py-space-md px-space-md align-middle">' + chip + '</td>'
      '<td class="py-space-md px-space-md align-middle"><div class="flex flex-wrap gap-space-xs">' + taghtml + '</div></td>'
      '<td class="py-space-md px-space-md align-middle text-center"><span class="font-code-sm text-code-sm font-bold px-space-sm py-0.5 rounded ' + confcls + '">' + str(fit) + '% ' + conflv + '</span></td>'
      '<td class="py-space-md px-space-lg align-middle text-right">' + act + '</td></tr>')

rows42 = ''.join([
    urow(1, '카카오엔터프라이즈', '카', '판교', '클라우드 플랫폼 인프라 개발', '2026-12-31', '스킬 3종 — 검수 필요', 66, ['Kubernetes','Docker','Go']),
    urow(2, '네이버클라우드', '네', '성남', '분산 스토리지 백엔드 엔지니어', '2026-11-30', '컴공 스킬 5종 인식', 98, ['분산 스토리지','C++','Linux','분산 시스템','Raft']),
    urow(3, '현대오토에버', '현', '서울', '모빌리티 클라우드 보안 관제', '2026-11-20', '스킬 1종 — 검수 필요', 32, ['AWS']),
    urow(4, '멋쟁이사자처럼', '멋', '서울', '교육 운영 매니저', '2026-11-15', '스킬 미인식 — 검수 필요', 0, []),
    urow(5, '네이버', '네', '성남', '프론트엔드 개발자 (신입)', '2026-11-25', '기등록 중복', 66, ['React','TypeScript','Next.js'], True),
    urow(6, '삼성SDS', '삼', '서울', '데이터 파이프라인 엔지니어', '2020-01-01', '마감 경과', 83, ['Spark','Airflow','SQL','Python'], True),
    urow(7, '카카오', '카', '판교', '클라우드 백엔드 개발자 (신입)', '2026-12-01', '스킬 3종 — 검수 필요', 66, ['Java','Spring Boot','MySQL']),
    urow(8, 'LINE+', 'L', '성남', '메시징 플랫폼 백엔드', '2026-11-28', '컴공 스킬 5종 인식', 98, ['Java','Kotlin','Redis','Kafka','분산 시스템']),
])

c42 = '''<div class="flex flex-col w-full gap-space-lg">
<div class="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md mb-space-lg">
<div class="flex flex-col gap-space-xs">
<div class="flex items-center gap-space-sm text-secondary">
<span class="material-symbols-outlined text-[20px]">dataset</span>
<span class="font-label-md text-label-md tracking-wider uppercase">F-42 학과 취업지원 관리자 워크벤치</span>
</div>
<h1 class="font-display-lg text-display-lg text-on-surface tracking-tight">공고 대량 등록 (일괄 업로드)</h1>
<p class="font-body-md text-body-md text-on-surface-variant max-w-3xl">
        학과 산학협력 및 잡포털 엑셀/CSV 데이터 자동 파싱 및 컴공 학과 적합도 자동 분류 엔진
      </p>
</div>
<div class="flex items-center gap-space-sm self-start lg:self-auto">
<span class="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md">
<span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
        규칙 기반 분석 엔진 가동 중
      </span>
<button class="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container-low text-primary hover:bg-surface-container transition-colors font-label-md text-label-md" onclick="alert('분류 규칙 사전 설정은 F-43 키워드 사전에서 확인합니다.')">
<span class="material-symbols-outlined text-[18px]">tune</span>
        분류 규칙 설정
      </button>
</div>
</div>
<div class="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-xl">
<div class="grid grid-cols-1 md:grid-cols-4 gap-space-md relative">
<div class="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container-low">
<div class="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-headline-sm text-headline-sm">
<span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</div>
<div class="flex flex-col min-w-0">
<span class="font-label-sm text-label-sm text-tertiary uppercase">Step 01</span>
<span class="font-label-md text-label-md text-on-surface truncate">파일 업로드</span>
<span class="font-code-sm text-code-sm text-on-surface-variant truncate">sample_jobs.xlsx</span>
</div>
</div>
<div class="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container-low">
<div class="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-headline-sm text-headline-sm">
<span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</div>
<div class="flex flex-col min-w-0">
<span class="font-label-sm text-label-sm text-tertiary uppercase">Step 02</span>
<span class="font-label-md text-label-md text-on-surface truncate">파싱 데이터 미리보기</span>
<span class="font-code-sm text-code-sm text-on-surface-variant truncate">8건 행 구문 분석 완료</span>
</div>
</div>
<div class="flex items-center gap-space-md p-space-sm rounded-lg bg-primary text-on-primary shadow-md">
<div class="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-headline-sm text-headline-sm font-bold">
          3
        </div>
<div class="flex flex-col min-w-0">
<span class="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">현재 검수 단계 ★</span>
<span class="font-label-md text-label-md text-on-primary truncate font-bold">컴공 적합도 및 태그 검수</span>
<span class="font-code-sm text-code-sm text-primary-fixed truncate">규칙 매칭 · 필터링</span>
</div>
</div>
<div class="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container text-on-surface-variant opacity-75">
<div class="w-10 h-10 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-headline-sm text-headline-sm font-semibold">
          4
        </div>
<div class="flex flex-col min-w-0">
<span class="font-label-sm text-label-sm text-outline uppercase">Step 04</span>
<span class="font-label-md text-label-md text-on-surface truncate">일괄 등록 완료</span>
<span class="font-code-sm text-code-sm text-outline truncate">학생 공고 피드 발행 대기</span>
</div>
</div>
</div>
</div>
<div class="grid grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-xl">
<div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
<div class="flex items-center justify-between">
<span class="font-label-md text-label-md text-on-surface-variant">총 파싱 공고</span>
<span class="material-symbols-outlined text-secondary text-[24px]">folder_zip</span>
</div>
<div class="mt-space-md">
<div class="flex items-baseline gap-space-xs">
<span class="font-display-lg text-display-lg text-on-surface">8</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">건</span>
</div>
<div class="mt-space-xs flex items-center gap-space-xs text-on-surface-variant font-code-sm text-code-sm">
<span>Excel 시트 인덱싱 완료</span>
</div>
</div>
<div class="w-full bg-surface-container h-1.5 rounded-full mt-space-md overflow-hidden">
<div class="bg-primary-container h-full w-full"></div>
</div>
</div>
<div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
<div class="flex items-center justify-between">
<span class="font-label-md text-label-md text-on-surface-variant">유효 데이터 (등록 대상)</span>
<span class="material-symbols-outlined text-tertiary-container text-[24px]">verified</span>
</div>
<div class="mt-space-md">
<div class="flex items-baseline gap-space-xs">
<span class="font-display-lg text-display-lg text-tertiary font-bold">6</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">건 / 75.0%</span>
</div>
<div class="mt-space-xs flex items-center gap-space-xs text-tertiary font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[16px]">check_circle</span>
<span>중복·마감경과 제외 통과</span>
</div>
</div>
<div class="w-full bg-surface-container h-1.5 rounded-full mt-space-md overflow-hidden">
<div class="bg-tertiary-container h-full" style="width: 75%;"></div>
</div>
</div>
<div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
<div class="flex items-center justify-between">
<span class="font-label-md text-label-md text-on-surface-variant">기등록 중복 제외</span>
<span class="material-symbols-outlined text-outline text-[24px]">content_copy</span>
</div>
<div class="mt-space-md">
<div class="flex items-baseline gap-space-xs">
<span class="font-display-lg text-display-lg text-on-surface">1</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">건</span>
</div>
<div class="mt-space-xs flex items-center gap-space-xs text-on-surface-variant font-code-sm text-code-sm">
<span>기업+공고명 일치</span>
</div>
</div>
<div class="w-full bg-surface-container h-1.5 rounded-full mt-space-md overflow-hidden">
<div class="bg-outline h-full" style="width: 12.5%;"></div>
</div>
</div>
<div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
<div class="flex items-center justify-between">
<span class="font-label-md text-label-md text-on-surface-variant">마감일 경과 제외</span>
<span class="material-symbols-outlined text-error text-[24px]">event_busy</span>
</div>
<div class="mt-space-md">
<div class="flex items-baseline gap-space-xs">
<span class="font-display-lg text-display-lg text-error">1</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">건</span>
</div>
<div class="mt-space-xs flex items-center gap-space-xs text-error font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[16px]">priority_high</span>
<span>접수 마감 기한 도과</span>
</div>
</div>
<div class="w-full bg-surface-container h-1.5 rounded-full mt-space-md overflow-hidden">
<div class="bg-error h-full" style="width: 12.5%;"></div>
</div>
</div>
</div>
<div class="bg-surface-container-low rounded-xl p-space-md mb-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
<div class="flex items-center gap-space-md">
<div class="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
<span class="material-symbols-outlined text-[20px]">psychology_alt</span>
</div>
<div class="flex flex-col">
<span class="font-label-md text-label-md text-on-surface font-semibold">학과 커리큘럼 규칙 매칭 분석 결과 요약</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">
          스킬 사전 201개 키워드(표준 88+별칭)를 대조하여 적합도를 산출했습니다 — sample_jobs.xlsx
        </span>
</div>
</div>
<div class="flex items-center gap-space-xs font-code-sm text-code-sm text-secondary bg-surface-container-lowest px-space-md py-space-xs rounded-lg">
<span class="material-symbols-outlined text-[16px]">policy</span>
<span>적합도 기준선: 70% 이상 자동 승인</span>
</div>
</div>
<div class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-space-xl">
<div class="p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md">
<div class="flex items-center gap-space-md">
<span class="font-headline-sm text-headline-sm text-on-surface">컴공 학과 적합도 &amp; 직무 태그 검수 워크벤치</span>
<span class="px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">
          전체 8건 · 승인 2건
        </span>
</div>
<button class="px-space-md py-space-xs rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-label-md text-label-md flex items-center gap-space-xs">
<span class="material-symbols-outlined text-[18px]">refresh</span>
          다른 파일
        </button>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left">
<thead>
<tr class="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
<th class="py-space-md px-space-lg w-12 text-center">#</th>
<th class="py-space-md px-space-md w-44">기업명</th>
<th class="py-space-md px-space-md">공고명</th>
<th class="py-space-md px-space-md w-56">컴공 적합도 판정 (규칙 기반)</th>
<th class="py-space-md px-space-md">자동 추출 직무 기술 태그</th>
<th class="py-space-md px-space-md w-24 text-center">신뢰도</th>
<th class="py-space-md px-space-lg w-32 text-right">승인</th>
</tr>
</thead>
<tbody class="text-on-surface font-body-md text-body-md">''' + rows42 + '''</tbody>
</table>
</div>
<div class="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm">
<div class="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
<span class="material-symbols-outlined text-[18px]">info</span>
<span>전체 8건 표시 — 유효 6건 · 자동 제외 2건 (중복 1 · 마감 경과 1)</span>
</div>
<div class="flex items-center gap-space-xs">
<span class="font-code-sm text-code-sm text-on-surface-variant mr-space-sm">Page 1 of 1</span>
<button class="w-8 h-8 rounded flex items-center justify-center bg-surface-container text-outline hover:text-on-surface disabled:opacity-50" disabled="">
<span class="material-symbols-outlined text-[18px]">chevron_left</span>
</button>
<button class="w-8 h-8 rounded flex items-center justify-center bg-surface-container text-outline hover:text-on-surface disabled:opacity-50" disabled="">
<span class="material-symbols-outlined text-[18px]">chevron_right</span>
</button>
</div>
</div>
</div>
<div class="sticky bottom-0 bg-surface/90 backdrop-blur-md border-t border-surface-container py-space-md -mx-space-lg px-space-lg flex items-center justify-between">
<div class="flex items-center gap-space-md">
<span class="font-label-sm text-label-sm text-on-surface-variant">2건 승인됨 (전체 6건 중)</span>
</div>
<div class="flex items-center gap-space-sm">
<button class="px-space-lg py-2.5 rounded-lg border border-surface-container-high font-label-md text-label-md text-on-surface">분류 규칙 설정</button>
<button class="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-md flex items-center gap-2">
<span class="material-symbols-outlined text-[18px]">playlist_add_check</span>승인 항목 일괄 게시
</button>
</div>
</div>
</div>'''
print('[5] s42_admin.html')
replace_content('s42_admin.html', c42)

# ============ 6. s27 프로필 — 실측 동기화/레이더/백분위 ============
print('[6] s27_profile.html')
swap('s27_profile.html', [
  ('실시간 연동 가동 중', '프로필 저장 기반 실시간 매칭'),
  ('<span>v2.4 Live Sync</span>', '<span>로컬 프로필 동기화</span>'),
  ('''<button class="px-space-md py-2 rounded-lg bg-surface-container-low text-secondary hover:bg-surface-container text-body-sm font-label-md transition-colors flex items-center gap-1 self-start md:self-center" type="button">
<span class="material-symbols-outlined text-[18px]">verified</span>
<span>데이터 무결성 검사</span>
</button>''',
   '''<span class="px-space-md py-2 rounded-lg bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm self-start md:self-center flex items-center gap-1">
<span class="material-symbols-outlined text-[18px] text-secondary">verified</span>
스킬 11/11 · Github 미연동
</span>'''),
  ('마지막 동기화: 오늘 14:22', '마지막 저장: 아직 없음'),
  ('CS Top 50 공고 기준', '등록 공고 7건 기준'),
  # 레이더 — 6축 보유율 실측 (언어14%·백엔드26%·인프라29%·데이터0%·프론트0%·도메인0%, 최소 0.12)
  ('<polygon fill="currentColor" fill-opacity="0.25" points="100,26 168,64 148,132 100,165 40,135 34,60" stroke="currentColor" stroke-width="2"></polygon>',
   '<polygon fill="currentColor" fill-opacity="0.25" points="100.0,88.6 118.2,89.5 119.8,111.4 100.0,109.6 91.7,104.8 91.7,95.2" stroke="currentColor" stroke-width="2"></polygon>'),
  ('<circle cx="100" cy="26" fill="currentColor" r="3"></circle>', '<circle cx="100" cy="88.6" fill="currentColor" r="3"></circle>'),
  ('<circle cx="168" cy="64" fill="currentColor" r="3"></circle>', '<circle cx="118.2" cy="89.5" fill="currentColor" r="3"></circle>'),
  ('<circle cx="148" cy="132" fill="currentColor" r="3"></circle>', '<circle cx="119.8" cy="111.4" fill="currentColor" r="3"></circle>'),
  ('<circle cx="100" cy="165" fill="currentColor" r="3"></circle>', '<circle cx="100" cy="109.6" fill="currentColor" r="3"></circle>'),
  ('<circle cx="40" cy="135" fill="currentColor" r="3"></circle>', '<circle cx="91.7" cy="104.8" fill="currentColor" r="3"></circle>'),
  ('<circle cx="34" cy="60" fill="currentColor" r="3"></circle>', '<circle cx="91.7" cy="95.2" fill="currentColor" r="3"></circle>'),
  # 6축 라벨 오버레이 추가 (구현과 동일)
  ('</svg>\n</div>\n<div class="grid grid-cols-2 gap-space-xs text-center pt-2">',
   '''</svg>
<div class="absolute inset-0 pointer-events-none">
<span class="absolute font-label-sm text-[9px] text-on-surface-variant" style="left:50%;top:4%;transform:translate(-50%,-50%)">언어</span>
<span class="absolute font-label-sm text-[9px] text-on-surface-variant" style="left:90%;top:27%;transform:translate(-50%,-50%)">백엔드</span>
<span class="absolute font-label-sm text-[9px] text-on-surface-variant" style="left:90%;top:73%;transform:translate(-50%,-50%)">인프라</span>
<span class="absolute font-label-sm text-[9px] text-on-surface-variant" style="left:50%;top:96%;transform:translate(-50%,-50%)">데이터</span>
<span class="absolute font-label-sm text-[9px] text-on-surface-variant" style="left:10%;top:73%;transform:translate(-50%,-50%)">프론트</span>
<span class="absolute font-label-sm text-[9px] text-on-surface-variant" style="left:10%;top:27%;transform:translate(-50%,-50%)">도메인</span>
</div>
</div>
<div class="grid grid-cols-2 gap-space-xs text-center pt-2">'''),
  ('''<div class="p-2 rounded bg-surface-container-low">
<span class="font-label-sm text-label-sm text-on-surface-variant block">백엔드 직무</span>
<span class="font-headline-sm text-headline-sm text-primary font-bold">94%</span>
</div>
<div class="p-2 rounded bg-surface-container-low">
<span class="font-label-sm text-label-sm text-on-surface-variant block">클라우드/인프라</span>
<span class="font-headline-sm text-headline-sm text-secondary font-bold">88%</span>
</div>''',
   '''<div class="p-2 rounded bg-surface-container-low">
<span class="font-label-sm text-label-sm text-on-surface-variant block">최고 매칭</span>
<span class="font-headline-sm text-headline-sm text-primary font-bold">95%</span>
<span class="font-label-sm text-[10px] text-on-surface-variant block truncate">카카오</span>
</div>
<div class="p-2 rounded bg-surface-container-low">
<span class="font-label-sm text-label-sm text-on-surface-variant block">전체 평균 매칭</span>
<span class="font-headline-sm text-headline-sm text-secondary font-bold">50%</span>
</div>'''),
  ('Spring Boot와 Docker 역량으로 <strong>상위 6%</strong> 매칭군 진입',
   '학과 코호트 24명 대비 <strong>상위 0%</strong> 매칭군'),
])

# ============ 7. s16 분석 — scoreResume(RESUME_FULL)=86 실측 ============
def item(label, score, mx, weak=False):
    pct = round(score / mx * 100)
    bar = 'bg-error' if weak else 'bg-secondary'
    num = 'text-error font-bold' if weak else 'text-on-surface font-semibold'
    return ('<div class="flex items-center gap-space-sm"><span class="w-28 font-label-sm text-label-sm text-on-surface-variant shrink-0">' + label + '</span>'
      '<div class="flex-1 bg-surface-container h-2.5 rounded-full"><div class="' + bar + ' h-full rounded-full" style="width:' + str(pct) + '%"></div></div>'
      '<span class="w-14 text-right font-code-sm text-[12px] ' + num + '">' + str(score) + '/' + str(mx) + '</span></div>')

items16 = ''.join([
    item('분량', 8, 10), item('표현', 15, 15), item('수치', 15, 15), item('STAR 구조', 25, 25),
    item('직군 키워드', 14, 20), item('문장 길이', 6, 10, True), item('협업', 3, 5),
])

def chip(name, n, alias_only=False):
    cls = ('bg-surface-container-highest text-outline border border-dashed border-outline' if n == 0
           else 'bg-primary text-on-primary font-semibold' if n >= 3
           else 'bg-secondary-fixed text-on-secondary-fixed-variant' if n == 2
           else 'bg-surface-container text-on-surface-variant')
    star = '*' if alias_only else ''
    return ('<span class="px-2.5 py-1 rounded-lg ' + cls + ' font-label-sm text-label-sm flex items-center gap-1">' + name +
            ' <span class="font-code-sm text-[10px]">' + str(n) + star + '</span></span>')

chips16 = ''.join([
    chip('분산 스토리지', 3, True), chip('C++', 1), chip('Linux', 1), chip('동시성 제어', 1, True),
    chip('트래픽 최적화', 1, True), chip('Raft', 1), chip('분산 시스템', 1),
    chip('Go', 0), chip('Kubernetes', 0), chip('Redis', 0),
])

s16 = read('s16_analysis.html')
# 헤더 메타
s16 = s16.replace('네이버 프론트엔드 신입 · 자기소개서 v3 · 방금 분석됨',
                  '네이버클라우드 분산 스토리지 백엔드 신입 · 자기소개서 v3 · 규칙 엔진 실시간 채점')
# 종합 점수 74 → 86
s16 = s16.replace('stroke-dasharray="74 100"', 'stroke-dasharray="86 100"')
s16 = s16.replace('<span class="font-display-lg text-[40px] text-primary font-bold leading-none">74</span>',
                  '<span class="font-display-lg text-[40px] text-primary font-bold leading-none">86</span>')
# 버전 기준선 실측 — 버전 3개(86/82/63)+현재 86 → 4개 중 1위, 평균 79점
s16 = s16.replace('상위 32% · 평균(58점)보다 16점 높음',
                  '저장 버전 4개 중 1위 (상위 25%) · 버전 평균(79점)보다 7점 높음')
# 항목별 채점 행 전체 교체
s16 = re.sub(r'(<div class="flex flex-col gap-space-sm">)<div class="flex items-center gap-space-sm"><span class="w-28[^<]*분량.*?</div>\s*<p class="mt-space-sm',
             lambda m: m.group(1) + items16 + '\n</div>\n<p class="mt-space-sm', s16, count=1, flags=re.S)
s16 = s16.replace('약점: 수치(근거·수치 부족), 협업 표현', '약점: 문장 길이, 분량 권장 하한 미달')
# 잘된 점 / 보완할 점 실측
s16 = re.sub(r'(잘된 점</h3>\s*<ul class="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface">).*?(</ul>)',
             lambda m: m.group(1) +
             '<li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-tertiary shrink-0">check</span>정량 근거 우수 — 수치 지표 6건 (수치 15/15점)</li>'
             '<li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-tertiary shrink-0">check</span>상황-행동-결과 STAR 서술 구조 안정적</li>'
             '<li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-tertiary shrink-0">check</span>필수 JD 키워드 사전 기준 5/5 반영</li>' + m.group(2),
             s16, count=1, flags=re.S)
s16 = re.sub(r'(보완할 점</h3>\s*<ul class="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface">).*?(</ul>)',
             lambda m: m.group(1) +
             '<li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-error shrink-0">priority_high</span>표준 표기 미흡 — "분산 스토리지·동시성 제어·트래픽 최적화"를 띄어쓰기 표준 표기로 교체 시 ATS 노출</li>'
             '<li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-error shrink-0">priority_high</span>권장 분량 미달 — 현재 712자, 권장 800자 대비 부족</li>'
             '<li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-error shrink-0">priority_high</span>문장 길이 과다 — 평균 95자, 60자 내외 권장</li>' + m.group(2),
             s16, count=1, flags=re.S)
# 히트맵 칩 — keywordCoverage 실측
s16 = s16.replace('공고 요구 키워드 ↔ 자소서 매칭 횟수 (단어 경계 기준)',
                  '공고 요구 키워드 ↔ 자소서 매칭 횟수 — 칩 클릭 시 등장 문장 확인 (* 별칭 매칭)')
s16 = re.sub(r'<div class="flex flex-wrap gap-space-sm"><span class="px-2\.5 py-1 rounded-lg.*?</div>\s*(?=<div class="flex items-center gap-space-md mt-space-md)',
             '<div class="flex flex-wrap gap-space-sm">' + chips16 + '</div>\n  ', s16, count=1, flags=re.S)
write('s16_analysis.html', s16)

# ============ 8. s13_bookmarks.html 신규 — /bookmarks 구현과 동일 ============
def bcard(job):
    ring = round(job['score'] * 0.975, 1)
    new = '<span class="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-[10px] font-bold">NEW</span>' if job.get('isNew') else ''
    chips = ''.join('<span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed-variant font-code-sm text-[11px]">' + s + '</span>' for s in job['skills'])
    chips += ''.join('<span class="px-2 py-0.5 rounded border border-dashed border-outline-variant text-outline font-code-sm text-[11px]">+' + s + '</span>' for s in job['plus'])
    urg = 'bg-error-container text-on-error-container' if job.get('urgent') else 'bg-surface-container text-on-surface-variant'
    logo_style = 'background-color:' + job['logoBg'] + (';color:' + job['logoText'] if job.get('logoText') else '')
    return ('''<div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-shadow flex flex-col gap-space-sm relative">
  ''' + new + '''
  <div class="flex items-start gap-space-sm">
    <div class="w-11 h-11 rounded-lg flex items-center justify-center font-headline-sm text-headline-sm shrink-0" style="''' + logo_style + '''">''' + job['logo'] + '''</div>
    <div class="min-w-0 flex-1">
      <span class="font-label-sm text-label-sm text-on-surface-variant block truncate">''' + job['company'] + '''</span>
      <h3 class="font-headline-sm text-headline-sm text-on-surface truncate">''' + job['title'] + '''</h3>
    </div>
    <button class="p-1.5 rounded-lg text-primary hover:bg-surface-container transition-colors" aria-label="북마크 해제"><span class="material-symbols-outlined text-[20px]" style="font-variation-settings:'FILL' 1">bookmark</span></button>
  </div>
  <div class="flex flex-wrap gap-x-3 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
    <span>''' + job['location'] + '''</span><span>·</span><span>''' + job['type'] + '''</span><span>·</span><span>''' + job['salary'] + '''</span>
  </div>
  <div class="flex items-center justify-between">
    <div class="flex flex-wrap gap-1">''' + chips + '''</div>
    <div class="relative w-12 h-12 shrink-0"><svg class="w-12 h-12 -rotate-90" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" fill="none" stroke="#e7eeff" stroke-width="3.5"/><circle cx="18" cy="18" r="15.5" fill="none" stroke="#1a4f8f" stroke-width="3.5" stroke-dasharray="''' + str(ring) + ''' 100" stroke-linecap="round"/></svg><span class="absolute inset-0 flex items-center justify-center font-code-sm text-[12px] font-bold text-primary">''' + str(job['score']) + '''</span></div>
  </div>
  <div class="flex items-center justify-between pt-space-xs border-t border-surface-container">
    <span class="px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ''' + urg + '''">''' + job['dday'] + '''</span>
    <a href="./s12_detail.html" class="px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors">상세 보기</a>
  </div>
</div>''')

# 실측 matchJobWith(프로필, 공고): 카카오=95, 네이버=20
cards13 = bcard({
    'company': '카카오', 'title': '백엔드 엔지니어', 'logo': '카', 'logoBg': '#fae100', 'logoText': '#3c1e1e',
    'location': '성남 분당구', 'type': '신입·경력 · 정규직', 'salary': '연봉 협의',
    'skills': ['Java', 'Spring Boot', 'MySQL'], 'plus': ['Kubernetes'],
    'score': 95, 'dday': 'D-5', 'urgent': True,
}) + bcard({
    'company': '네이버', 'title': '프론트엔드 개발자 (신입)', 'logo': 'N', 'logoBg': '#03c75a',
    'location': '성남 분당구', 'type': '신입 · 정규직', 'salary': '5,000만원~',
    'skills': ['React', 'TypeScript', 'Next.js'], 'plus': ['테스트 코드'],
    'score': 20, 'dday': 'D-3', 'urgent': True, 'isNew': True,
})

c13 = '''<div class="flex flex-col w-full">
<section class="flex items-end justify-between mb-space-lg">
  <div>
    <span class="font-label-sm text-label-sm text-secondary font-bold tracking-wider">F-13 BOOKMARKS</span>
    <h1 class="font-display-lg text-display-lg text-on-surface mt-1">북마크한 공고</h1>
    <p class="font-body-md text-body-md text-on-surface-variant mt-1">스크랩해 둔 공고 <strong class="text-primary font-bold">2건</strong> · 북마크는 이 브라우저에 저장됩니다</p>
  </div>
  <a class="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-2 shadow-sm" href="./s11_listings.html"><span class="material-symbols-outlined text-[18px]">work_outline</span>공고 더 보기</a>
</section>
<section class="grid grid-cols-1 xl:grid-cols-2 gap-space-lg mb-space-lg">
''' + cards13 + '''
</section>
</div>'''

print('[8] s13_bookmarks.html (new)')
shell = read('_shell.html')
i = shell.find('data-path="bookmarks"')
assert i > 0, 'bookmarks nav missing'
a_start = shell.rfind('<a class="', 0, i)
s = shell[:a_start+len('<a class="')] + 'bg-primary-container text-on-primary font-label-md shadow-sm ' + shell[a_start+len('<a class="'):]
s = s.replace('text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-body-md text-body-md" data-path="bookmarks',
              'flex items-center gap-space-md px-space-md py-space-sm rounded-lg" data-path="bookmarks')
write('s13_bookmarks.html', s + c13 + FOOT)

print('\nDone — 8 files updated/created.')
