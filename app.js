/* JobFilter 프로토타입 통합 상호작용 — figma_src 11개 화면 공용 */
(function () {
  'use strict';

  var PAGE = (location.pathname.split('/').pop() || '').replace('.html', '');

  /* ---------- 공통 유틸 ---------- */

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function ensureToast() {
    if (qs('#jf-toast')) return;
    var t = document.createElement('div');
    t.id = 'jf-toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#0f172a;color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;display:flex;align-items:center;gap:8px;opacity:0;transition:all .25s;z-index:9999;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.2)';
    document.body.appendChild(t);
  }

  function toast(msg, sub) {
    // 기존 화면의 showToast가 있으면 활용
    if (typeof window.showToast === 'function') { window.showToast(msg, sub || '', 'check_circle'); return; }
    ensureToast();
    var t = qs('#jf-toast');
    t.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">check_circle</span><div><div style="font-weight:600">' + msg + '</div>' + (sub ? '<div style="font-size:12px;opacity:.75">' + sub + '</div>' : '') + '</div>';
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(t._tm);
    t._tm = setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; }, 2600);
  }

  /* ---------- 1) 사이드바·공통 네비게이션 ---------- */

  var NAV = {
    dashboard: 's10_dashboard.html',
    jobs: 's11_listings.html',
    applications: 's14_kanban.html',
    'resume-coaching': 's15_coverletter.html',
    bookmarks: null,
    calendar: 's10_dashboard.html',
    profile: 's27_profile.html',
    'company-post': 's31_company_post.html',
    'company-applicants': 's33_applicants.html',
    'admin-review': 's41_admin_review.html',
    'admin-upload': 's42_admin.html'
  };

  // 페이지 → 활성 메뉴 경로 매핑
  var PAGE_TO_PATH = {
    s10_dashboard: 'dashboard',
    s11_listings: 'jobs',
    s12_detail: 'jobs',
    s14_kanban: 'applications',
    s15_coverletter: 'resume-coaching',
    s16_analysis: 'resume-coaching',
    s27_profile: 'profile',
    s31_company_post: 'company-post',
    s33_applicants: 'company-applicants',
    s41_admin_review: 'admin-review',
    s42_admin: 'admin-upload',
    index: 'dashboard'
  };

  var NAV_GROUPS = [
    {
      label: null,
      items: [
        { path: 'dashboard', icon: 'grid_view', text: '대시보드' },
        { path: 'jobs', icon: 'work_outline', text: '공고 목록' },
        { path: 'applications', icon: 'assignment_turned_in', text: '지원 관리' },
        { path: 'resume-coaching', icon: 'edit_note', text: '자소서 코칭' },
        { path: 'bookmarks', icon: 'bookmark_border', text: '북마크' },
        { path: 'calendar', icon: 'calendar_today', text: '캘린더' },
        { path: 'profile', icon: 'person_outline', text: '프로필' }
      ]
    },
    {
      label: '기업',
      items: [
        { path: 'company-post', icon: 'post_add', text: '공고 등록' },
        { path: 'company-applicants', icon: 'group', text: '지원자 관리' }
      ]
    },
    {
      label: '관리자',
      items: [
        { path: 'admin-review', icon: 'fact_check', text: '공고 승인' },
        { path: 'admin-upload', icon: 'upload_file', text: '일괄 등록' }
      ]
    }
  ];

  // 사이드바 nav 재구성 — 페이지별 활성 항목을 JS가 일관되게 표시
  var navEl = qs('aside nav');
  var activePath = PAGE_TO_PATH[PAGE] || null;
  if (navEl) {
    var BASE = 'flex items-center gap-space-md px-space-md py-space-sm rounded-lg transition-colors font-body-md text-body-md';
    var IDLE = 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface';
    var ACTIVE = 'bg-primary-container text-on-primary font-label-md shadow-sm';
    var html = '';
    NAV_GROUPS.forEach(function (g) {
      if (g.label) {
        html += '<div class="px-space-md pt-space-md pb-space-xs"><span class="font-label-sm text-label-sm text-outline uppercase tracking-wider">' + g.label + '</span></div>';
      }
      g.items.forEach(function (it) {
        var on = it.path === activePath;
        html += '<a class="' + BASE + ' ' + (on ? ACTIVE : IDLE) + '" data-path="' + it.path + '" href="#">' +
          '<span class="material-symbols-outlined text-[20px]"' + (on ? ' style="font-variation-settings:\'FILL\' 1"' : '') + '>' + it.icon + '</span>' +
          '<span>' + it.text + '</span>' +
          (on ? '<span class="ml-auto w-1.5 h-1.5 rounded-full bg-on-primary"></span>' : '') +
          '</a>';
      });
    });
    navEl.innerHTML = html;
  }

  qsa('[data-path]').forEach(function (a) {
    a.style.cursor = 'pointer';
    a.addEventListener('click', function (e) {
      var p = a.getAttribute('data-path');
      var target = NAV[p];
      if (target) { location.href = target; }
      else {
        e.preventDefault();
        toast('준비 중인 메뉴', '북마크 목록은 다음 단계에서 제공됩니다.');
      }
    });
  });

  // 상단 검색바 → 공고 목록으로 이동
  var topSearch = qs('header input');
  if (topSearch) {
    topSearch.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && PAGE !== 's11_listings') {
        location.href = 's11_listings.html?q=' + encodeURIComponent(topSearch.value);
      }
    });
  }

  /* ---------- 2) 페이지별 로직 ---------- */

  /* ===== F-10 대시보드 ===== */
  if (PAGE === 's10_dashboard') {
    // 추천 공고 "상세 →" → 공고 상세
    qsa('button').forEach(function (b) {
      if (b.textContent.indexOf('상세') > -1) b.addEventListener('click', function () { location.href = 's12_detail.html'; });
      if (b.textContent.indexOf('전체 보기') > -1) b.addEventListener('click', function () { location.href = 's11_listings.html'; });
      if (b.textContent.indexOf('칸반으로 이동') > -1) b.addEventListener('click', function () { location.href = 's14_kanban.html'; });
    });
    // 프로필 완성도 카드 → 프로필
    qsa('div').forEach(function (d) {
      if (d.textContent.indexOf('프로필 완성도') > -1 && d.querySelector('.rounded-full')) {
        d.style.cursor = 'pointer';
        d.addEventListener('click', function () { location.href = 's27_profile.html'; });
      }
    });
    // 마감 임박 공고 클릭 → 상세
    qsa('section').forEach(function (sec) {
      if (sec.textContent.indexOf('마감 임박 공고') > -1) {
        qsa(':scope > div > div', sec).forEach(function (card) {
          card.style.cursor = 'pointer';
          card.addEventListener('click', function () { location.href = 's12_detail.html'; });
        });
      }
    });
  }

  /* ===== F-11 공고 목록 ===== */
  if (PAGE === 's11_listings') {
    var cards = qsa('.grid > div[class*="bg-surface-container-lowest"]');
    var searchInput = qs('section input');

    // URL 쿼리로 검색어 복원
    var q = new URLSearchParams(location.search).get('q');
    if (q && searchInput) { searchInput.value = q; filterCards(q); }

    function filterCards(term) {
      term = (term || '').trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var hit = !term || c.textContent.toLowerCase().indexOf(term) > -1;
        c.style.display = hit ? '' : 'none';
        if (hit) shown++;
      });
      return shown;
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var n = filterCards(searchInput.value);
        // URL 동기화 (명세서 F-11 A-02)
        var u = new URL(location.href);
        if (searchInput.value) u.searchParams.set('q', searchInput.value); else u.searchParams.delete('q');
        history.replaceState(null, '', u);
        toast(n + '건 검색됨', 'URL 쿼리가 동기화되었습니다.');
      });
    }

    // 필터 칩 토글
    qsa('section button').forEach(function (b) {
      if (['경력', '고용형태', '학과', '근무지', '태그', '마감일'].indexOf(b.textContent.trim()) > -1) {
        b.addEventListener('click', function () {
          b.classList.toggle('bg-primary-container');
          b.classList.toggle('text-on-primary');
          b.classList.toggle('bg-surface-container');
          b.classList.toggle('text-on-surface-variant');
        });
      }
    });

    // 적용된 필터 칩 × 제거
    qsa('span').forEach(function (s) {
      var x = s.querySelector('.material-symbols-outlined');
      if (x && x.textContent === 'close' && s.className.indexOf('secondary-fixed') > -1) {
        s.style.cursor = 'pointer';
        s.addEventListener('click', function () { s.remove(); toast('필터 해제됨'); });
      }
    });

    // 필터 초기화
    qsa('button').forEach(function (b) {
      if (b.textContent.indexOf('필터 초기화') > -1) {
        b.addEventListener('click', function () {
          qsa('span').forEach(function (s) {
            if (s.className.indexOf('secondary-fixed') > -1 && s.querySelector('.material-symbols-outlined')) s.remove();
          });
          if (searchInput) { searchInput.value = ''; filterCards(''); }
          toast('필터가 초기화되었습니다');
        });
      }
    });

    // 정렬 드롭다운: 최신순 → 마감임박순 → 매칭순 순환
    var sortBtn = null;
    qsa('button').forEach(function (b) { if (b.textContent.indexOf('최신순') > -1 || b.textContent.indexOf('순') > -1 && b.textContent.indexOf('expand') > -1) sortBtn = b; });
    var sortModes = ['최신순', '마감임박순', '매칭순']; var sortIdx = 0;
    if (sortBtn) {
      sortBtn.addEventListener('click', function () {
        sortIdx = (sortIdx + 1) % sortModes.length;
        sortBtn.childNodes[0].textContent = sortModes[sortIdx];
        var grid = cards[0] && cards[0].parentElement;
        if (grid && sortModes[sortIdx] === '매칭순') {
          Array.prototype.slice.call(grid.children).sort(function (a, b2) {
            var sa = parseInt((qs('.font-code-sm', a) || {}).textContent) || 0;
            var sb = parseInt((qs('.font-code-sm', b2) || {}).textContent) || 0;
            return sb - sa;
          }).forEach(function (c) { grid.appendChild(c); });
        }
        toast(sortModes[sortIdx] + '으로 정렬');
      });
    }

    // 북마크 토글
    cards.forEach(function (c) {
      var bm = qs('button .material-symbols-outlined', c);
      if (bm) {
        var btn = bm.parentElement;
        btn.addEventListener('click', function () {
          var on = bm.textContent === 'bookmark';
          bm.textContent = on ? 'bookmark_border' : 'bookmark';
          bm.style.fontVariationSettings = on ? "'FILL' 0" : "'FILL' 1";
          toast(on ? '북마크 해제' : '북마크 저장', '북마크 보관함을 참고하세요.');
        });
      }
      // 상세 보기 → F-12
      qsa('button', c).forEach(function (b) {
        if (b.textContent.indexOf('상세 보기') > -1) b.addEventListener('click', function () { location.href = 's12_detail.html'; });
      });
    });
  }

  /* ===== F-12 공고 상세 ===== */
  if (PAGE === 's12_detail') {
    // 본문 탭 → 해당 섹션 스크롤 + 활성 표시
    var tabBtns = qsa('button').filter(function (b) {
      return /모집 요강|전형 프로세스|복리후생|주요 업무|자격 요건/.test(b.textContent);
    });
    tabBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        tabBtns.forEach(function (x) { x.classList.remove('text-primary', 'border-primary'); });
        b.classList.add('text-primary', 'border-primary');
        toast('"' + b.textContent.trim() + '" 섹션으로 이동');
      });
    });
    // 자소서 코칭 추천 라벨 → 에디터로 이동 / 지원 관리 → 칸반
    qsa('button, span').forEach(function (b) {
      if (b.textContent.trim() === '자소서 코칭 추천') {
        b.style.cursor = 'pointer';
        b.addEventListener('click', function () { location.href = 's15_coverletter.html'; });
      }
    });
    qsa('button').forEach(function (b) {
      if (b.textContent.indexOf('지원 관리') > -1) {
        b.addEventListener('click', function () { location.href = 's14_kanban.html'; });
      }
    });
  }

  /* ===== F-14 지원 칸반 ===== */
  if (PAGE === 's14_kanban') {
    var dragEl = null;

    function refreshCounts() {
      qsa('section .w-64').forEach(function (col) {
        var badge = qs('.px-1\\.5', col.querySelector('div'));
        var n = col.querySelectorAll('div[class*="cursor-grab"]').length;
        qsa('.rounded-full', col).forEach(function (sp) {
          if (/^\d+$/.test(sp.textContent.trim())) sp.textContent = n;
        });
      });
    }

    qsa('div[class*="cursor-grab"]').forEach(function (card) {
      card.setAttribute('draggable', 'true');
      card.addEventListener('dragstart', function (e) {
        dragEl = card; card.style.opacity = '.5';
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', function () { card.style.opacity = '1'; dragEl = null; refreshCounts(); });
      // 클릭 → 상태 메모 토스트
      card.addEventListener('click', function () {
        toast('지원 카드 상세', '상태 변경 이력(StatusHistory)과 메모를 확인합니다.');
      });
    });

    qsa('div[class*="min-h-["]').forEach(function (colBody) {
      colBody.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      colBody.addEventListener('drop', function (e) {
        e.preventDefault();
        if (dragEl) { colBody.appendChild(dragEl); toast('상태가 변경되었습니다', '이력이 StatusHistory에 기록되었습니다.'); }
      });
    });

    // 지원 내역 추가 → 서류 준비 중 첫 칸에 카드 추가
    qsa('button').forEach(function (b) {
      if (b.textContent.indexOf('지원 내역 추가') > -1) {
        b.addEventListener('click', function () {
          var co = prompt('기업명을 입력하세요', '새 회사');
          if (!co) return;
          var col = qs('div[class*="min-h-["]');
          var card = document.createElement('div');
          card.className = 'bg-surface-container-lowest rounded-lg p-space-sm shadow-sm border-l-4 border-surface-container-highest cursor-grab hover:shadow-md transition-shadow';
          card.innerHTML = '<span class="font-label-sm text-label-sm text-on-surface-variant">' + co + '</span><p class="font-body-md text-body-md font-semibold text-on-surface leading-snug mt-0.5">직무 미정</p><div class="flex items-center justify-between mt-space-xs"><span class="font-code-sm text-[11px] text-secondary font-bold">D-30</span><span class="font-code-sm text-[11px] text-on-surface-variant">매칭 -</span></div><div class="font-label-sm text-[10px] text-outline mt-1">변수: 방금</div>';
          card.setAttribute('draggable', 'true');
          card.addEventListener('dragstart', function (e) { dragEl = card; e.dataTransfer.effectAllowed = 'move'; });
          card.addEventListener('dragend', function () { dragEl = null; refreshCounts(); });
          col.insertBefore(card, col.firstChild);
          refreshCounts();
          toast('지원 내역이 추가되었습니다', co);
        });
      }
    });
  }

  /* ===== F-15 자소서 에디터 ===== */
  if (PAGE === 's15_coverletter') {
    // 좌측 회사별 작성함 카드 클릭 → 작성 대상 전환 + 활성 표시
    var items = qsa('div.cursor-pointer').filter(function (d) {
      return d.querySelector('.font-label-md') || (d.querySelector('.font-body-md') && d.textContent.indexOf('점') > -1);
    });
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        items.forEach(function (x) { x.classList.remove('bg-surface-container-high', 'shadow-sm'); });
        item.classList.add('bg-surface-container-high', 'shadow-sm');
        var nameEl = qs('.font-label-md', item) || qs('.font-body-md', item) || qs('.font-semibold', item);
        var name = nameEl ? nameEl.textContent.trim() : '선택한 공고';
        toast(name + ' 자소서로 전환', '해당 공고의 문항과 버전을 불러옵니다.');
      });
    });
    // 문항 탭 전환 (내용 개별 보존)
    var qTabs = qsa('button').filter(function (b) { return /문항/.test(b.textContent); });
    var ta = qs('textarea');
    if (ta && qTabs.length) {
      var store = {}, cur = 0;
      store[0] = ta.value;
      qTabs.forEach(function (b, i) {
        b.addEventListener('click', function () {
          store[cur] = ta.value; cur = i;
          ta.value = store[i] || '';
          qTabs.forEach(function (x) { x.classList.remove('bg-primary-container', 'text-on-primary'); });
          b.classList.add('bg-primary-container', 'text-on-primary');
          ta.dispatchEvent(new Event('input'));
        });
      });
    }
    // 버전 복원 / 분석 버튼
    qsa('button').forEach(function (b) {
      if (b.textContent.indexOf('복원') > -1) {
        b.addEventListener('click', function () { toast('버전이 복원되었습니다'); });
      }
      if (b.textContent.indexOf('분석') > -1 && b.textContent.indexOf('규칙') < 0) {
        b.addEventListener('click', function () { location.href = 's16_analysis.html'; });
      }
    });
  }

  /* ===== F-16/17/28 분석 결과 ===== */
  if (PAGE === 's16_analysis') {
    // 평가 기준 패널 접기/펼치기 (details → div 전환된 상태라 토글 구현)
    var critHead = null;
    qsa('h2').forEach(function (h) { if (h.textContent.indexOf('평가 기준') > -1) critHead = h.parentElement; });
    if (critHead) {
      critHead.style.cursor = 'pointer';
      var critBody = critHead.nextElementSibling;
      critHead.addEventListener('click', function () {
        var hidden = critBody.style.display === 'none';
        critBody.style.display = hidden ? '' : 'none';
      });
    }
    qsa('button').forEach(function (b) {
      if (b.textContent.indexOf('PDF') > -1) b.addEventListener('click', function () { window.print(); });
      if (b.textContent.indexOf('수정해서') > -1) b.addEventListener('click', function () { location.href = 's15_coverletter.html'; });
    });
  }

  /* ===== F-27 프로필 ===== */
  if (PAGE === 's27_profile') {
    // 칩 토글 (직무/권역/스택) — close 아이콘은 button 안에 있을 수 있음
    qsa('span, button').forEach(function (el) {
      var ic = el.querySelector('.material-symbols-outlined');
      if (ic && ic.textContent === 'close') {
        el.style.cursor = 'pointer';
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          // 칩 전체 행(flex 컨테이너)을 제거 — 아이콘/버튼만 지우지 않도록
          var chip = el.closest('div.flex.items-center') || el.closest('button') || el;
          chip.remove();
          toast('항목이 삭제되었습니다');
        });
      }
    });
    // 추가 버튼
    qsa('button, span').forEach(function (el) {
      var ic = el.querySelector('.material-symbols-outlined');
      if (ic && ic.textContent === 'add' && /추가|\+/.test(el.textContent)) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', function () {
          var v = prompt('추가할 항목을 입력하세요');
          if (v) toast('"' + v + '" 추가됨', '매칭 점수가 갱신됩니다.');
        });
      }
    });
  }

  /* ===== F-31 기업 공고 등록 ===== */
  if (PAGE === 's31_company_post') {
    // 스택 칩 × 삭제 / + 추가
    qsa('span').forEach(function (s) {
      var ic = s.querySelector('.material-symbols-outlined');
      if (ic && ic.textContent === 'close') {
        s.style.cursor = 'pointer';
        s.addEventListener('click', function () { s.remove(); });
      }
      if (ic && ic.textContent === 'add') {
        s.style.cursor = 'pointer';
        s.addEventListener('click', function () {
          var v = prompt('스택 추가', 'Kubernetes');
          if (!v) return;
          var chip = document.createElement('span');
          chip.className = s.previousElementSibling ? s.previousElementSibling.className : 'px-space-md py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold flex items-center gap-1';
          chip.innerHTML = v + '<span class="material-symbols-outlined text-[14px]">close</span>';
          chip.style.cursor = 'pointer';
          chip.addEventListener('click', function () { chip.remove(); });
          s.parentElement.insertBefore(chip, s);
        });
      }
    });
    // 미리보기 라이브 동기화 (제목)
    var titleInput = qs('input');
    var previewTitle = qs('.rounded-lg.bg-surface-container-low p');
    if (titleInput && previewTitle) {
      titleInput.addEventListener('input', function () { previewTitle.textContent = titleInput.value || '공고 제목'; });
    }
    qsa('button').forEach(function (b) {
      if (b.textContent.indexOf('임시 저장') > -1) b.addEventListener('click', function () { toast('임시 저장되었습니다'); });
      if (b.textContent.indexOf('등록 신청') > -1) b.addEventListener('click', function () { toast('승인 요청이 제출되었습니다', '관리자 검수 후 게시됩니다. 평균 1~2일.'); });
      // 드롭다운 순환
      if (b.querySelector('.material-symbols-outlined') && b.querySelector('.material-symbols-outlined').textContent === 'expand_more' && b.textContent.indexOf('공고 선택') < 0) {
        var opts = { '직무 분야': ['백엔드 / 서버', '프론트엔드', '풀스택', 'DevOps', '데이터'], '고용 형태': ['정규직', '계약직', '인턴', '체험형'] };
        b.addEventListener('click', function () {
          var lbl = b.parentElement.querySelector('label').textContent;
          var list = opts[lbl] || [b.textContent.trim()];
          var i = (list.indexOf(b.textContent.trim()) + 1) % list.length;
          b.childNodes[0].textContent = list[i];
        });
      }
    });
  }

  /* ===== F-33 기업 지원자 ===== */
  if (PAGE === 's33_applicants') {
    // 엑셀보내기 → CSV 다운로드
    qsa('button').forEach(function (b) {
      if (b.textContent.indexOf('엑셀') > -1) {
        b.addEventListener('click', function () {
          var rows = [['지원자', '학과·학년', '매칭 점수', '지원일', '전형 상태']];
          qsa('tbody tr').forEach(function (tr) {
            rows.push(qsa('td', tr).slice(0, 5).map(function (td) { return td.textContent.trim(); }));
          });
          var csv = '﻿' + rows.map(function (r) { return r.join(','); }).join('\n');
          var a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
          a.download = '지원자목록.csv'; a.click();
          toast('엑셀 파일이 다운로드되었습니다', rows.length - 1 + '명');
        });
      }
      if (b.textContent.indexOf('자소서 보기') > -1) b.addEventListener('click', function () { location.href = 's15_coverletter.html'; });
      if (b.textContent.indexOf('공고 선택') < 0 && b.querySelector('.material-symbols-outlined') && b.querySelector('.material-symbols-outlined').textContent === 'expand_more') {
        var posts = ['백엔드 엔지니어 (신입/경력 무관)', '프론트엔드 개발자 (신입)', 'DevOps 엔지니어'];
        b.addEventListener('click', function () {
          var i = (posts.indexOf(b.childNodes[0].textContent.trim()) + 1) % posts.length;
          b.childNodes[0].textContent = posts[i];
          toast('공고 변경됨', posts[i] + ' 지원자로 갱신');
        });
      }
    });
  }

  /* ===== F-41 관리자 승인 ===== */
  if (PAGE === 's41_admin_review') {
    // 탭 필터
    qsa('section button').forEach(function (b) {
      if (/승인 대기|게시 중|반려|전체/.test(b.textContent)) {
        b.addEventListener('click', function () {
          qsa('tbody tr').forEach(function (tr) {
            var status = tr.querySelectorAll('td')[4].textContent.trim();
            var want = b.textContent.replace(/\d+/g, '').trim();
            tr.style.display = (want === '전체' || status === want) ? '' : 'none';
          });
        });
      }
      // 승인/반려 버튼
      if (b.textContent.trim() === '승인') {
        b.addEventListener('click', function () {
          var tr = b.closest('tr'); var st = tr.querySelectorAll('td')[4].querySelector('span');
          st.textContent = '게시 중'; st.className = 'px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-[11px] font-bold';
          tr.querySelectorAll('td')[5].innerHTML = '<button class="px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm">상세</button>';
          toast('공고가 승인되었습니다', '학생 목록에 게시됩니다.');
        });
      }
      if (b.textContent.trim() === '반려') {
        b.addEventListener('click', function () {
          var tr = b.closest('tr'); var st = tr.querySelectorAll('td')[4].querySelector('span');
          st.textContent = '반려'; st.className = 'px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-[11px] font-bold';
          tr.querySelectorAll('td')[5].innerHTML = '<button class="px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm">상세</button>';
          toast('공고가 반려되었습니다');
        });
      }
      if (b.textContent.indexOf('분류 키워드') > -1) b.addEventListener('click', function () { toast('키워드 사전 조정', '자동 분류 규칙을 수정합니다 (F-43 연계).'); });
    });
  }

  /* ===== F-42 관리자 일괄 등록 ===== */
  if (PAGE === 's42_admin') {
    // 행별 승인 배지 토글 — 배지는 아이콘 span + 텍스트 포함 구조
    qsa('td > span.inline-flex, td span.inline-flex').forEach(function (el) {
      var t = el.textContent.replace(/\s+/g, '');
      if (t.indexOf('승인됨') > -1 || t.indexOf('보류됨') > -1) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', function () {
          var icon = el.querySelector('.material-symbols-outlined');
          var approved = el.textContent.indexOf('승인됨') > -1;
          el.innerHTML = '<span class="material-symbols-outlined text-[16px]">' + (approved ? 'pending' : 'verified_user') + '</span> ' + (approved ? '보류됨' : '승인됨');
          toast(approved ? '보류로 변경' : '승인으로 변경');
        });
      }
    });
    // 스테퍼 클릭 — 라벨은 span
    qsa('span').forEach(function (s) {
      if (/^Step 0[1-4]$/.test(s.textContent.trim())) {
        var card = s.closest('div.flex.items-center');
        if (card) {
          card.style.cursor = 'pointer';
          card.addEventListener('click', function () { toast(s.textContent.trim() + ' 단계로 이동', s.parentElement.textContent.trim().slice(0, 40)); });
        }
      }
    });
  }

  console.log('[JobFilter] app.js loaded —', PAGE);
})();
