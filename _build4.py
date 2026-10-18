import io
shell = io.open('_shell.html', encoding='utf-8').read()
FOOT = '<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script></main></div></body></html>'

def build(active, content, fname):
    s = shell
    i = s.find('data-path="%s"' % active)
    a_start = s.rfind('<a class="', 0, i)
    s = s[:a_start+len('<a class="')] + 'bg-primary-container text-on-primary font-label-md shadow-sm ' + s[a_start+len('<a class="'):]
    s = s.replace('text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-body-md text-body-md" data-path="'+active, 'flex items-center gap-space-md px-space-md py-space-sm rounded-lg" data-path="'+active)
    io.open(fname, 'w', encoding='utf-8').write(s + content + FOOT)
    print(fname, 'written')

# ============ F-41 관리자 공고 승인/관리 ============
def tab(t, n, act=False):
    st = 'bg-primary text-on-primary font-semibold' if act else 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
    return '<button class="px-space-md py-2 rounded-lg font-label-md text-label-md ' + st + '">' + t + ' <span class="font-code-sm text-[11px]">' + str(n) + '</span></button>'

def row(co, job, tags, rel, relcls, date, status, stcls, pending=False):
    taghtml = ''.join('<span class="px-2 py-0.5 rounded bg-surface-container font-label-sm text-[10px] text-on-surface-variant">' + t + '</span>' for t in tags)
    actions = ('<button class="px-3 py-1 rounded-lg bg-tertiary text-on-tertiary font-label-sm text-label-sm">승인</button>'
               '<button class="px-3 py-1 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm">반려</button>') if pending else \
              '<button class="px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm">상세</button>'
    return ('<tr class="border-b border-surface-container hover:bg-surface-container-low transition-colors">'
      '<td class="py-3 px-3 font-body-sm text-body-sm font-semibold text-on-surface">' + co + '</td>'
      '<td class="py-3 px-3"><p class="font-body-sm text-body-sm text-on-surface font-semibold">' + job + '</p><div class="flex gap-1 mt-1">' + taghtml + '</div></td>'
      '<td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full ' + relcls + ' font-label-sm text-[11px] font-bold">' + rel + '</span></td>'
      '<td class="py-3 px-3 font-code-sm text-[12px] text-on-surface-variant">' + date + '</td>'
      '<td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full ' + stcls + ' font-label-sm text-[11px] font-bold">' + status + '</span></td>'
      '<td class="py-3 px-3"><div class="flex gap-1">' + actions + '</div></td></tr>')

rows41 = ''.join([
    row('넥슨','게임 클라이언트 개발자 (신입)',['C++','Unreal'],'관련 94%','bg-tertiary-fixed text-on-tertiary-fixed-variant','10.17','승인 대기','bg-secondary-fixed text-on-secondary-fixed-variant',True),
    row('NHN','클라우드 백엔드 엔지니어',['Java','Kubernetes'],'관련 91%','bg-tertiary-fixed text-on-tertiary-fixed-variant','10.17','승인 대기','bg-secondary-fixed text-on-secondary-fixed-variant',True),
    row('카페24','프론트엔드 개발자',['React','Vue'],'관련 88%','bg-tertiary-fixed text-on-tertiary-fixed-variant','10.16','승인 대기','bg-secondary-fixed text-on-secondary-fixed-variant',True),
    row('비바리퍼블리카','데이터 엔지니어',['Python','Spark','SQL'],'관련 86%','bg-tertiary-fixed text-on-tertiary-fixed-variant','10.16','승인 대기','bg-secondary-fixed text-on-secondary-fixed-variant',True),
    row('삼성SDS','물류 운영 직군 (비IT)',['Excel'],'부적합 8%','bg-error-container text-on-error-container','10.15','승인 대기','bg-error-container/60 text-error',True),
    row('LG CNS','SW 엔지니어 (신입)',['Java','Spring'],'관련 92%','bg-tertiary-fixed text-on-tertiary-fixed-variant','10.14','게시 중','bg-tertiary-fixed text-on-tertiary-fixed-variant'),
    row('SK C&C','시스템 엔지니어',['Linux','네트워크'],'관련 79%','bg-secondary-fixed text-on-secondary-fixed-variant','10.13','게시 중','bg-tertiary-fixed text-on-tertiary-fixed-variant'),
])

c41 = '''<div class="flex flex-col w-full gap-space-lg">
<section class="flex items-end justify-between">
  <div><span class="font-label-sm text-label-sm text-secondary font-bold tracking-wider">F-41 ADMIN POSTING REVIEW</span>
  <h1 class="font-display-lg text-display-lg text-on-surface mt-1">공고 승인 · 관리</h1>
  <p class="font-body-md text-body-md text-on-surface-variant mt-1">기업 등록 공고 검수 + 자동 분류 결과 사람 보정 — "자동 분류 + 사람 보정" 워크플로우</p></div>
  <button class="px-space-lg py-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-high font-label-md text-label-md text-on-surface flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">tune</span>분류 키워드 조정</button>
</section>
<section class="grid grid-cols-4 gap-space-md">
  <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm"><span class="font-label-sm text-label-sm text-on-surface-variant">승인 대기</span><div class="font-display-lg text-display-lg text-secondary">5<span class="font-body-sm text-body-sm text-on-surface-variant">건</span></div></div>
  <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm"><span class="font-label-sm text-label-sm text-on-surface-variant">게시 중</span><div class="font-display-lg text-display-lg text-on-surface">47<span class="font-body-sm text-body-sm text-on-surface-variant">건</span></div></div>
  <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm"><span class="font-label-sm text-label-sm text-on-surface-variant">반려</span><div class="font-display-lg text-display-lg text-error">2<span class="font-body-sm text-body-sm text-on-surface-variant">건</span></div></div>
  <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm"><span class="font-label-sm text-label-sm text-on-surface-variant">자동 분류 정확도</span><div class="font-display-lg text-display-lg text-tertiary">86<span class="font-body-sm text-body-sm text-on-surface-variant">%</span></div><span class="font-label-sm text-[11px] text-on-surface-variant">정답셋 기준 (목표 ≥80%)</span></div>
</section>
<section class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
  <div class="flex items-center gap-space-sm mb-space-md">''' + tab('승인 대기',5,True) + tab('게시 중',47) + tab('반려',2) + tab('전체',54) + '''</div>
  <table class="w-full">
    <thead><tr class="border-b-2 border-surface-container-high font-label-sm text-label-sm text-on-surface-variant text-left">
      <th class="py-2 px-3">기업</th><th class="py-2 px-3">공고 · 자동 태그</th><th class="py-2 px-3">학과 관련도</th><th class="py-2 px-3">신청일</th><th class="py-2 px-3">상태</th><th class="py-2 px-3">처리</th>
    </tr></thead>
    <tbody>''' + rows41 + '''</tbody>
  </table>
  <p class="mt-space-md font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[16px] text-secondary">info</span>자동 분류가 부적합으로 판정한 공고(관련도 8% 등)도 최종 게시 여부는 관리자가 결정합니다.</p>
</section>
</div>'''
build('jobs', c41, 's41_admin_review.html')

# ============ F-31 기업 공고 등록 ============
def fld(label, val, is_input=True, w=''):
    inner = ('<input class="w-full h-11 px-3 rounded-lg bg-surface-container-low font-body-md text-body-md focus:outline-none" value="' + val + '">') if is_input else val
    return ('<div class="' + w + '"><label class="font-label-sm text-label-sm text-on-surface-variant block mb-1">' + label + '</label>' + inner + '</div>')

stackchips = ''.join('<span class="px-space-md py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold flex items-center gap-1">' + t + '<span class="material-symbols-outlined text-[14px]">close</span></span>' for t in ['Java','Spring Boot','MySQL','AWS','Docker']) + '<span class="px-space-md py-1.5 rounded-full border border-dashed border-outline text-outline font-label-sm text-label-sm flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">add</span>스택 추가</span>'

c31 = '''<div class="flex flex-col w-full gap-space-lg">
<section><span class="font-label-sm text-label-sm text-secondary font-bold tracking-wider">F-31 COMPANY POSTING FORM</span>
  <h1 class="font-display-lg text-display-lg text-on-surface mt-1">공고 등록</h1>
  <p class="font-body-md text-body-md text-on-surface-variant mt-1">작성 → 제출 → <strong>관리자 승인 후 게시</strong>됩니다. 승인 전에는 학생에게 노출되지 않습니다.</p>
</section>
<div class="rounded-xl bg-primary-fixed/40 border border-primary-fixed p-space-md flex items-center gap-space-md"><span class="material-symbols-outlined text-primary">schedule</span><p class="font-body-sm text-body-sm text-on-surface"><strong>승인 대기 → 게시</strong> 워크플로우: 제출된 공고는 학과 관리자 검수(자동 분류 확인 포함) 후 게시됩니다. 평균 처리 1~2일.</p></div>
<div class="grid grid-cols-12 gap-space-lg">
  <section class="col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
    <h2 class="font-headline-sm text-headline-sm text-on-surface">공고 정보</h2>
    ''' + fld('공고 제목','백엔드 엔지니어 (신입/경력 무관)') + '''
    <div class="grid grid-cols-2 gap-space-md">
      <div><label class="font-label-sm text-label-sm text-on-surface-variant block mb-1">직무 분야</label><button class="w-full h-11 px-3 rounded-lg bg-surface-container-low font-body-md text-body-md text-left flex items-center justify-between">백엔드 / 서버<span class="material-symbols-outlined text-[18px]">expand_more</span></button></div>
      <div><label class="font-label-sm text-label-sm text-on-surface-variant block mb-1">고용 형태</label><button class="w-full h-11 px-3 rounded-lg bg-surface-container-low font-body-md text-body-md text-left flex items-center justify-between">정규직<span class="material-symbols-outlined text-[18px]">expand_more</span></button></div>
      ''' + fld('경력 조건','신입·경력 2년 이하') + fld('근무지','서울 강남구') + fld('연봉','5,000만원 이상 (협의)') + fld('마감일','2026-11-15') + '''
    </div>
    <div><label class="font-label-sm text-label-sm text-on-surface-variant block mb-1">요구 기술 스택 <span class="text-secondary">— 매칭 점수 산정 기준</span></label>
      <div class="flex flex-wrap gap-space-xs p-space-sm rounded-lg bg-surface-container-low">''' + stackchips + '''</div></div>
    <div><label class="font-label-sm text-label-sm text-on-surface-variant block mb-1">상세 요구사항</label>
      <textarea class="w-full h-36 p-3 rounded-lg bg-surface-container-low font-body-md text-body-md focus:outline-none">Spring Boot 기반 커머스 백엔드 개발. REST API 설계 경험, MySQL 인덱스·쿼리 최적화 이해, Docker 컨테이너 환경 경험자 우대. 신입은 캡스톤·개인 프로젝트로 대체 가능.</textarea></div>
    <div class="flex gap-space-sm pt-space-sm border-t border-surface-container">
      <button class="px-space-lg py-2.5 rounded-lg bg-surface-container font-label-md text-label-md text-on-surface">임시 저장</button>
      <button class="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-2 shadow-sm"><span class="material-symbols-outlined text-[18px]">send</span>등록 신청 (승인 요청)</button>
    </div>
  </section>
  <section class="col-span-4 flex flex-col gap-space-md">
    <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
      <span class="font-label-sm text-label-sm text-on-surface-variant">학생에게 보이는 카드 미리보기</span>
      <div class="mt-space-sm rounded-lg bg-surface-container-low p-space-md flex flex-col gap-space-xs">
        <div class="flex items-center gap-space-sm"><div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary font-label-md text-label-md font-bold">K</div><div><span class="font-label-sm text-label-sm text-on-surface-variant block">카카오엔터프라이즈</span><p class="font-body-sm text-body-sm font-semibold text-on-surface">백엔드 엔지니어 (신입/경력 무관)</p></div></div>
        <div class="font-body-sm text-body-sm text-on-surface-variant">서울 강남구 · 신입·경력 · 정규직 · 5,000만원~</div>
        <div class="flex gap-1"><span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed-variant font-code-sm text-[11px]">Java</span><span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed-variant font-code-sm text-[11px]">Spring</span><span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed-variant font-code-sm text-[11px]">MySQL</span></div>
      </div>
    </div>
    <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
      <span class="font-label-sm text-label-sm text-on-surface-variant">처리 단계</span>
      <div class="mt-space-sm flex flex-col gap-space-sm font-body-sm text-body-sm">
        <div class="flex items-center gap-space-sm"><span class="w-6 h-6 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-code-sm text-[11px] font-bold">1</span><span class="text-on-surface">작성 · 제출</span></div>
        <div class="flex items-center gap-space-sm"><span class="w-6 h-6 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center font-code-sm text-[11px] font-bold">2</span><span class="text-on-surface">관리자 승인 대기 <span class="font-label-sm text-[10px] text-outline">(자동 분류 포함)</span></span></div>
        <div class="flex items-center gap-space-sm"><span class="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-code-sm text-[11px]">3</span><span class="text-on-surface-variant">게시 · 학생 노출</span></div>
      </div>
    </div>
  </section>
</div>
</div>'''
build('jobs', c31, 's31_company_post.html')

# ============ F-33 기업 지원자 목록 ============
def arow(name, dept, yr, score, scls, date, status, stcls):
    return ('<tr class="border-b border-surface-container hover:bg-surface-container-low transition-colors">'
      '<td class="py-3 px-3 font-body-sm text-body-sm font-semibold text-on-surface">' + name + '</td>'
      '<td class="py-3 px-3 font-body-sm text-body-sm text-on-surface-variant">' + dept + ' ' + str(yr) + '학년</td>'
      '<td class="py-3 px-3"><span class="font-code-sm text-[13px] font-bold ' + scls + '">' + str(score) + '</span></td>'
      '<td class="py-3 px-3 font-code-sm text-[12px] text-on-surface-variant">' + date + '</td>'
      '<td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full ' + stcls + ' font-label-sm text-[11px] font-bold">' + status + '</span></td>'
      '<td class="py-3 px-3"><button class="px-3 py-1 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm">자소서 보기</button></td></tr>')

rows33 = ''.join([
    arow('김민준','컴퓨터공학과',4,92,'text-tertiary','10.16','서류 검토','bg-secondary-fixed text-on-secondary-fixed-variant'),
    arow('이서연','컴퓨터공학과',4,88,'text-tertiary','10.16','서류 검토','bg-secondary-fixed text-on-secondary-fixed-variant'),
    arow('박준혁','소프트웨어융합',3,84,'text-secondary','10.15','면접 제안','bg-primary-fixed text-on-primary-fixed-variant'),
    arow('최지우','컴퓨터공학과',4,79,'text-secondary','10.15','서류 검토','bg-secondary-fixed text-on-secondary-fixed-variant'),
    arow('정도현','컴퓨터공학과',3,76,'text-secondary','10.14','서류 합격','bg-tertiary-fixed text-on-tertiary-fixed-variant'),
    arow('한소희','전자공학과',4,61,'text-on-surface-variant','10.13','불합격','bg-surface-container-highest text-on-surface-variant'),
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
  <button class="px-space-md py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high font-label-md text-label-md flex items-center gap-2">백엔드 엔지니어 (신입/경력 무관)<span class="material-symbols-outlined text-[18px]">expand_more</span></button>
  <div class="ml-auto flex gap-space-sm font-label-sm text-label-sm">
    <span class="px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-sm text-on-surface-variant">총 지원자 <strong class="text-on-surface">24</strong></span>
    <span class="px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-sm text-on-surface-variant">검토 중 <strong class="text-secondary">14</strong></span>
    <span class="px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-sm text-on-surface-variant">서류 합격 <strong class="text-tertiary">5</strong></span>
    <span class="px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-sm text-on-surface-variant">불합격 <strong>5</strong></span>
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
    <span class="font-label-sm text-label-sm text-on-surface-variant">1~6 / 24명</span>
    <div class="flex gap-1"><button class="w-8 h-8 rounded-lg bg-primary text-on-primary font-label-md">1</button><button class="w-8 h-8 rounded-lg hover:bg-surface-container font-label-md text-on-surface-variant">2</button><button class="w-8 h-8 rounded-lg hover:bg-surface-container font-label-md text-on-surface-variant">3</button><button class="w-8 h-8 rounded-lg hover:bg-surface-container font-label-md text-on-surface-variant">4</button></div>
  </div>
</section>
</div>'''
build('applications', c33, 's33_applicants.html')
