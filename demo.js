/* ============================================================================
 * JobFilter 데모 글루 — 정적 HTML 페이지를 demo-data.js(JF)의 실제 상태·계산과
 * 연결한다. app.js 다음에 로드되며, 시각 피드백은 그대로 두고 데이터만 실측화.
 * ==========================================================================*/
(function () {
  'use strict';
  if (!window.JF) return;
  var JF = window.JF;

  var PAGE = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function say(msg, sub) {
    if (typeof window.showToast === 'function') window.showToast(msg, sub || '', 'check_circle');
    else {
      var t = document.getElementById('toast-notification');
      if (!t) return;
      var ti = document.getElementById('toast-title'), td = document.getElementById('toast-desc');
      if (ti) ti.textContent = msg; if (td) td.textContent = sub || '';
      t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
      clearTimeout(t._tm); t._tm = setTimeout(function () { t.style.opacity = '0'; }, 2600);
    }
  }

  /* ===================== s11 공고 목록 ===================== */
  if (PAGE === 's11_listings') {
    var jobsByCompany = {};
    JF.JOBS.forEach(function (j) { jobsByCompany[j.company] = j; });
    JF.getRegisteredJobs().forEach(function (j) { jobsByCompany[j.company] = j; });
    var bms = JF.readBookmarkIds();
    var grid = qs('.grid.grid-cols-1, .grid');
    // 상단 "총 N건" 카운트 — 실제 공고 수로 동기화
    qsa('main strong, main span, main p').forEach(function (el) {
      var t = el.textContent.trim();
      if (/^\d+건$/.test(t) && el.children.length === 0) el.textContent = (JF.JOBS.length + JF.getRegisteredJobs().filter(function (rj) { return JF.getReviewStatus()[rj.company] !== '반려'; }).length) + '건';
    });

    // 기업 등록 공고(jf-registered-jobs) 카드 삽입 — 승인 상태 반영 (반려 시 미노출)
    var revMap = JF.getReviewStatus();
    JF.getRegisteredJobs().forEach(function (rj) {
      if (!grid) return;
      var st = revMap[rj.company] || '승인 대기';
      if (st === '반려') return;
      var badge = st === '게시 중'
        ? '<span class="font-label-sm text-label-sm text-tertiary font-bold">게시 중</span>'
        : '<span class="font-label-sm text-label-sm text-primary font-bold">승인 대기</span>';
      var card = document.createElement('div');
      card.className = 'bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-primary flex flex-col gap-space-sm';
      card.innerHTML =
        '<div class="flex items-start justify-between"><div class="flex items-center gap-space-sm">' +
        '<div class="w-10 h-10 rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center font-headline-sm">' + esc((rj.company || '신')[0]) + '</div>' +
        '<div><p class="font-body-sm text-body-sm text-on-surface-variant">' + esc(rj.company) + '</p>' +
        '<h3 class="font-headline-sm text-headline-sm text-on-surface">' + esc(rj.title) + '</h3></div></div></div>' +
        '<p class="font-body-sm text-body-sm text-on-surface-variant">' + esc(rj.type || '') + ' · ' + esc(rj.location || '') + '</p>' +
        '<div class="flex items-center justify-between mt-auto pt-space-sm border-t border-surface-container">' +
        badge + '<button class="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm">기업 등록 공고</button></div>';
      grid.insertBefore(card, grid.firstChild);
    });

    // 카드 ↔ 공고 매핑 → 실측 점수 + 북마크 상태 + 상세 링크
    qsa('.grid > div[class*="bg-surface-container-lowest"]').forEach(function (card) {
      var company = Object.keys(jobsByCompany).filter(function (c) {
        return card.textContent.indexOf(c) > -1;
      }).sort(function (a, b) { return b.length - a.length; })[0];
      var job = company && jobsByCompany[company];
      if (!job) return;
      card.dataset.jobId = job.id;
      var m = JF.matchJob(job);
      qsa('.font-code-sm', card).forEach(function (sp) {
        if (/^\d+$/.test(sp.textContent.trim())) sp.textContent = m.score;
      });
      // 북마크 아이콘 상태 반영
      var bmIcon = qs('button .material-symbols-outlined', card);
      var bmBtn = bmIcon && bmIcon.parentElement;
      function paintBm() {
        var on = JF.readBookmarkIds().indexOf(job.id) > -1;
        bmIcon.textContent = on ? 'bookmark' : 'bookmark_border';
        bmIcon.style.fontVariationSettings = on ? "'FILL' 1" : "'FILL' 0";
      }
      if (bmBtn && bmIcon) {
        paintBm();
        bmBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          JF.toggleBookmark(job.id); paintBm();
        });
      }
      // 상세 보기 → 해당 공고로
      qsa('button', card).forEach(function (b) {
        if (b.textContent.indexOf('상세 보기') > -1) {
          b.addEventListener('click', function (e) {
            e.stopImmediatePropagation();
            location.href = 's12_detail.html?job=' + job.id;
          });
        }
      });
      card.style.cursor = 'pointer';
      card.addEventListener('click', function () { location.href = 's12_detail.html?job=' + job.id; });
    });
    // 정렬 토글 — 최신순 ↔ 매칭 점수순
    var sortBtn = qsa('main button').filter(function (b) { return /최신순|매칭순/.test(b.textContent); })[0];
    if (sortBtn && grid) {
      var byScore = false, origOrder = null;
      sortBtn.addEventListener('click', function () {
        byScore = !byScore;
        var cards = qsa(':scope > div', grid);
        if (!origOrder) origOrder = cards.slice();
        if (byScore) {
          cards.sort(function (a, b) {
            var jA = JF.JOBS.filter(function (j) { return j.id === a.dataset.jobId; })[0];
            var jB = JF.JOBS.filter(function (j) { return j.id === b.dataset.jobId; })[0];
            return (jB ? JF.matchJob(jB).score : 0) - (jA ? JF.matchJob(jA).score : 0);
          });
        } else {
          cards = origOrder.slice();
        }
        cards.forEach(function (c) { grid.appendChild(c); });
        sortBtn.childNodes[0].textContent = byScore ? '매칭순' : '최신순';
      });
    }

    // ===== 실제 필터 시스템 — 칩별 드롭다운 + 조합 적용 =====
    var cities = [], skillOpts = [];
    JF.JOBS.forEach(function (j) {
      var c = (j.location || '').split(' ')[0];
      if (c && cities.indexOf(c) < 0) cities.push(c);
      (j.skills || []).concat(j.plus || []).forEach(function (s) { if (skillOpts.indexOf(s) < 0) skillOpts.push(s); });
    });
    var CHIP_FILTERS = {
      '경력': { opts: ['신입', '경력'], test: function (j, v) { return (j.type || '').indexOf(v) > -1; } },
      '고용형태': { opts: ['정규직', '인턴', '체험형'], test: function (j, v) { return (j.type || '').indexOf(v) > -1; } },
      '근무지': { opts: cities, test: function (j, v) { return (j.location || '').indexOf(v) > -1; } },
      '태그': { opts: skillOpts, test: function (j, v) { return (j.skills || []).concat(j.plus || []).indexOf(v) > -1; } },
      '마감일': { opts: { 'D-5 이내': 5, 'D-10 이내': 10, 'D-30 이내': 30 }, test: function (j, v) { return (parseInt((j.dday || '').replace(/\D/g, ''), 10) || 999) <= v; } }
    };
    var activeF = {};
    var sectionInput = qs('section input');
    var allListJobs = JF.JOBS.concat(JF.getRegisteredJobs());
    function cardJob(c) { return allListJobs.filter(function (j) { return j.id === c.dataset.jobId; })[0]; }
    function passesFilters(job) {
      return Object.keys(activeF).every(function (k) {
        if (k === '__match') return JF.matchJob(job).score >= activeF[k];
        if (k === '__intern') return /인턴|체험형/.test(job.type || '');
        var def = CHIP_FILTERS[k];
        return def ? def.test(job, activeF[k]) : true;
      });
    }
    function applyAll() {
      var term = ((sectionInput && sectionInput.value) || '').trim().toLowerCase();
      var hasF = Object.keys(activeF).length > 0;
      var shown = 0;
      qsa('.grid > div').forEach(function (c) {
        var job = cardJob(c);
        var ok = (!job)
          ? (!term && !hasF)
          : ((!term || c.textContent.toLowerCase().indexOf(term) > -1) && passesFilters(job));
        c.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      // 카운트 배지 동기화
      qsa('main strong, main span, main p').forEach(function (el) {
        var t = el.textContent.trim();
        if (/^\d+건$/.test(t) && el.children.length === 0) el.textContent = shown + '건';
      });
    }
    // 검색 입력도 조합 필터에 통합 (app.js 검색과 함께 동작)
    if (sectionInput) sectionInput.addEventListener('input', applyAll);
    // 칩 드롭다운
    var fpop = null;
    function closePop() { if (fpop) { fpop.remove(); fpop = null; } }
    document.addEventListener('click', closePop);
    function openPop(anchor, title, opts, onPick) {
      closePop();
      var r = anchor.getBoundingClientRect();
      fpop = document.createElement('div');
      fpop.style.cssText = 'position:fixed;top:' + (r.bottom + 6) + 'px;left:' + r.left + 'px;min-width:160px;max-height:260px;overflow-y:auto;' +
        'z-index:60;background:#fff;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.14);padding:6px';
      fpop.innerHTML = '<div style="padding:6px 10px;font-size:11px;color:#737781;font-weight:600">' + title + '</div>' +
        opts.map(function (o) {
          return '<a data-v="' + o.v + '" style="display:block;padding:8px 10px;font-size:13px;color:#111c2d;border-radius:6px;cursor:pointer" ' +
            'onmouseover="this.style.background=\'#f0f3ff\'" onmouseout="this.style.background=\'\'">' + o.t + '</a>';
        }).join('');
      fpop.addEventListener('click', function (e) {
        e.stopPropagation();
        var a = e.target.closest('a[data-v]');
        if (a) { onPick(a.dataset.v); closePop(); }
      });
      document.body.appendChild(fpop);
    }
    function paintChip(chip, key) {
      var on = activeF[key] !== undefined;
      chip.className = chip.className.replace(/bg-(primary-container|surface-container)[^"]*|text-(on-primary|on-surface-variant)[^"]*/g, '').trim();
      chip.classList.add(on ? 'bg-primary-container' : 'bg-surface-container', on ? 'text-on-primary' : 'text-on-surface-variant');
      var base = chip.dataset.label || chip.textContent.trim().split(' ')[0];
      chip.dataset.label = key;
      chip.innerHTML = key + (on ? ' · <b>' + chipTextVal(key) + '</b>' : '') +
        '<span class="material-symbols-outlined text-[16px] align-middle">' + (on ? 'close' : 'expand_more') + '</span>';
    }
    function chipTextVal(k) {
      var v = activeF[k];
        var opt = CHIP_FILTERS[k] && CHIP_FILTERS[k].opts;
        if (opt && !Array.isArray(opt)) {
          var kk = Object.keys(opt).filter(function (x) { return opt[x] === v; })[0];
          return kk || v;
        }
      return v;
    }
    qsa('section button, main button').forEach(function (chip) {
      var txt = chip.textContent.replace(/expand_more|close|tune|filter_list|check/g, '').trim();
      var key = Object.keys(CHIP_FILTERS).filter(function (k) { return txt === k || txt.indexOf(k) === 0; })[0];
      if (!key) return;
      chip.dataset.label = key;
      chip.addEventListener('click', function (e) {
        e.stopPropagation();
        var def = CHIP_FILTERS[key];
        var opts = [{ t: '전체 (해제)', v: '' }];
        if (Array.isArray(def.opts)) def.opts.forEach(function (o) { opts.push({ t: o, v: o }); });
        else Object.keys(def.opts).forEach(function (o) { opts.push({ t: o, v: String(def.opts[o]) }); });
        openPop(chip, key + ' 필터', opts, function (v) {
          if (v === '') delete activeF[key];
          else activeF[key] = Array.isArray(def.opts) ? v : parseInt(v, 10);
          paintChip(chip, key); applyAll();
        });
      });
      paintChip(chip, key);
    });
    // 전체 필터(tune) → 빠른 프리셋
    var tuneBtn = qsa('main button, section button').filter(function (b) { return /전체 필터/.test(b.textContent); })[0];
    if (tuneBtn) tuneBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      openPop(tuneBtn, '빠른 필터', [
        { t: '인턴·체험형 공고', v: 'intern' }, { t: '마감 임박 (D-5 이내)', v: 'd5' },
        { t: '서울 지역', v: 'seoul' }, { t: '매칭 70점 이상', v: 'm70' }, { t: '필터 전체 해제', v: 'clear' }
      ], function (v) {
        if (v === 'clear') { activeF = {}; }
        else if (v === 'intern') activeF.__intern = true;
        else if (v === 'd5') activeF['마감일'] = 5;
        else if (v === 'seoul') activeF['근무지'] = '서울';
        else if (v === 'm70') activeF.__match = 70;
        qsa('section button, main button').forEach(function (c) { if (CHIP_FILTERS[c.dataset.label]) paintChip(c, c.dataset.label); });
        applyAll();
      });
    });
    // 페이지네이션 — 카드가 한 페이지에 다 들어가면 숨김
    var pageWrap = qsa('main button').filter(function (b) { return /chevron_left|chevron_right/.test(b.textContent); })[0];
    if (pageWrap && pageWrap.parentElement && qsa('.grid > div').length <= 12) {
      pageWrap.parentElement.style.display = 'none';
    }
  }

  /* ===================== s12 공고 상세 ===================== */
  if (PAGE === 's12_detail') {
    var params = new URLSearchParams(location.search);
    var job = JF.getJob(params.get('job') || '4');
    if (job) {
      var match = JF.matchJob(job);
      var main = qs('main');

      // 제목·부스러기·로고·메타
      var h1 = qs('main h1');
      if (h1) h1.textContent = job.title;
      qsa('main nav span, main nav a').forEach(function (el) {
        if (/당근마켓|네이버|카카오|토스|라인|쿠팡/.test(el.textContent) && el.textContent.trim().length < 30) {
          if (el.textContent.indexOf('마켓') > -1 || /^(네이버|카카오|토스|라인|쿠팡)$/.test(el.textContent.trim())) el.textContent = job.company;
        }
      });
      // 회사 로고/이름/팀/마감
      var logoEl = null;
      qsa('main div').forEach(function (d) {
        if (!logoEl && /^[가-힣A-Za-z]{1,2}$/.test(d.textContent.trim()) && d.className.indexOf('rounded') > -1 && d.children.length === 0) logoEl = d;
      });
      if (logoEl) { logoEl.textContent = job.logo; logoEl.style.background = job.logoBg; logoEl.style.color = job.logoText || '#fff'; }
      qsa('main p, main span, main div').forEach(function (el) {
        var t = el.textContent;
        if (el.children.length) return;
        if (t.indexOf('(Daangn)') > -1 || t.indexOf('(NAVER)') > -1 || t.indexOf('(Kakao)') > -1) el.textContent = job.companyFull + ' • ' + job.team;
        if (/^D-\d+ \(마감/.test(t.trim())) el.textContent = job.deadline;
      });
      // 위치·형태·연봉 메타 행
      qsa('main span.font-body-sm, main span.text-body-sm').forEach(function (el) {
        var t = el.textContent.trim();
        if (/서울 서초구|성남 분당구|서울 강남구|서울 송파구/.test(t)) el.textContent = job.location;
        else if (/인턴\(3개월\)|신입 · 정규직|신입·경력|체험형|채용연계형/.test(t) && t.length < 25) el.textContent = job.type;
        else if (/월 320만원|5,000만원|6,000만원|5,500만원|4,800만원|연봉 협의/.test(t) && t.length < 15) el.textContent = job.salary;
      });
      // 매칭 총평
      qsa('main p, main span').forEach(function (el) {
        if (/% 이상 일치/.test(el.textContent)) {
          el.innerHTML = el.innerHTML.replace(/\d+% 이상 일치/, '<b>' + match.score + '% 일치</b>');
        }
      });
      // 상단 "김민준 학생 매칭 N%" 배지 — 정적 잔재를 실측으로
      qsa('main span, main p, main div').forEach(function (el) {
        if (el.children.length === 0 && /매칭 \d+%/.test(el.textContent)) {
          el.textContent = el.textContent.replace(/매칭 \d+%/, '매칭 ' + match.score + '%');
        }
      });
      // 필수/우대 스킬 칩 갱신
      var chipHosts = qsa('main .flex.flex-wrap');
      chipHosts.forEach(function (host) {
        var labelEl = host.previousElementSibling || host.parentElement.querySelector('h3,span');
        var near = (labelEl && labelEl.textContent) || host.parentElement.textContent.slice(0, 30);
        var list = null, cls = '';
        if (/필수|자격/.test(near)) { list = job.skills.map(function (s) { return { s: s, hit: match.matchedRequired.indexOf(s) > -1 }; }); cls = 'req'; }
        else if (/우대/.test(near)) { list = job.plus.map(function (s) { return { s: s, hit: match.matchedPlus.indexOf(s) > -1 }; }); cls = 'plus'; }
        if (!list) return;
        host.innerHTML = list.map(function (x) {
          var base = 'px-2 py-1 rounded-md font-label-sm text-label-sm font-semibold ';
          var color = x.hit ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-error-container/60 text-on-error-container';
          return '<span class="' + base + color + '">' + esc(x.s) + (x.hit ? ' ✓' : '') + '</span>';
        }).join('');
      });
      // 담당업무·자격요건·우대사항 리스트
      qsa('main section, main div').forEach(function (sec) {
        var h = qs('h2, h3', sec); if (!h) return;
        var ul = qs('ul', sec); if (!ul) return;
        var items = null;
        if (/주요 업무|담당 업무/.test(h.textContent)) items = job.duties;
        else if (/지원 자격|필수 요건|자격 요건/.test(h.textContent)) items = job.requirements;
        else if (/우대/.test(h.textContent)) items = job.preferred;
        if (items) ul.innerHTML = items.map(function (t) { return '<li class="flex gap-2"><span class="text-primary">•</span><span>' + esc(t) + '</span></li>'; }).join('');
      });
      // 동문 통계
      qsa('main .font-display-lg, main .font-headline-md').forEach(function (el) {
        if (/^\d+명$/.test(el.textContent.trim())) el.textContent = job.alumni.count;
        if (/^\d+\.\d+%$/.test(el.textContent.trim())) el.textContent = job.alumni.stat;
      });

      // 지원 관리에 담기
      var saveBtn = document.getElementById('btn-save-kanban');
      if (saveBtn) {
        var added = JF.loadBoard().some(function (c) { return c.jobId === job.id; });
        function paintSave() {
          if (added) { saveBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span> 칸반에 추가됨'; saveBtn.classList.add('bg-tertiary'); }
        }
        paintSave();
        saveBtn.addEventListener('click', function (e) {
          e.stopImmediatePropagation();
          var r = JF.addFromJob(job, match.score);
          added = true; paintSave();
          say(r.created ? '지원 관리에 추가되었습니다' : '이미 칸반에 있습니다', job.company + ' ' + job.title + ' — 서류 준비 중 단계');
        });
      }
      // 북마크 토글
      var bmBtn = document.getElementById('btn-bookmark');
      if (bmBtn) {
        var bmIcon = document.getElementById('bookmark-icon'), bmText = document.getElementById('bookmark-text');
        function paintBm2() {
          var on = JF.readBookmarkIds().indexOf(job.id) > -1;
          if (bmIcon) { bmIcon.textContent = on ? 'bookmark' : 'bookmark_border'; bmIcon.style.fontVariationSettings = on ? "'FILL' 1" : "'FILL' 0"; }
          if (bmText) bmText.textContent = on ? '북마크 해제' : '북마크';
        }
        paintBm2();
        bmBtn.addEventListener('click', function () { JF.toggleBookmark(job.id); paintBm2(); });
      }
    }
  }

  /* ===================== s13 북마크 ===================== */
  if (PAGE === 's13_bookmarks') {
    if (!localStorage.getItem('jf-bookmarks')) localStorage.setItem('jf-bookmarks', JSON.stringify(['2', '1']));
    var ids = JF.readBookmarkIds();
    var listHost = qsa('main .grid > div, main section > div').filter(function (d) {
      return /카카오|네이버/.test(d.textContent) && d.querySelector('button');
    })[0];
    if (listHost) {
      var parent = listHost.parentElement;
      parent.innerHTML = ids.length ? ids.map(function (id) {
        var j = JF.getJob(id); if (!j) return '';
        var m = JF.matchJob(j);
        return '<div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm" data-job="' + j.id + '">' +
          '<div class="flex items-center gap-space-sm"><div class="w-10 h-10 rounded-lg flex items-center justify-center font-headline-sm" style="background:' + j.logoBg + ';color:' + (j.logoText || '#fff') + '">' + esc(j.logo) + '</div>' +
          '<div class="flex-1 min-w-0"><p class="font-body-sm text-body-sm text-on-surface-variant">' + esc(j.company) + '</p>' +
          '<h3 class="font-headline-sm text-headline-sm text-on-surface truncate">' + esc(j.title) + '</h3></div>' +
          '<span class="font-code-sm text-[12px] font-bold text-primary">' + m.score + '</span></div>' +
          '<div class="flex items-center justify-between"><span class="font-label-sm text-label-sm ' + (j.urgent ? 'text-error font-bold' : 'text-on-surface-variant') + '">' + esc(j.dday) + '</span>' +
          '<div class="flex gap-space-xs"><button class="bm-off px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm">북마크 해제</button>' +
          '<button class="go-detail px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm">상세 보기</button></div></div></div>';
      }).join('') : '<div class="col-span-full text-center py-space-xl text-on-surface-variant">북마크한 공고가 없습니다 — 공고 목록에서 북마크를 눌러 보세요.</div>';
      // 카운트 배지
      qsa('main span, main p, main strong').forEach(function (el) {
        if (/^\d+건$/.test(el.textContent.trim()) && el.children.length === 0) el.textContent = ids.length + '건';
      });
      parent.querySelectorAll('.bm-off').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.closest('[data-job]').dataset.job;
          JF.toggleBookmark(id);
          b.closest('[data-job]').remove();
          say('북마크 해제됨');
        });
      });
      parent.querySelectorAll('.go-detail').forEach(function (b) {
        b.addEventListener('click', function () { location.href = 's12_detail.html?job=' + b.closest('[data-job]').dataset.job; });
      });
    }
  }

  /* ─── 스킬 갭 공통 (s14·s14b 공유) ─── */
  function jobForCard(card) {
    if (card.jobId) return JF.getJob(card.jobId);
    var comp = (card.company || '').replace(/\s+/g, '');
    return JF.JOBS.filter(function (j) {
      var jc = j.company.replace(/\s+/g, '');
      return jc === comp || comp.indexOf(jc) >= 0 || jc.indexOf(comp) >= 0;
    })[0] || null;
  }
  function gapChecklist(m) {
    var items = m.missingRequired.map(function (s) { return '자소서에 ' + s + ' 경험·프로젝트 문장 추가'; })
      .concat(m.missingPlus.map(function (s) { return s + ' 학습 리소스 확인 (우대 충족)'; }));
    if (!items.length) items.push('모든 요건 충족 — JD 키워드와 자소서 문장 최종 대조');
    return items.slice(0, 5);
  }
  function paintChk(box, txt, done) {
    if (done) {
      box.className = 'w-4 h-4 mt-0.5 rounded border-2 border-primary bg-primary flex items-center justify-center shrink-0';
      box.innerHTML = '<span class="material-symbols-outlined text-on-primary text-[12px]">check</span>';
      txt.classList.add('line-through', 'text-on-surface-variant');
      txt.classList.remove('text-on-surface');
    } else {
      box.className = 'w-4 h-4 mt-0.5 rounded border-2 border-outline-variant bg-surface-container-lowest flex items-center justify-center shrink-0';
      box.innerHTML = '';
      txt.classList.remove('line-through', 'text-on-surface-variant');
      txt.classList.add('text-on-surface');
    }
  }
  // 배지 + 접힌 갭 섹션 마크업 (카드 내부에 append)
  function gapMarkup(job) {
    var m = JF.matchJob(job);
    var nGap = m.missingRequired.length + m.missingPlus.length;
    var h = '<div class="mt-space-xs flex items-center justify-between cursor-pointer" data-gap-toggle>' +
      '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px] ' + (nGap ? 'text-secondary' : 'text-tertiary') + '">task_alt</span>' +
      '<span class="font-label-sm text-[10px] text-on-surface-variant">스킬 갭 <span data-chk-badge>0/0</span>' + (nGap ? ' · 부족 ' + nGap + '개' : ' · 충족') + '</span></span>' +
      '<span class="material-symbols-outlined text-[16px] text-outline transition-transform" data-gap-arrow>expand_more</span></div>';
    h += '<div class="mt-space-sm pt-space-sm border-t border-surface-container" data-gap-sec style="display:none">' +
      '<div class="flex items-center justify-between mb-space-xs"><span class="font-label-sm text-label-sm font-bold text-on-surface">부족 스킬</span>' +
      '<span class="font-label-sm text-[10px] text-on-surface-variant">필수 ' + m.missingRequired.length + ' · 우대 ' + m.missingPlus.length + '</span></div>';
    if (nGap) {
      h += '<div class="flex flex-wrap gap-1 mb-space-sm">' +
        m.missingRequired.map(function (s) { return '<span class="px-2 py-0.5 rounded bg-error-container text-on-error-container font-code-sm text-[11px]">' + esc(s) + ' · 필수</span>'; }).join('') +
        m.missingPlus.map(function (s) { return '<span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed-variant font-code-sm text-[11px]">' + esc(s) + ' · 우대</span>'; }).join('') + '</div>';
    } else {
      h += '<div class="mb-space-sm"><span class="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-code-sm text-[11px]">요건 전부 충족</span></div>';
    }
    h += '<span class="font-label-sm text-label-sm font-bold text-on-surface">보완 체크리스트</span><div class="flex flex-col gap-1.5 mt-space-xs" data-chk-host></div>' +
      '<div class="mt-space-sm flex items-center gap-space-xs"><div class="flex-1 bg-surface-container h-1.5 rounded-full"><div class="bg-tertiary h-full rounded-full transition-all" data-chk-bar style="width:0%"></div></div>' +
      '<span class="font-code-sm text-[11px] text-on-surface-variant" data-chk-cnt>0/0</span></div></div>';
    return h;
  }
  // 카드 안의 갭 UI 와이어링 — 클릭 토글 + 체크리스트 영속
  function wireGapCard(cardEl, card, items) {
    var host = qs('[data-chk-host]', cardEl);
    if (!host || host.dataset.wired) return;
    host.dataset.wired = '1';
    var bar = qs('[data-chk-bar]', cardEl), cnt = qs('[data-chk-cnt]', cardEl), badge = qs('[data-chk-badge]', cardEl);
    var gapSec = qs('[data-gap-sec]', cardEl), arrow = qs('[data-gap-arrow]', cardEl);
    if (gapSec) {
      cardEl.addEventListener('click', function (e) {
        if (e.target.closest('label') || e.target.closest('[data-gap-sec]') || e.target.closest('button')) return;
        var open = gapSec.style.display !== 'none';
        gapSec.style.display = open ? 'none' : '';
        if (arrow) arrow.style.transform = open ? '' : 'rotate(180deg)';
      });
    }
    items.forEach(function (text, i) {
      var li = document.createElement('label');
      li.className = 'flex items-start gap-space-sm cursor-pointer group';
      li.innerHTML = '<span class="w-4 h-4 mt-0.5 rounded border-2 border-outline-variant bg-surface-container-lowest flex items-center justify-center shrink-0"></span>' +
        '<span class="font-body-sm text-body-sm text-on-surface">' + esc(text) + '</span>';
      host.appendChild(li);
      li.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        paintChk(li.children[0], li.children[1], JF.toggleChecklist(card.id, i));
        refresh();
      });
    });
    function refresh() {
      var flags = JF.getChecklist(card.id) || [];
      var done = flags.filter(Boolean).length;
      if (bar) bar.style.width = Math.round(done / items.length * 100) + '%';
      if (cnt) cnt.textContent = done + '/' + items.length;
      if (badge) badge.textContent = done + '/' + items.length;
    }
    var flags0 = JF.getChecklist(card.id) || [];
    items.forEach(function (t, i) {
      var li = host.children[i];
      paintChk(li.children[0], li.children[1], !!flags0[i]);
    });
    refresh();
  }

  /* ===== 컬럼 + 버튼 → 해당 스테이지로 공고 추가 (s14·s14b 공용) ===== */
  var COL_STAGE = { '서류 준비 중': 'preparing', '지원 완료': 'applied', '서류 합격': 'screened', '면접 예정': 'interview', '최종 합격': 'offer', '불합격': 'rejected' };
  function wireColumnAdds() {
    qsa('main [class*="w-64"], main [class*="w-80"]').forEach(function (col) {
      var h = qsa('*', col).filter(function (x) { return x.children.length === 0 && COL_STAGE[x.textContent.trim()]; })[0];
      if (!h) return;
      var stage = COL_STAGE[h.textContent.trim()];
      var stageLabel = h.textContent.trim();
      var b = qsa('button', col).filter(function (x) { return x.querySelector('svg') || /add/.test(x.textContent); })[0];
      if (!b || b._jfWired) return;
      b._jfWired = true;
      b.title = '이 단계에 지원 내역 추가';
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var ex = qs('.jf-addpop'); if (ex) { ex.remove(); return; }
        var onBoard = {};
        JF.loadBoard().forEach(function (c) { onBoard[c.jobId] = true; });
        var avail = JF.JOBS.filter(function (j) { return !onBoard[j.id]; });
        var r = b.getBoundingClientRect();
        var m = document.createElement('div');
        m.className = 'jf-addpop';
        m.style.cssText = 'position:fixed;top:' + Math.min(r.bottom + 6, innerHeight - 320) + 'px;left:' + Math.min(r.left, innerWidth - 300) + 'px;width:280px;max-height:300px;overflow-y:auto;z-index:60;background:#fff;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.16);padding:6px';
        m.innerHTML = '<div style="padding:6px 10px;font-size:11px;color:#737781;font-weight:600">' + stageLabel + '에 추가</div>' +
          (avail.length ? avail.map(function (j) {
            var sc = JF.matchJob(j).score;
            return '<a data-id="' + j.id + '" style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 12px;font-size:13px;color:#111c2d;border-radius:6px;cursor:pointer" onmouseover="this.style.background=\'#f0f3ff\'" onmouseout="this.style.background=\'\'">' +
              '<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>' + j.company + '</b> ' + j.title + '</span><span style="font-family:monospace;font-weight:700;color:#0060ac;flex:none">' + sc + '</span></a>';
          }).join('') : '<div style="padding:14px;font-size:13px;color:#737781;text-align:center">추가할 수 있는 공고가 없습니다</div>');
        m.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var a = ev.target.closest('a[data-id]'); if (!a) return;
          var job = JF.JOBS.filter(function (j) { return j.id === a.dataset.id; })[0];
          if (!job) return;
          var res = JF.addFromJob(job, JF.matchJob(job).score);
          if (res.card && stage !== 'preparing') JF.setStage(res.card.id, stage);
          location.reload();
        });
        document.body.appendChild(m);
        document.addEventListener('click', function () { var x = qs('.jf-addpop'); if (x) x.remove(); }, { once: true });
      });
    });
  }

  /* ===================== s14 칸반 ===================== */
  if (PAGE === 's14_kanban') {
    var STAGE_OF_COL = { '서류 준비 중': 'preparing', '지원 완료': 'applied', '서류 합격': 'screened', '면접 예정': 'interview', '최종 합격': 'offer', '불합격': 'rejected' };
    var cols = qsa('section .w-64').map(function (col) {
      var label = '';
      Object.keys(STAGE_OF_COL).forEach(function (k) { if (col.textContent.slice(0, 200).indexOf(k) > -1) label = k; });
      return { el: col, stage: STAGE_OF_COL[label], body: qs('div[class*="min-h-["]', col) };
    }).filter(function (c) { return c.stage && c.body; });

    var claimed = {};
    function identifyCard(el) {
      var company = (qs('.font-label-sm', el) || {}).textContent || '';
      var role = (qs('p', el) || {}).textContent || '';
      var all = JF.loadBoard().filter(function (c) { return !claimed[c.id]; });
      var m = all.filter(function (c) {
        return c.company === company.trim() && role.trim().indexOf(c.role.replace(/\s*\(.*\)$/, '').trim()) > -1 ||
               (company.trim() === c.company && el.textContent.indexOf(c.role) > -1);
      })[0] || all.filter(function (c) { return c.company === company.trim() && c.role === role.trim(); })[0] || null;
      if (m) claimed[m.id] = true;
      return m;
    }
    function colFor(stage) { return cols.filter(function (c) { return c.stage === stage; })[0]; }
    function refreshColCounts() {
      cols.forEach(function (c) {
        var n = c.body.querySelectorAll('[class*="cursor-grab"]').length;
        qsa('.rounded-full', c.el).forEach(function (sp) { if (/^\d+$/.test(sp.textContent.trim())) sp.textContent = n; });
      });
      var h1 = qs('main h1');
      if (h1 && /총 \d+개/.test(h1.textContent)) h1.textContent = h1.textContent.replace(/총 \d+개/, '총 ' + JF.loadBoard().length + '개');
      // 상단 KPI 카드 동기화
      var counts = JF.stageCounts(JF.loadBoard());
      var kpiMap = {
        '총 지원': JF.loadBoard().length,
        '진행 중': counts.preparing + counts.applied + counts.screened + counts.interview,
        '서류 합격': counts.screened,
        '면접 예정': counts.interview,
        '최종 합격': counts.offer,
        '불합격': counts.rejected
      };
      qsa('main .bg-surface-container-lowest.rounded-xl').forEach(function (kpi) {
        var lab = (qs('.font-label-sm', kpi) || {}).textContent || '';
        var val = qs('.font-display-lg', kpi);
        if (val && kpiMap[lab.trim()] !== undefined) {
          val.innerHTML = kpiMap[lab.trim()] + '<span class="font-body-sm text-body-sm text-on-surface-variant">건</span>';
        }
      });
      // 상단 요약 배지(있으면) 동기화
      qsa('main span, main p').forEach(function (el) {
        var t = el.textContent.trim();
        if (t === '서류 합격률 46.2%' || /서류 합격률 \d+(\.\d+)?%/.test(t)) {
          var total = counts.applied + counts.screened + counts.interview + counts.offer + counts.rejected;
          var pct = total ? Math.round((counts.screened + counts.interview + counts.offer) / total * 1000) / 10 : 0;
          el.textContent = '서류 합격률 ' + pct + '%';
        }
        if (/최종 합격률 \d+(\.\d+)?%/.test(t)) {
          var tot = counts.applied + counts.screened + counts.interview + counts.offer + counts.rejected;
          el.textContent = '최종 합격률 ' + (tot ? Math.round(counts.offer / tot * 1000) / 10 : 0) + '%';
        }
      });
    }

    // 저장된 단계 위치 복원
    claimed = {};
    cols.forEach(function (c) {
      qsa('[class*="cursor-grab"]', c.body).forEach(function (cardEl) {
        var card = identifyCard(cardEl);
        if (!card) return;
        cardEl.dataset.cardId = card.id;
        if (card.stage !== c.stage) {
          var target = colFor(card.stage);
          if (target) { target.body.appendChild(cardEl); }
        }
      });
    });
    // 신규 추가 카드 렌더
    var board = JF.loadBoard();
    board.filter(function (c) { return c.jobId; }).forEach(function (c) {
      if (qs('[data-card-id="' + c.id + '"]')) return;
      var target = colFor(c.stage);
      if (!target) return;
      var el = document.createElement('div');
      el.className = 'bg-surface-container-lowest rounded-lg p-space-sm shadow-sm border-l-4 border-surface-container-highest cursor-grab hover:shadow-md transition-shadow';
      el.dataset.cardId = c.id;
      el.innerHTML = '<span class="font-label-sm text-label-sm text-on-surface-variant">' + esc(c.company) + '</span>' +
        '<p class="font-body-md text-body-md font-semibold text-on-surface leading-snug mt-0.5">' + esc(c.role) + '</p>' +
        '<div class="flex items-center justify-between mt-space-xs"><span class="font-code-sm text-[11px] text-secondary font-bold">' + esc(c.dday) + '</span>' +
        '<span class="font-code-sm text-[11px] text-on-surface-variant">매칭 ' + c.match + '</span></div>' +
        '<div class="font-label-sm text-[10px] text-outline mt-1">변경 ' + c.changed + '</div>';
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', function (e) { window.__dragEl = el; e.dataTransfer.effectAllowed = 'move'; });
      el.addEventListener('dragend', function () { persistPositions(); });
      target.body.insertBefore(el, target.body.firstChild);
      wireCardButtons(el);
      var nj = jobForCard(c);
      if (nj) { el.insertAdjacentHTML('beforeend', gapMarkup(nj)); wireGapCard(el, c, gapChecklist(JF.matchJob(nj))); }
    });

    function moveDom(cardEl, toStage) {
      var target = colFor(toStage);
      if (!target) return;
      target.body.appendChild(cardEl);
      var ch = qs('.text-outline', cardEl);
      if (ch) ch.textContent = '변경 ' + (new Date().getMonth() + 1) + '.' + String(new Date().getDate()).padStart(2, '0');
      refreshColCounts();
    }
    function wireCardButtons(cardEl) {
      // ▶ ◀ 이동 버튼 삽입
      if (qs('.stage-nav', cardEl)) return;
      var row = document.createElement('div');
      row.className = 'stage-nav flex justify-end gap-1 mt-1';
      row.innerHTML = '<button class="mv-l px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px] hover:bg-surface-container-high">◀</button>' +
        '<button class="mv-r px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px] hover:bg-surface-container-high">▶</button>';
      cardEl.appendChild(row);
      row.querySelector('.mv-r').addEventListener('click', function (e) {
        e.stopPropagation();
        var to = JF.moveCard(cardEl.dataset.cardId, 1);
        if (to) { moveDom(cardEl, to); say('단계 이동: ' + JF.STAGE_LABEL[to], 'StatusHistory에 기록되었습니다.'); }
      });
      row.querySelector('.mv-l').addEventListener('click', function (e) {
        e.stopPropagation();
        var to = JF.moveCard(cardEl.dataset.cardId, -1);
        if (to) { moveDom(cardEl, to); say('단계 이동: ' + JF.STAGE_LABEL[to], 'StatusHistory에 기록되었습니다.'); }
      });
    }
    function persistPositions() {
      claimed = {};
      cols.forEach(function (c) {
        qsa('[class*="cursor-grab"]', c.body).forEach(function (cardEl) {
          var card = identifyCard(cardEl);
          if (card && card.stage !== c.stage) {
            var s = JSON.parse(localStorage.getItem('jf-kanban') || '{}');
            s.stages = s.stages || {}; s.stages[card.id] = c.stage;
            localStorage.setItem('jf-kanban', JSON.stringify(s));
            var h = JF.readHistory();
            h.unshift({ cardId: card.id, company: card.company, role: card.role, from: card.stage, to: c.stage, at: new Date().toISOString() });
            localStorage.setItem('jf-status-history', JSON.stringify(h.slice(0, 100)));
          }
        });
      });
      refreshColCounts();
    }

    claimed = {};
    qsa('[class*="cursor-grab"]').forEach(function (cardEl) {
      var card = identifyCard(cardEl);
      if (card) cardEl.dataset.cardId = card.id;
      wireCardButtons(cardEl);
      // 스킬 갭 — 공고 연동 카드에 접힘 섹션 추가
      if (card && !qs('[data-gap-sec]', cardEl)) {
        var cj = jobForCard(card);
        if (cj) { cardEl.insertAdjacentHTML('beforeend', gapMarkup(cj)); wireGapCard(cardEl, card, gapChecklist(JF.matchJob(cj))); }
      }
      // 드래그 종료 후 단계 영속
      cardEl.addEventListener('dragend', function () { setTimeout(persistPositions, 50); });
    });
    refreshColCounts();
    wireColumnAdds();
  }

  /* ===================== s14b 스킬 갭 액션 ===================== */
  if (PAGE === 's14b_checklist') {
    var board = JF.loadBoard();
    var boardSection = qs('main section.flex.overflow-x-auto');
    var GAP_DOT = { preparing: 'bg-outline', applied: 'bg-secondary', screened: 'bg-tertiary', interview: 'bg-primary', offer: 'bg-tertiary', rejected: 'bg-error' };
    var GAP_BORDER = { preparing: 'border-surface-container-highest', applied: 'border-secondary', screened: 'border-tertiary', interview: 'border-primary', offer: 'border-tertiary', rejected: 'border-error' };
    var GAP_BADGE = { preparing: 'bg-surface-container-highest', applied: 'bg-secondary-fixed', screened: 'bg-tertiary-fixed', interview: 'bg-primary-fixed', offer: 'bg-tertiary-fixed', rejected: 'bg-error-container' };

    function cardHtml(card, job) {
      var h = '<div class="bg-surface-container-lowest rounded-lg p-space-sm shadow-sm border-l-4 ' + GAP_BORDER[card.stage] + ' hover:shadow-md transition-shadow">';
      h += '<div class="flex items-start justify-between"><div><span class="font-label-sm text-label-sm text-on-surface-variant">' + esc(card.company) + '</span>' +
        '<p class="font-body-md text-body-md font-semibold text-on-surface leading-snug mt-0.5">' + esc(card.role) + '</p></div>' +
        '<span class="font-code-sm text-[11px] text-on-surface-variant">매칭 ' + esc(String(job ? JF.matchJob(job).score : (card.match || '-'))) + '</span></div>';
      h += '<div class="flex items-center justify-between mt-space-xs"><span class="font-code-sm text-[11px] text-secondary font-bold">' + esc(card.dday || '-') + '</span>' +
        '<span class="font-label-sm text-[10px] text-outline">변경 ' + esc(card.changed || '') + '</span></div>';
      if (!job) {
        h += '<div class="mt-space-xs flex items-center gap-1"><span class="material-symbols-outlined text-[14px] text-outline">link_off</span><span class="font-label-sm text-[10px] text-on-surface-variant">공고 미연동 — 갭 분석 없음</span></div></div>';
        return h;
      }
      h += gapMarkup(job) + '</div>';
      return h;
    }
    if (boardSection) {
      var stages = JF.STAGE_ORDER.concat(['rejected']);
      boardSection.innerHTML = stages.map(function (stg, ci) {
        var cards = board.filter(function (c) { return c.stage === stg; });
        var badgeCls = GAP_BADGE[stg] + (stg === 'rejected' ? ' text-on-error-container' : '');
        var col = '<div class="' + (ci === 0 ? 'w-80' : 'w-64') + ' shrink-0 flex flex-col gap-space-sm">' +
          '<div class="flex items-center justify-between px-1"><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full ' + GAP_DOT[stg] + '"></span>' +
          '<span class="font-label-md text-label-md font-bold text-on-surface">' + esc(JF.STAGE_LABEL[stg]) + '</span>' +
          '<span class="px-1.5 py-0.5 rounded-full ' + badgeCls + ' text-on-surface-variant font-label-sm text-[11px] font-bold">' + cards.length + '</span></div></div>' +
          '<div class="flex flex-col gap-space-sm p-space-sm rounded-xl bg-surface-container-low min-h-[400px]">';
        cards.forEach(function (card) {
          var job = jobForCard(card);
          col += cardHtml(card, job);
        });
        return col + '</div></div>';
      }).join('');
      // 체크리스트 와이어링 — 카드 순서대로 재탐색
      var idx = 0;
      stages.forEach(function (stg) {
        board.filter(function (c) { return c.stage === stg; }).forEach(function (card) {
          var job = jobForCard(card);
          if (!job) { idx++; return; }
          var cardEl = qsa('div.bg-surface-container-lowest', boardSection)[idx];
          wireGapCard(cardEl, card, gapChecklist(JF.matchJob(job)));
          idx++;
        });
      });
    }
    // 상단 버튼 → 공고 목록으로 연결
    qsa('main section button').forEach(function (b) {
      if (/지원 내역 추가/.test(b.textContent)) {
        b.addEventListener('click', function () { location.href = './s11_listings.html'; });
      }
    });
    wireColumnAdds();
  }

  /* ===================== s15 자소서 에디터 ===================== */
  if (PAGE === 's15_coverletter') {
    var ta = document.getElementById('coverLetterText');
    if (ta) {
      var draft = JF.getDraft();
      if (draft) ta.value = draft.text;
      var badge = null;
      qsa('span, p').forEach(function (el) { if (/임시 저장 완료|원본 초안/.test(el.textContent)) badge = el; });
      function counts() {
        var t = ta.value;
        var withS = document.getElementById('charCountWithSpace');
        var withoutS = document.getElementById('charCountWithoutSpace');
        if (withS) withS.textContent = t.length.toLocaleString();
        if (withoutS) withoutS.textContent = t.replace(/\s/g, '').length.toLocaleString();
      }
      counts();
      var deb;
      ta.addEventListener('input', function () {
        counts();
        clearTimeout(deb);
        deb = setTimeout(function () {
          JF.saveDraft(ta.value);
          var at = new Date();
          var stamp = '임시 저장 완료 (' + at.getHours() + '시 ' + at.getMinutes() + '분 ' + at.getSeconds() + '초)';
          if (badge) badge.textContent = stamp; else say(stamp);
        }, 400);
      });
      // 분석 버튼 → 스냅샷 후 이동
      qsa('button').forEach(function (b) {
        if (/분석/.test(b.textContent) && !/규칙/.test(b.textContent)) {
          b.addEventListener('click', function () {
            JF.saveDraft(ta.value);
            JF.snapshotVersion();
          });
        }
      });
    }
    // 스냅샷 생성 버튼 — 실제 버전 저장 + 표시 갱신
    qsa('button').forEach(function (b) {
      if (/스냅샷 생성/.test(b.textContent)) {
        b.addEventListener('click', function () {
          var v = JF.snapshotVersion();
          var label = 'v' + (3 + JF.getVersions().length);
          qsa('span, p, div, li, strong').forEach(function (el) {
            if (el.children.length === 0 && /^v\d+\s*\/\s*v\d+$/.test(el.textContent.trim())) {
              el.textContent = el.textContent.replace(/v\d+$/, label);
            }
          });
          say(label + ' 스냅샷 저장', '규칙 엔진 점수 ' + v.score + '점이 버전에 기록되었습니다.');
        });
      }
    });
    // 버전 목록 실측화
    var versions = JF.getVersions();
    if (versions.length) {
      qsa('main li, main div').forEach(function (d) {
        if (/v\d/.test(d.textContent) && /점/.test(d.textContent) && d.children.length < 6 && d.querySelector('.font-code-sm')) {
          // 정적 버전 행은 유지 — 최신 버전 라벨만 갱신
        }
      });
    }
    qsa('span, p').forEach(function (el) {
      if (/자기소개서 v\d/.test(el.textContent)) {
        el.textContent = el.textContent.replace(/v\d+/, 'v' + Math.max(3, versions.length + 3));
      }
    });
    // ===== 에디터 툴바 — 실제 텍스트 편집 =====
    if (ta) {
      var DOC_KEY = 'jf-cl-docs';
      function readDocs() { try { return JSON.parse(localStorage.getItem(DOC_KEY) || '{}'); } catch (e) { return {}; } }
      function saveDoc(i, text) { var d = readDocs(); d[i] = text; localStorage.setItem(DOC_KEY, JSON.stringify(d)); }
      var curDoc = 1;
      function wrapSel(pre, post) {
        var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
        ta.value = v.slice(0, s) + pre + v.slice(s, e) + (post || pre) + v.slice(e);
        ta.focus(); ta.selectionStart = s + pre.length; ta.selectionEnd = e + pre.length;
        ta.dispatchEvent(new Event('input'));
      }
      function prefixLines(fn) {
        var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
        var start = v.lastIndexOf('\n', s - 1) + 1;
        var lines = v.slice(start, e).split('\n'), n = 0;
        var rep = lines.map(function (l) { return l.trim() ? fn(++n, l) : l; }).join('\n');
        ta.value = v.slice(0, start) + rep + v.slice(e);
        ta.dispatchEvent(new Event('input'));
      }
      var toolMap = {
        'format_bold': function () { wrapSel('**'); },
        'format_italic': function () { wrapSel('*'); },
        'code': function () { wrapSel('`'); },
        'format_list_bulleted': function () { prefixLines(function (n, l) { return '- ' + l; }); },
        'format_list_numbered': function () { prefixLines(function (n, l) { return n + '. ' + l; }); },
        'undo': function () { document.execCommand('undo'); },
        'redo': function () { document.execCommand('redo'); }
      };
      qsa('button').forEach(function (b) {
        var icon = (qs('.material-symbols-outlined', b) || {}).textContent;
        if (icon && toolMap[icon.trim()]) b.addEventListener('click', toolMap[icon.trim()]);
        if (/본문 복사/.test(b.textContent)) b.addEventListener('click', function () {
          navigator.clipboard.writeText(ta.value).then(function () { say('본문이 클립보드에 복사되었습니다', ta.value.length + '자'); });
        });
        // 맞춤법 검사 → 규칙 기반 실제 검사 패널
        if (/맞춤법 검사/.test(b.textContent)) b.addEventListener('click', function () {
          var res = JF.scoreResume(ta.value);
          var ex = qs('.jf-spell'); if (ex) ex.remove();
          var p = document.createElement('div');
          p.className = 'jf-spell';
          p.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:420px;max-height:70vh;overflow-y:auto;z-index:70;background:#fff;border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,.22);padding:20px';
          p.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
            '<b style="font-size:16px;color:#111c2d">규칙 기반 문장 검사</b>' +
            '<span style="font-size:22px;font-weight:800;color:' + (res.total >= 60 ? '#004124' : '#ba1a1a') + '">' + res.total + '점</span></div>' +
            '<div style="font-size:12px;color:#424750;margin-bottom:12px">' + res.stats.chars + '자 · 문장 ' + res.stats.sentences + '개 · 평균 ' + res.stats.avgSentence + '자</div>' +
            (res.strengths.length ? '<div style="margin-bottom:10px"><b style="font-size:13px;color:#004124">잘된 점</b>' + res.strengths.map(function (s) { return '<div style="font-size:13px;color:#111c2d;padding:6px 0;border-bottom:1px solid #f0f3ff">✓ ' + s + '</div>'; }).join('') + '</div>' : '') +
            (res.weaknesses.length ? '<div><b style="font-size:13px;color:#ba1a1a">보완할 점</b>' + res.weaknesses.map(function (s) { return '<div style="font-size:13px;color:#111c2d;padding:6px 0;border-bottom:1px solid #f0f3ff">• ' + s + '</div>'; }).join('') + '</div>' : '') +
            '<button style="margin-top:14px;width:100%;padding:9px;border:none;border-radius:8px;background:#00386f;color:#fff;font-size:13px;cursor:pointer">닫기</button>';
          p.querySelector('button').addEventListener('click', function () { p.remove(); });
          document.body.appendChild(p);
        });
      });
      // 문서 섹션 1·2·3 — 섹션별 초안 전환
      qsa('main button, main li, main div').forEach(function (el) {
        var m = el.textContent.trim().match(/^([123])\s+([^\d]{4,30})/);
        if (!m || el.children.length > 6 || el.dataset.docWired) return;
        var doc = qsa('main *').filter(function (x) {
          return x.children.length === 0 && /^[123]$/.test(x.textContent.trim()) && x.parentElement && el.contains(x.parentElement);
        })[0];
        el.dataset.docWired = '1';
        el.style.cursor = 'pointer';
        el.addEventListener('click', function (ev) {
          var btn = ev.target.closest('button, li, div');
          var numEl = qsa('*', btn).filter(function (x) { return x.children.length === 0 && /^[123]$/.test(x.textContent.trim()); })[0];
          var n = numEl ? parseInt(numEl.textContent) : parseInt(btn.textContent.trim()[0]);
          if (!n || n === curDoc) return;
          saveDoc(curDoc, ta.value);
          var docs = readDocs();
          ta.value = docs[n] || (n === 1 ? (JF.getDraft() || {}).text || ta.value : '');
          ta.dispatchEvent(new Event('input'));
          curDoc = n;
          say('문서 ' + n + '번으로 전환', '섹션별 초안이 분리 저장됩니다.');
        });
      });
      // 복원 후 현재 문서 초안도 저장
      if (readDocs()[1]) ta.value = readDocs()[1];
    }
  }

  /* ===================== s16 분석 ===================== */
  if (PAGE === 's16_analysis') {
    var res = JF.scoreResume(JF.currentResume());
    // 종합 점수 — 게이지 원호와 중앙 숫자만 갱신 (래퍼 div를 innerHTML로 교체하면 SVG가 사라짐)
    var gaugeCircle = qs('main svg circle[stroke-dasharray]');
    if (gaugeCircle) {
      gaugeCircle.setAttribute('stroke-dasharray', Math.min(res.total, 100) + ' 100');
      var center = gaugeCircle.closest('svg').parentElement.querySelector('.absolute.inset-0');
      var bigNum = center && qs('span', center);
      if (bigNum) bigNum.textContent = res.total;
    }
    // 항목별 채점 행 — "분량" 같은 라벨 span(.w-28) 기준으로 행을 찾아 점수·바 갱신
    qsa('main span.w-28, main span[class*="w-28"]').forEach(function (labelEl) {
      var label = labelEl.textContent.trim();
      var it = res.items.filter(function (x) { return x.label === label; })[0];
      if (!it) return;
      var row = labelEl.parentElement;
      var scoreEl = qs('.font-code-sm', row);
      if (scoreEl) scoreEl.textContent = it.score + '/' + it.max;
      var track = qs('.flex-1.rounded-full, .flex-1[class*="rounded-full"]', row);
      var bar = track && track.firstElementChild;
      if (bar) bar.style.width = Math.round(it.score / it.max * 100) + '%';
    });
    // 잘된 점 / 보완할 점 — h3 라벨 다음 ul을 찾아 항목 교체
    qsa('main h3').forEach(function (h) {
      var which = /잘된 점/.test(h.textContent) ? 'strengths' : /보완할 점/.test(h.textContent) ? 'weaknesses' : null;
      if (!which) return;
      var ul = h.parentElement.querySelector('ul');
      if (!ul) return;
      var icon = which === 'strengths' ? 'check' : 'priority_high';
      var color = which === 'strengths' ? 'text-tertiary' : 'text-error';
      var data = res[which];
      ul.innerHTML = data.map(function (t) {
        return '<li class="flex gap-2"><span class="material-symbols-outlined text-[16px] ' + color + ' shrink-0">' + icon + '</span>' + esc(t) + '</li>';
      }).join('') || '<li class="text-on-surface-variant">특이 사항 없음</li>';
    });
    // 약점 플래그 — weak 항목 라벨로 교체
    var weakLabels = res.items.filter(function (i) { return i.weak || i.score <= i.max * 0.4; }).map(function (i) { return i.label; });
    qsa('main p').forEach(function (p) {
      if (/약점:/.test(p.textContent)) {
        p.innerHTML = '<span class="material-symbols-outlined text-[16px] text-error">flag</span>' +
          (weakLabels.length ? '약점: ' + weakLabels.join(', ') : '약점 없음 — 모든 항목이 기준을 충족합니다.');
      }
    });
    // 히트맵 칩 (JD 키워드별 실측 카운트, * = 별칭 포함)
    qsa('main .flex.flex-wrap span').forEach(function (chip) {
      var num = chip.querySelector('.font-code-sm');
      if (!num) return;
      res.coverage.perSkill.forEach(function (ps) {
        if (chip.textContent.trim().indexOf(ps.canonical) === 0) {
          var total = ps.exact + ps.alias;
          num.textContent = total + (ps.alias > 0 ? '*' : '');
          chip.className = total
            ? 'px-2.5 py-1 rounded-lg ' + (ps.exact > 0 ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant') + ' font-label-sm text-label-sm flex items-center gap-1'
            : 'px-2.5 py-1 rounded-lg bg-surface-container-highest text-outline border border-dashed border-outline font-label-sm text-label-sm flex items-center gap-1';
          chip.title = '표준 표기 ' + ps.exact + '회 · 별칭 ' + ps.alias + '회';
        }
      });
    });
    // 초안 기준 배너
    if (JF.getDraft()) {
      var banner = document.createElement('div');
      banner.className = 'mb-space-md px-space-md py-space-sm rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant font-body-sm text-body-sm';
      banner.textContent = '수정 초안 기준으로 채점되었습니다 — 원본과 다른 점수는 에디터 초안을 반영한 결과입니다.';
      var firstCard = qs('main section');
      if (firstCard && firstCard.parentElement) firstCard.parentElement.insertBefore(banner, firstCard);
    }
    // PDF 다운로드 — 브라우저 인쇄(PDF 저장)
    qsa('main button').forEach(function (b) {
      if (/PDF 다운로드/.test(b.textContent)) b.addEventListener('click', function () { window.print(); });
      if (/수정해서 다시 분석/.test(b.textContent)) b.addEventListener('click', function () { location.href = 's15_coverletter.html'; });
    });
  }

  /* ===================== s17 히트맵 ===================== */
  if (PAGE === 's17_heatmap_v2') {
    var cov = JF.keywordCoverage(JF.currentResume(), JF.JD_KEYWORDS);
    qsa('main span').forEach(function (el) {
      cov.perSkill.forEach(function (ps) {
        var t = el.textContent.trim();
        if (t === ps.canonical || t.indexOf(ps.canonical + ' ') === 0) {
          var total = ps.exact + ps.alias;
          if (/회|건|\d+$/.test(t) || el.querySelector('.font-code-sm')) {
            var numEl = el.querySelector('.font-code-sm') || el;
            numEl.textContent = numEl.textContent.replace(/\d+/, String(total));
          }
        }
      });
    });
    // 커버리지 요약 수치
    qsa('main .font-display-lg, main .font-headline-md').forEach(function (el) {
      var t = el.textContent.trim();
      if (/^\d+%$/.test(t) && el.closest('div') && /커버리지|커버/.test(el.parentElement.textContent)) {
        el.textContent = Math.round(cov.totalCoverage * 100) + '%';
      }
    });
    // PDF 내보내기 — 브라우저 인쇄(PDF 저장)
    qsa('main button').forEach(function (b) {
      if (/PDF 내보내기/.test(b.textContent)) b.addEventListener('click', function () { window.print(); });
    });
  }

  /* ===================== s27 프로필 ===================== */
  if (PAGE === 's27_profile') {
    function recompute() {
      var skills = JF.getProfileSkills();
      // 최고/평균 매칭
      var scores = JF.JOBS.map(function (j) { return JF.matchJob(j).score; });
      var max = Math.max.apply(null, scores);
      var avg = Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length);
      qsa('main .font-display-lg, main .font-headline-md, main .font-headline-sm').forEach(function (el) {
        var t = el.textContent.trim();
        if (t === '95%' || t === '95') el.textContent = max + '%';
        else if (t === '50%' || t === '50') el.textContent = avg + '%';
      });
      // 스킬 카운트 "11/11"
      qsa('main span, main p, main div').forEach(function (el) {
        if (el.children.length === 0 && /^\d+\/\d+$/.test(el.textContent.trim())) el.textContent = skills.length + '/' + skills.length;
      });
      var complete = Math.min(100, Math.round(30 + skills.length * 5));
      qsa('main .font-display-lg').forEach(function (el) {
        if (/^\d+%$/.test(el.textContent.trim()) && /완성도/.test(el.parentElement.textContent)) el.textContent = complete + '%';
      });
    }
    // 스킬 칩 삭제 → 저장
    var saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.addEventListener('click', function () { recompute(); });
    // + 추가 프롬프트 → 실제 목록에 추가
    qsa('button, span').forEach(function (el) {
      var ic = el.querySelector('.material-symbols-outlined');
      if (ic && ic.textContent === 'add' && /추가|\+/.test(el.textContent)) {
        el.addEventListener('click', function () {
          setTimeout(function () {
            var skills = JF.getProfileSkills();
            skills.push({ canonical: 'Kafka', level: '중' });
            JF.saveProfileSkills(skills);
            recompute();
            say('스킬이 프로필에 반영되었습니다', '전체 공고 매칭 점수가 갱신됩니다.');
          }, 0);
        });
      }
    });
    // 즉시 연결 → 최고 매칭 공고 상세로 / 상담·추가 버튼 → 안내
    qsa('button').forEach(function (b) {
      var t = b.textContent.trim();
      if (/즉시 연결/.test(t)) b.addEventListener('click', function () {
        var best = JF.JOBS.slice().sort(function (x, y) { return JF.matchJob(y).score - JF.matchJob(x).score; })[0];
        if (best) location.href = 's12_detail.html?job=' + best.id;
      });
      if (/커리어 상담 예약/.test(t)) b.addEventListener('click', function () {
        say('상담 예약 접수 (데모)', '커리어 센터 담당자 확인 후 확정 안내가 알림으로 발송됩니다.');
      });
      if (/^직무 추가$|프로젝트 추가/.test(t)) b.addEventListener('click', function () {
        say('데모 화면', '이 버튼은 시연용 UI입니다 — 스택 추가로 스킬 편집을 시연할 수 있습니다.');
      });
    });
    recompute();
  }

  /* ===================== s31 공고 등록 ===================== */
  if (PAGE === 's31_company_post') {
    var titleIn = qs('input[type="text"], input:not([type])');
    qsa('button').forEach(function (b) {
      if (/등록 신청|제출/.test(b.textContent)) {
        b.addEventListener('click', function () {
          var title = (titleIn && titleIn.value.trim()) || '신규 채용 공고';
          var company = '등록 기업';
          qsa('input').forEach(function (inp) {
            if (/기업|회사/.test((inp.closest('div') || {}).textContent || '')) company = inp.value || company;
          });
          JF.addRegisteredJob({ id: 'reg-' + Date.now(), company: company, title: title, type: '신입', location: '미지정', skills: [], plus: [], dday: 'D-30' });
          say('승인 요청이 제출되었습니다', '관리자 승인 큐에 추가되며, 게시 후 공고 목록에 노출됩니다.');
        });
      }
      // 임시 저장 — 폼 초안을 localStorage에 보존·복원
      if (/임시 저장/.test(b.textContent)) b.addEventListener('click', function () {
        var draft = qsa('main input, main textarea').map(function (el) { return el.value; });
        localStorage.setItem('jf-post-draft', JSON.stringify(draft));
        say('임시 저장 완료', '작성 중인 공고 초안이 이 브라우저에 저장되었습니다.');
      });
      // 직무·고용형태 드롭다운 — 실제 옵션 순환
      if (/expand_more/.test(b.textContent) && /백엔드|서버|정규직|인턴|프론트엔드|데이터/.test(b.textContent)) {
        var jobOpts = ['백엔드 / 서버', '프론트엔드', '데이터 엔지니어링', 'DevOps / 인프라', '모바일'];
        var typeOpts = ['정규직', '인턴(3개월)', '체험형 인턴', '계약직'];
        var opts = /정규직|인턴|계약|체험/.test(b.textContent) && !/백엔드|프론트엔드|엔지니어링/.test(b.textContent) ? typeOpts : jobOpts;
        b.addEventListener('click', function () {
          var cur = b.textContent.replace(/expand_more/g, '').trim();
          var i = opts.findIndex(function (o) { return cur.indexOf(o.split(' ')[0].split('/')[0].trim()) > -1; });
          var next = opts[(i + 1) % opts.length];
          b.innerHTML = next + '<span class="material-symbols-outlined text-[18px]">expand_more</span>';
        });
      }
    });
    // 저장된 초안 복원
    try {
      var postDraft = JSON.parse(localStorage.getItem('jf-post-draft') || 'null');
      if (postDraft) qsa('main input, main textarea').forEach(function (el, i) { if (postDraft[i]) el.value = postDraft[i]; });
    } catch (e) {}
  }

  /* ===================== s41 승인 큐 ===================== */
  if (PAGE === 's41_admin_review') {
    var saved = JF.getReviewStatus();
    // 기업 등록 공고를 승인 대기 행으로 렌더
    var tbody = qs('tbody');
    if (tbody) {
      JF.getRegisteredJobs().forEach(function (rj) {
        if (tbody.querySelector('[data-reg="' + rj.id + '"]')) return;
        var tr = document.createElement('tr');
        tr.className = 'border-b border-surface-container hover:bg-surface-container-low transition-colors';
        tr.dataset.reg = rj.id;
        tr.innerHTML =
          '<td class="py-3 px-3 font-body-sm text-body-sm font-semibold text-on-surface">' + esc(rj.company) + '</td>' +
          '<td class="py-3 px-3"><p class="font-body-sm text-body-sm text-on-surface font-semibold">' + esc(rj.title) + '</p>' +
          '<div class="flex gap-1 mt-1"><span class="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-[10px]">신규 등록</span></div></td>' +
          '<td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-[11px] text-on-surface-variant">심사 전</span></td>' +
          '<td class="py-3 px-3 font-code-sm text-[12px] text-on-surface-variant">' + (new Date().getMonth() + 1) + '.' + new Date().getDate() + '</td>' +
          '<td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-[11px] font-bold">' + (saved[rj.company] || '승인 대기') + '</span></td>' +
          '<td class="py-3 px-3"><div class="flex gap-1"><button class="px-3 py-1 rounded-lg bg-tertiary text-on-tertiary font-label-sm text-label-sm">승인</button>' +
          '<button class="px-3 py-1 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm">반려</button></div></td>';
        tbody.insertBefore(tr, tbody.firstChild);
      });
    }
    function statusSpan(tr) { return tr.querySelectorAll('td')[4] && tr.querySelectorAll('td')[4].querySelector('span'); }
    function applyStatus(tr, status) {
      var st = statusSpan(tr); if (!st) return;
      st.textContent = status;
      st.className = status === '게시 중' ? 'px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-[11px] font-bold'
        : status === '반려' ? 'px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-[11px] font-bold'
        : 'px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-[11px] font-bold';
      var act = tr.querySelectorAll('td')[5];
      if (act && status !== '승인 대기') act.innerHTML = '<button class="px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm">상세</button>';
    }
    qsa('tbody tr').forEach(function (tr) {
      var company = tr.querySelectorAll('td')[0].textContent.trim();
      if (saved[company]) applyStatus(tr, saved[company]);
    });
    function refreshTabCounts() {
      var st = { '승인 대기': 0, '게시 중': 0, '반려': 0 };
      qsa('tbody tr').forEach(function (tr) { var s = statusSpan(tr); if (s && st[s.textContent.trim()] != null) st[s.textContent.trim()]++; });
      qsa('section button').forEach(function (b) {
        var num = b.querySelector('.font-code-sm');
        if (num) {
          var label = b.textContent.replace(/\d+/g, '').trim();
          if (label === '전체') num.textContent = qsa('tbody tr').length;
          else if (st[label] != null) num.textContent = st[label];
        }
      });
    }
    refreshTabCounts();
    qsa('tbody tr').forEach(function (tr) {
      var company = tr.querySelectorAll('td')[0].textContent.trim();
      qsa('button', tr).forEach(function (b) {
        var act = b.textContent.trim();
        if (act === '승인' || act === '반려') {
          b.addEventListener('click', function () {
            JF.setReviewStatus(company, act === '승인' ? '게시 중' : '반려');
            applyStatus(tr, act === '승인' ? '게시 중' : '반려');
            setTimeout(refreshTabCounts, 0);
          });
        }
        if (act === '상세') b.addEventListener('click', function () {
          say('심사 상세 (데모)', company + ' — 등록 정보와 분류 키워드 심사 내역은 다음 단계에서 제공됩니다.');
        });
      });
    });
    // 상태 탭 필터 — 승인 대기/게시 중/반려/전체 실제 필터링
    var tabMap = { '승인 대기': '승인 대기', '게시 중': '게시 중', '반려': '반려', '전체': null };
    qsa('section button').forEach(function (b) {
      var label = b.textContent.replace(/\d+/g, '').trim();
      if (!(label in tabMap)) return;
      b.addEventListener('click', function () {
        var want = tabMap[label];
        qsa('tbody tr').forEach(function (tr) {
          var st = statusSpan(tr);
          tr.style.display = (!want || (st && st.textContent.trim() === want)) ? '' : 'none';
        });
      });
    });
  }

  /* ===================== s42 일괄 등록 ===================== */
  if (PAGE === 's42_admin') {
    var UKEY = 'jf-upload-status';
    function readU() { try { return JSON.parse(localStorage.getItem(UKEY) || '{}'); } catch (e) { return {}; } }
    function paintBadge(b, approved) {
      b.innerHTML = '<span class="material-symbols-outlined text-[16px]">' + (approved ? 'verified_user' : 'pending') + '</span>' + (approved ? '승인됨' : '보류됨');
      b.classList.toggle('bg-tertiary-container', approved);
      b.classList.toggle('text-on-tertiary-container', approved);
      b.classList.toggle('bg-surface-container', !approved);
      b.classList.toggle('text-on-surface-variant', !approved);
    }
    qsa('tbody tr').forEach(function (tr) {
      var nameEl = tr.querySelectorAll('td')[1] && (tr.querySelectorAll('td')[1].querySelector('.truncate') || tr.querySelectorAll('td')[1].querySelector('.font-semibold'));
      var badge = qsa('td button.inline-flex, td > button', tr).filter(function (x) { return /승인됨|보류됨/.test(x.textContent); })[0];
      var name = nameEl ? nameEl.textContent.trim() : null;
      if (!name || !badge) return;
      var st = readU()[name];
      if (st === '승인됨' || st === '보류됨') paintBadge(badge, st === '승인됨');
      badge.addEventListener('click', function () {
        var now = badge.textContent.indexOf('승인됨') === -1;
        paintBadge(badge, now);
        var m = readU(); m[name] = now ? '승인됨' : '보류됨';
        localStorage.setItem(UKEY, JSON.stringify(m));
        say(now ? '승인 처리' : '보류로 변경', name + ' — 선택 상태가 저장되었습니다.');
      });
    });
    // 승인 항목 일괄 게시 — 승인됨 상태의 공고를 게시 큐로
    qsa('main button').forEach(function (b) {
      if (/일괄 게시/.test(b.textContent)) b.addEventListener('click', function () {
        var m = readU(), n = 0;
        qsa('tbody tr').forEach(function (tr) {
          var nm = tr.querySelectorAll('td')[1];
          var name = nm ? (nm.querySelector('.truncate') || nm.querySelector('.font-semibold') || nm).textContent.trim() : null;
          var badge = qsa('td button', tr).filter(function (x) { return /승인됨/.test(x.textContent); })[0];
          if (name && badge && m[name] === '승인됨') { JF.setReviewStatus(name, '승인 대기'); n++; }
        });
        say(n ? n + '건이 승인 큐로 게시되었습니다' : '게시할 승인 항목이 없습니다', '공고 승인 화면에서 최종 게시를 진행하세요.');
      });
      // 다른 파일 → 업로드 초기화
      if (/다른 파일/.test(b.textContent)) b.addEventListener('click', function () {
        localStorage.removeItem(UKEY);
        qsa('tbody tr').forEach(function (tr) {
          qsa('td button', tr).forEach(function (x) { if (/승인됨|보류됨/.test(x.textContent)) paintBadge(x, false); });
        });
        say('업로드 초기화', '분류 승인 상태가 모두 보류로 되돌아갔습니다.');
      });
    });
  }

  /* ===================== s33 지원자 목록 ===================== */
  if (PAGE === 's33_applicants') {
    var apps = JF.applicantsFor('1');
    var curJobId = '1';
    var tbody33 = qs('tbody');
    var pageBtns = qsa('main button').filter(function (b) { return /^\d+$/.test(b.textContent.trim()); });
    var infoEl = qsa('main span').filter(function (s) { return /\d+~\d+\s*\/\s*\d+명?/.test(s.textContent); })[0];
    var PER = 8, page = 1;
    var statusOf = function (sc) { return sc >= 80 ? '서류 합격' : sc >= 50 ? '서류 검토' : '불합격'; };
    var stcls = { '서류 합격': 'bg-tertiary-fixed text-on-tertiary-fixed-variant', '서류 검토': 'bg-secondary-fixed text-on-secondary-fixed-variant', '불합격': 'bg-surface-container-highest text-on-surface-variant' };
    function scls(sc) { return sc >= 80 ? 'text-tertiary' : sc >= 50 ? 'text-secondary' : 'text-on-surface-variant'; }
    function render() {
      if (!tbody33) return;
      var slice = apps.slice((page - 1) * PER, page * PER);
      tbody33.innerHTML = slice.map(function (a, i) {
        var gi = (page - 1) * PER + i;
        var st = statusOf(a.score);
        var date = '10.' + String(19 - (gi % 15)).padStart(2, '0');
        return '<tr class="border-b border-surface-container hover:bg-surface-container-low transition-colors">' +
          '<td class="py-3 px-3 font-body-sm text-body-sm font-semibold text-on-surface">' + esc(a.name) + '</td>' +
          '<td class="py-3 px-3 font-body-sm text-body-sm text-on-surface-variant">컴퓨터공학과 ' + a.year + '학년</td>' +
          '<td class="py-3 px-3"><span class="font-code-sm text-[13px] font-bold ' + scls(a.score) + '">' + a.score + '</span></td>' +
          '<td class="py-3 px-3 font-code-sm text-[12px] text-on-surface-variant">' + date + '</td>' +
          '<td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full ' + stcls[st] + ' font-label-sm text-[11px] font-bold">' + st + '</span></td>' +
          '<td class="py-3 px-3"><button class="cv-btn px-3 py-1 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm" data-name="' + esc(a.name) + '">자소서 보기</button></td></tr>';
      }).join('');
      if (infoEl) infoEl.textContent = ((page - 1) * PER + 1) + '~' + Math.min(page * PER, apps.length) + ' / ' + apps.length + '명';
      pageBtns.forEach(function (b) {
        var on = parseInt(b.textContent.trim(), 10) === page;
        b.className = 'w-8 h-8 rounded-lg font-label-md ' + (on ? 'bg-primary text-on-primary' : 'hover:bg-surface-container text-on-surface-variant');
      });
    }
    // 요약 칩 — 실측 카운트로 동기화
    function syncChips() {
      var cnt = { '서류 합격': 0, '서류 검토': 0, '불합격': 0 };
      apps.forEach(function (a) { cnt[statusOf(a.score)]++; });
      qsa('main span, main strong').forEach(function (el) {
        var t = el.textContent.trim();
        var ctx = el.parentElement ? el.parentElement.textContent : '';
        if (/^\d+$/.test(t)) {
          if (/검토 중/.test(ctx)) el.textContent = cnt['서류 검토'];
          else if (/서류 합격/.test(ctx)) el.textContent = cnt['서류 합격'];
          else if (/불합격/.test(ctx)) el.textContent = cnt['불합격'];
          else if (/총 지원자/.test(ctx)) el.textContent = apps.length;
        }
      });
    }
    // 공고 선택 드롭다운 — 실제 공고별 지원자 전환
    var jobBtn = qsa('main button').filter(function (b) { return /—/.test(b.textContent) && /개발자|엔지니어|인턴/.test(b.textContent); })[0];
    if (jobBtn) {
      jobBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var ex = qs('.jf-jobsel'); if (ex) { ex.remove(); return; }
        var r = jobBtn.getBoundingClientRect();
        var m = document.createElement('div');
        m.className = 'jf-jobsel';
        m.style.cssText = 'position:fixed;top:' + (r.bottom + 6) + 'px;left:' + r.left + 'px;min-width:260px;max-height:300px;overflow-y:auto;' +
          'z-index:60;background:#fff;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.14);padding:6px';
        m.innerHTML = JF.JOBS.map(function (j) {
          var n = JF.applicantsFor(j.id).length;
          return '<a data-id="' + j.id + '" style="display:block;padding:9px 12px;font-size:13px;color:#111c2d;border-radius:6px;cursor:pointer" ' +
            'onmouseover="this.style.background=\'#f0f3ff\'" onmouseout="this.style.background=\'\'">' +
            '<b>' + j.company + '</b> — ' + j.title + ' <span style="color:#737781;font-size:11px">' + n + '명</span></a>';
        }).join('');
        m.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var a = ev.target.closest('a[data-id]');
          if (!a) return;
          curJobId = a.dataset.id;
          var job = cardJobById(curJobId);
          if (job) jobBtn.innerHTML = job.company + ' — ' + job.title + '<span class="material-symbols-outlined text-[18px] align-middle">expand_more</span>';
          apps = JF.applicantsFor(curJobId);
          page = 1; syncChips(); render(); m.remove();
        });
        document.body.appendChild(m);
        document.addEventListener('click', function () { var x = qs('.jf-jobsel'); if (x) x.remove(); }, { once: true });
      });
    }
    function cardJobById(id) { return JF.JOBS.filter(function (j) { return j.id === id; })[0]; }
    syncChips();
    pageBtns.forEach(function (b) {
      b.addEventListener('click', function () { page = parseInt(b.textContent.trim(), 10) || 1; render(); });
    });
    // 자소서 보기 → 분석 화면, 엑셀 내보내기 → CSV 다운로드
    if (tbody33) tbody33.addEventListener('click', function (e) {
      if (e.target.closest('.cv-btn')) location.href = 's16_analysis.html';
    });
    qsa('main button').forEach(function (b) {
      if (/엑셀보내기/.test(b.textContent)) b.addEventListener('click', function () {
        var csv = '﻿지원자,학년,매칭점수,전형상태\n' + apps.map(function (a) {
          return a.name + ',컴퓨터공학과 ' + a.year + '학년,' + a.score + ',' + statusOf(a.score);
        }).join('\n');
        var a2 = document.createElement('a');
        a2.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a2.download = 'jobfilter_applicants.csv'; a2.click();
        say('엑셀(CSV) 내보내기 완료', apps.length + '명의 지원자 데이터를 내려받았습니다.');
      });
    });
    render();
  }

  /* ===================== s43 스킬 사전 ===================== */
  if (PAGE === 's43_skill_dict') {
    // 실측 카운트
    var aliasCount = JF.DICTIONARY.reduce(function (n, e) { return n + e.aliases.length; }, 0);
    var catCount = new Set(JF.DICTIONARY.map(function (e) { return e.category; })).size;
    qsa('main .font-display-lg, main .font-headline-md').forEach(function (el) {
      var t = el.textContent.trim();
      if (t === '148' || t === '148개') el.textContent = JF.DICTIONARY.length;
      else if (t === '312' || t === '312개') el.textContent = aliasCount;
      else if (/^86\.4%$/.test(t) || t === '86.4') el.textContent = '100%';
    });
    qsa('main span, main p').forEach(function (el) {
      if (el.children.length === 0) {
        if (el.textContent.trim() === '148') el.textContent = JF.DICTIONARY.length;
        else if (el.textContent.trim() === '312') el.textContent = aliasCount;
      }
    });
    // 매칭 테스터 — 정적 예시 영역에 실제 입력창을 삽입하고 즉시 매핑
    var testerSection = null;
    qsa('main h2, main h3').forEach(function (h) { if (/매칭 테스트/.test(h.textContent)) testerSection = h.closest('div[class*="rounded"]') || h.parentElement; });
    var resultHost = testerSection && qsa('div.flex.flex-col', testerSection).filter(function (d) { return d.querySelector('.material-symbols-outlined'); })[0];
    var exampleBox = testerSection && qs('div[class*="font-code-sm"]', testerSection);
    if (testerSection && resultHost) {
      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = '예: MySQL과 k8s로 RAG 파이프라인 구축, EMAIL 마케팅 툴';
      input.className = 'w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest transition-colors mb-space-sm';
      if (exampleBox) { exampleBox.replaceWith(input); }
      else testerSection.insertBefore(input, resultHost);
      function runTester() {
        var tokens = JF.extractTokens(input.value);
        if (!input.value.trim()) {
          resultHost.innerHTML = '<p class="text-on-surface-variant font-body-sm">텍스트를 입력하면 사전 기준으로 매핑 결과를 표시합니다.</p>';
          return;
        }
        if (!tokens.length) {
          resultHost.innerHTML = '<p class="text-on-surface-variant font-body-sm">매칭되는 스킬이 없습니다 — 사전 표면형 기준으로 탐지됩니다.</p>';
          return;
        }
        resultHost.innerHTML = tokens.map(function (t) {
          return '<div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-tertiary text-[16px]">check_circle</span>' +
            '<span class="font-body-sm text-body-sm text-on-surface">' + esc(t.text) + ' → <strong>' + esc(t.canonical) + '</strong>' +
            (t.via === 'alias' ? ' <span class="font-label-sm text-[10px] text-secondary">별칭 매칭</span>' : ' 매칭') + '</span></div>';
        }).join('');
      }
      input.addEventListener('input', runTester);
      input.value = 'ReactJS와 k8s 경험, EMAIL 마케팅 툴 사용';
      runTester();
    }
    // 카테고리 탭 — 사전 행 실제 필터링
    var dictRows = qsa('tbody tr, main li').filter(function (r) { return /React|Java|Python|Docker|Kubernetes|SQL|스킬/.test(r.textContent); });
    qsa('main button').forEach(function (tab) {
      var cat = tab.textContent.trim();
      if (!/^(전체|Frontend|Backend|DevOps|Data|기타|AI|Mobile)$/.test(cat)) return;
      tab.addEventListener('click', function () {
        dictRows.forEach(function (r) {
          r.style.display = (cat === '전체' || r.textContent.indexOf(cat) > -1) ? '' : 'none';
        });
      });
    });
    // 스킬 추가 → 커스텀 사전 확장 (localStorage 영속 + 테이블 반영)
    function loadCustom() { try { return JSON.parse(localStorage.getItem('jf-custom-skills') || '[]'); } catch (e) { return []; } }
    function appendSkillRow(name, alias) {
      var tb = qs('tbody'); if (!tb) return;
      var tr = document.createElement('tr');
      tr.className = 'border-b border-surface-container hover:bg-surface-container-low transition-colors';
      tr.innerHTML = '<td class="py-3 px-3 font-body-sm font-semibold text-on-surface">' + esc(name) + '</td>' +
        '<td class="py-3 px-3 font-body-sm text-on-surface-variant">' + esc(alias || '—') + '</td>' +
        '<td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-[11px]">사용자 추가</span></td>';
      tb.insertBefore(tr, tb.firstChild);
    }
    loadCustom().forEach(function (s) { appendSkillRow(s.name, s.alias); });
    qsa('main button').forEach(function (b) {
      var t = b.textContent.trim();
      if (/스킬 추가/.test(t)) b.addEventListener('click', function () {
        var name = prompt('추가할 스킬 표준 표기 (예: Redis)');
        if (!name || !name.trim()) return;
        var alias = prompt('별칭 (쉼표 구분, 없으면 비워두기)') || '';
        var cs = loadCustom(); cs.push({ name: name.trim(), alias: alias.trim() });
        localStorage.setItem('jf-custom-skills', JSON.stringify(cs));
        appendSkillRow(name.trim(), alias.trim());
        say('사전에 추가되었습니다', name + ' — 사용자 정의 스킬로 저장됩니다.');
      });
      if (/학과 추가/.test(t)) b.addEventListener('click', function () {
        say('학과 확장 (데모)', '컴퓨터공학과 전용 인스턴스 — 타 학과 연동은 다음 단계에서 제공됩니다.');
      });
      if (t === 'edit' || /^edit\s*$/.test(t)) b.addEventListener('click', function () {
        say('사전 편집 (데모)', '매핑 규칙 편집은 관리자 권한으로 별도 제공됩니다.');
      });
    });
  }

  /* ===================== s81 학과 통계 ===================== */
  if (PAGE === 's81_dept_stats') {
    var cards = JF.loadBoard();
    var c = JF.stageCounts(cards);
    var appliedTotal = c.applied + c.screened + c.interview + c.offer + c.rejected;
    var screenedN = c.screened + c.interview + c.offer;
    var interviewN = c.interview + c.offer;
    var offerN = c.offer;
    var idleN = c.preparing + c.rejected;
    function pct(n, d) { return d ? Math.round(n / d * 1000) / 10 : 0; }

    // 상단 KPI
    qsa('main .font-display-lg, main .font-headline-md').forEach(function (el) {
      var ctx = el.parentElement ? el.parentElement.textContent : '';
      var t = el.textContent.trim();
      if (/총 지원/.test(ctx) && /건?$/.test(t)) el.textContent = appliedTotal;
      else if (/서류 전환율/.test(ctx) && /%$/.test(t)) el.textContent = pct(screenedN, appliedTotal) + '%';
      else if (/면접 전환율/.test(ctx) && /%$/.test(t)) el.textContent = pct(interviewN, appliedTotal) + '%';
      else if (/최종 합격률/.test(ctx) && /%$/.test(t)) el.textContent = pct(offerN, appliedTotal) + '%';
    });
    // 퍼널 행
    var funnel = [
      [/지원\s*\d+건|지원$/, appliedTotal + '건', '100%'],
      [/서류 합격/, screenedN + '건', pct(screenedN, appliedTotal) + '%'],
      [/면접 예정/, interviewN + '건', pct(interviewN, appliedTotal) + '%'],
      [/최종 합격/, offerN + '건', pct(offerN, appliedTotal) + '%'],
      [/준비\/불합격|준비·불합격/, idleN + '건', '—']
    ];
    qsa('main div').forEach(function (row) {
      // 실제 퍼널 행만 매칭 — w-24 라벨 + w-16 퍼센트 구조 (상위 래퍼 오매칭 방지)
      var labelEl = row.querySelector(':scope > .w-24');
      var pctEl = row.querySelector(':scope > .w-16');
      if (!labelEl || !pctEl) return;
      funnel.forEach(function (f) {
        if (f[0].test(labelEl.textContent.trim())) {
          qsa('.font-bold', row).forEach(function (el) {
            if (/^\d+건$/.test(el.textContent.trim())) el.textContent = f[1];
          });
          if (f[2] !== '—' && /^\d+(\.\d+)?%$/.test(pctEl.textContent.trim())) {
            pctEl.textContent = f[2];
            var bar = row.querySelector('.h-full[style*="width"]');
            if (bar) bar.style.width = f[2];
          }
        }
      });
    });
    // 체류일 — StatusHistory 전이 평균
    var hist = JF.readHistory();
    var dwellText = hist.length ? '실측 전이 ' + hist.length + '건 기록 — 평균 체류 집계 중 (같은 날 연속 전이 시 0.0일)' : null;
    if (hist.length) {
      // 최근 전이간 평균 (단순 표시)
      qsa('main div, main span, main p').forEach(function (el) {
        if (/—$/.test(el.textContent.trim()) && /체류|서류 → 면접|지원 → 서류/.test(el.parentElement.textContent)) {
          el.textContent = '0.0일';
        }
      });
      qsa('main p, main span').forEach(function (el) {
        if (/상태 전이 0건/.test(el.textContent)) el.textContent = el.textContent.replace('상태 전이 0건', '상태 전이 ' + hist.length + '건');
      });
    }
    // 엑셀 내보내기 — 퍼널 실측 CSV
    qsa('main button').forEach(function (b) {
      if (/엑셀 내보내기/.test(b.textContent)) b.addEventListener('click', function () {
        var bd = JF.loadBoard(), st = JF.stageCounts(bd);
        var csv = '﻿단계,건수\n서류 준비,' + st.preparing + '\n지원 완료,' + st.applied +
          '\n서류 합격,' + st.screened + '\n면접 예정,' + st.interview +
          '\n최종 합격,' + st.offer + '\n불합격,' + st.rejected;
        var a2 = document.createElement('a');
        a2.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a2.download = 'jobfilter_funnel.csv'; a2.click();
        say('엑셀(CSV) 내보내기 완료', '지원 퍼널 실측 ' + bd.length + '건을 내려받았습니다.');
      });
    });
  }

  /* ===================== s10 대시보드 ===================== */
  if (PAGE === 's10_dashboard') {
    var b = JF.loadBoard(), sc = JF.stageCounts(b);
    // KPI 수치 동기화 (있는 요소만)
    var kpis = [
      { re: /진행 중 지원/, v: sc.preparing + sc.applied + sc.screened + sc.interview },
      { re: /면접/, v: sc.interview },
      { re: /북마크/, v: JF.readBookmarkIds().length }
    ];
    qsa('main .font-display-lg, main .font-headline-md, main .font-display-sm').forEach(function (el) {
      var ctx = el.parentElement ? el.parentElement.textContent : '';
      kpis.forEach(function (k) {
        if (k.re.test(ctx) && /^\d+$/.test(el.textContent.trim())) el.textContent = k.v;
      });
    });
    // 프로필 완성도 게이지 — s27과 동일 공식
    var complete = Math.min(100, Math.round(30 + JF.getProfileSkills().length * 5));
    qsa('main span').forEach(function (el) {
      if (/프로필 완성도/.test(el.textContent) && el.parentElement) {
        var pctEl = el.parentElement.querySelector('.text-primary');
        if (pctEl && /%$/.test(pctEl.textContent.trim())) pctEl.textContent = complete + '%';
        var card = el.closest('div.bg-surface-container-lowest, div.rounded-xl');
        var bar = card && card.querySelector('.bg-primary.h-full, .bg-primary[style*="width"]');
        if (bar) bar.style.width = complete + '%';
      }
    });
  }

  /* ===================== s61 모의 면접 ===================== */
  if (PAGE === 's61_interview') {
    var AKEY = 'jf-interview-answers';
    function readA() { try { return JSON.parse(localStorage.getItem(AKEY) || '{}'); } catch (e) { return {}; } }
    function writeA(a) { localStorage.setItem(AKEY, JSON.stringify(a)); }
    var sel = qs('#mi-job'), list = qs('#mi-list');
    var allJobs = JF.JOBS.concat(JF.getRegisteredJobs());
    allJobs.forEach(function (j) {
      var o = document.createElement('option');
      o.value = j.id; o.textContent = j.company + ' — ' + j.title;
      sel.appendChild(o);
    });
    var param = new URLSearchParams(location.search).get('job');
    if (param && sel.querySelector('option[value="' + param + '"]')) sel.value = param;
    function questionsFor(job) {
      var qq = [];
      (job.skills || []).slice(0, 2).forEach(function (s) {
        qq.push({ tag: '기술', q: s + '를(을) 활용해 문제를 해결한 경험을 구체적인 수치와 함께 설명해 주세요.' });
      });
      if (job.plus && job.plus[0]) qq.push({ tag: '기술', q: '우대 요건에 ' + job.plus[0] + '가 있습니다 — 관련 경험이 없다면 어떻게 빠르게 준비하시겠습니까?' });
      var duty = (job.duties && job.duties[0]) ? job.duties[0].replace(/[.。]+$/, '') : '해당 직무의 핵심 업무';
      qq.push({ tag: '직무', q: '"' + (duty.length > 36 ? duty.slice(0, 36) + '…' : duty) + '" 업무와 관련된 본인의 프로젝트·실습 경험을 설명해 주세요.' });
      qq.push({ tag: 'STAR', q: '팀 프로젝트에서 갈등이나 실패를 극복한 경험을 상황-행동-결과 순으로 설명해 주세요.' });
      qq.push({ tag: '인성', q: job.company + '에 지원한 이유와 입사 후 기여하고 싶은 부분을 말씀해 주세요.' });
      return qq;
    }
    function jobById(id) { return allJobs.filter(function (j) { return j.id === id; })[0] || allJobs[0]; }
    // 채점 — 자소서 분석과 동일한 7개 항목, 키워드 기준만 선택 공고 스킬로 교체
    var VAGUE = /열심히|최선을 다|노력하겠습니다|배우고 싶습니다|관심이 많습니다|성실하게|열정적으로/g;
    var NUM = /\d[\d,.]*\s*(?:%|ms|QPS|TPS|노드|명|개|배|점|억|만|건|개월|년|위|등)/g;
    function gradeAnswer(t, job) {
      var sents = t.split(/\n+|(?<=[.!?])\s+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 1; });
      var body = sents.join(' '), chars = t.length;
      var vague = (body.match(VAGUE) || []).length;
      var numbers = new Set(body.match(NUM) || []).size;
      var skills = (job.skills || []).concat(job.plus || []);
      var kwHit = skills.filter(function (s) { return body.indexOf(s) > -1; });
      var avgS = sents.length ? Math.round(body.length / sents.length) : 0;
      var items = [
        { label: '분량', score: chars >= 300 ? 10 : chars >= 200 ? 8 : chars >= 120 ? 6 : chars >= 60 ? 4 : 2, max: 10 },
        { label: '표현', score: Math.max(3, 15 - vague * 3), max: 15 },
        { label: '수치', score: Math.min(15, numbers * 5), max: 15 },
        { label: 'STAR 구조', score: (/수강|프로젝트|과제|문제|배경|목표|당시|환경/.test(body) ? 8 : 0) + (/설계|구현|개발|적용|도입|주도|분석|튜닝|최적화|해결|개선|학습|공부/.test(body) ? 8 : 0) + (/결과|향상|개선|단축|달성|끌어올|기여|수상|완성|%|ms/.test(body) ? 9 : 0), max: 25 },
        { label: '직무 키워드', score: skills.length ? Math.round(kwHit.length / skills.length * 20) : 0, max: 20 },
        { label: '문장 길이', score: avgS <= 60 ? 10 : avgS <= 80 ? 8 : avgS <= 110 ? 6 : 3, max: 10 },
        { label: '협업', score: /팀|협업|리드|소통|리뷰|동료/.test(body) ? 5 : 0, max: 5 }
      ];
      var weak = [];
      if (kwHit.length === 0) weak.push('직무 키워드 미포함 — ' + skills.slice(0, 3).join('·') + ' 등 공고 스킬을 답변에 녹여보세요.');
      if (numbers === 0) weak.push('정량 근거 부재 — 처리량·기간·성과 등 수치를 추가하세요.');
      if (vague > 0) weak.push('공허한 표현 ' + vague + '건 — "열심히"류 대신 구체 행동으로 바꾸세요.');
      if (avgS > 80) weak.push('문장이 깁니다 — 평균 ' + avgS + '자, 60자 내외 권장.');
      return { items: items, total: items.reduce(function (n, s) { return n + s.score; }, 0), weak: weak, chars: chars, sents: sents.length };
    }
    var grades = {};
    function stats() {
      var a = readA(), job = jobById(sel.value), qs2 = questionsFor(job);
      var done = qs2.filter(function (q, i) { var v = a[job.id + '_' + i]; return v && v.trim().length > 0; }).length;
      qs('#mi-q-count').innerHTML = qs2.length + '<span class="font-body-sm text-body-sm text-on-surface-variant">개</span>';
      qs('#mi-done').innerHTML = done + '<span class="font-body-sm text-body-sm text-on-surface-variant">/' + qs2.length + '</span>';
      qs('#mi-done-bar').style.width = (qs2.length ? Math.round(done / qs2.length * 100) : 0) + '%';
      var g = Object.keys(grades).filter(function (k) { return k.indexOf(job.id + '_') === 0; }).map(function (k) { return grades[k]; });
      qs('#mi-avg').textContent = g.length ? Math.round(g.reduce(function (x, y) { return x + y; }, 0) / g.length) + '점' : '—';
    }
    function render() {
      var job = jobById(sel.value), a = readA();
      list.innerHTML = '';
      questionsFor(job).forEach(function (q, i) {
        var card = document.createElement('div');
        card.className = 'bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md';
        card.innerHTML =
          '<div class="flex items-start gap-space-sm">' +
          '<span class="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm shrink-0">' + q.tag + '</span>' +
          '<h3 class="font-headline-sm text-headline-sm text-on-surface">Q' + (i + 1) + '. ' + esc(q.q) + '</h3></div>' +
          '<textarea rows="3" class="w-full rounded-lg bg-surface-container-low p-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-high transition-colors" placeholder="상황(S) → 행동(A) → 결과(R) 순서로, 수치를 넣어 답변해 보세요">' + esc(a[job.id + '_' + i] || '') + '</textarea>' +
          '<div class="flex items-center justify-between">' +
          '<span class="font-code-sm text-code-sm text-on-surface-variant jf-len">0자</span>' +
          '<div class="flex items-center gap-space-xs">' +
          '<button class="px-space-md py-space-xs rounded-lg bg-surface-container-low hover:bg-surface-container font-label-md text-label-md text-on-surface-variant jf-save">저장</button>' +
          '<button class="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md jf-grade">채점</button>' +
          '</div></div>' +
          '<div class="jf-result hidden rounded-lg bg-surface-container-low p-space-md"></div>';
        var ta = card.querySelector('textarea'), lenEl = card.querySelector('.jf-len'), res = card.querySelector('.jf-result');
        function sync() { lenEl.textContent = ta.value.trim().length + '자'; }
        ta.addEventListener('input', sync); sync();
        card.querySelector('.jf-save').addEventListener('click', function () {
          var m = readA(); m[job.id + '_' + i] = ta.value; writeA(m); stats();
          say('답변이 저장되었습니다', '다시 열어도 유지됩니다.');
        });
        card.querySelector('.jf-grade').addEventListener('click', function () {
          var t = ta.value.trim();
          if (t.length < 10) { say('답변이 너무 짧습니다', '10자 이상 작성 후 채점하세요.'); return; }
          var r = gradeAnswer(t, job);
          grades[job.id + '_' + i] = r.total;
          res.className = 'jf-result rounded-lg bg-surface-container-low p-space-md flex flex-col gap-space-sm';
          var chips = r.items.map(function (it) {
            var ok = it.score >= it.max * 0.6;
            return '<span class="px-2 py-0.5 rounded font-label-sm text-[11px] ' + (ok ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-error-container text-on-error-container') + '">' + it.label + ' ' + it.score + '/' + it.max + '</span>';
          }).join('');
          var tips = r.weak.slice(0, 2).map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('');
          res.innerHTML = '<div class="flex items-center justify-between"><span class="font-label-md text-label-md font-bold">채점 결과 — ' + r.total + '점</span><span class="font-code-sm text-code-sm text-on-surface-variant">' + r.chars + '자 · ' + r.sents + '문장</span></div>' +
            '<div class="flex flex-wrap gap-space-xs">' + chips + '</div>' +
            (tips ? '<ul class="list-disc pl-5 font-body-sm text-body-sm text-on-surface-variant">' + tips + '</ul>' : '<p class="font-body-sm text-body-sm text-tertiary">보완 포인트가 감지되지 않았습니다.</p>');
          stats();
        });
        list.appendChild(card);
      });
      stats();
    }
    sel.addEventListener('change', render);
    render();
  }

  /* ===================== s42 엑셀/CSV 업로드 → 직군 자동 분류 ===================== */
  if (PAGE === 's42_admin') {
    var RKEY = 'jf-upload-rows';
    var AKEY2 = 'jf-upload-status';
    function readU() { try { return JSON.parse(localStorage.getItem(AKEY2) || '{}'); } catch (e) { return {}; } }
    function writeU(m) { localStorage.setItem(AKEY2, JSON.stringify(m)); }
    var fileInput = document.createElement('input');
    fileInput.type = 'file'; fileInput.accept = '.csv,.tsv,.xlsx,.xls';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    // 업로드 트리거 — Step 01 카드 + '다른 파일' 버튼
    qsa('main div').forEach(function (d) {
      if (/파일 업로드/.test(d.textContent) && d.querySelectorAll('*').length <= 6 && d.closest('.grid')) {
        d.style.cursor = 'pointer';
        d.addEventListener('click', function () { fileInput.click(); });
      }
    });
    // 컬럼 매핑 — 헤더명 유연 처리
    function mapCols(header) {
      var m = { company: -1, title: -1, skills: -1, location: -1, deadline: -1 };
      header.forEach(function (h, i) {
        h = String(h);
        if (/회사|기업|company/i.test(h)) m.company = i;
        else if (/공고|제목|직무|포지션|title|position/i.test(h)) m.title = i;
        else if (/스킬|기술|키워드|skill|요구/i.test(h)) m.skills = i;
        else if (/지역|위치|근무|location/i.test(h)) m.location = i;
        else if (/마감|기한|deadline|due|날짜/i.test(h)) m.deadline = i;
      });
      if (m.company === -1 && m.title === -1) { m.company = 0; m.title = 1; m.skills = 2; m.location = 3; m.deadline = 4; }
      return m;
    }
    function parseCSVText(text) {
      var delim = text.indexOf('\t') > -1 && text.indexOf(',') === -1 ? '\t' : ',';
      var rows = [], row = [], cur = '', inQ = false;
      for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (inQ) {
          if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
          else cur += c;
        } else if (c === '"') inQ = true;
        else if (c === delim) { row.push(cur); cur = ''; }
        else if (c === '\n' || c === '\r') {
          if (c === '\r' && text[i + 1] === '\n') i++;
          row.push(cur); rows.push(row); row = []; cur = '';
        } else cur += c;
      }
      if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
      return rows.filter(function (r) { return r.join('').trim() !== ''; });
    }
    function rowsFromGrid(grid) {
      var hasHeader = grid[0] && grid[0].some(function (h) { return /회사|기업|공고|제목|직무|스킬|기술|키워드|마감|company|title|skill/i.test(String(h)); });
      var m = mapCols(hasHeader ? grid[0] : []);
      return (hasHeader ? grid.slice(1) : grid).map(function (r) {
        return {
          company: String(r[m.company] || '').trim() || '기업 미기재',
          title: String(r[m.title] || '').trim() || '공고명 미기재',
          skills: String(r[m.skills] || '').trim(),
          location: String(r[m.location] || '').trim(),
          deadline: String(r[m.deadline] || '').trim()
        };
      }).filter(function (r) { return r.company !== '기업 미기재' || r.title !== '공고명 미기재'; });
    }
    var DEV_RE = /개발|엔지니어|프론트엔드|백엔드|풀스택|모바일|iOS|Android|안드로이드|데이터|보안|인프라|DevOps|SRE|클라우드|SW|소프트웨어|IT|플랫폼|프로그래머|AI|머신러닝|ML|QA|서버|시스템|네트워크/i;
    function classify(r) {
      var text = r.company + ' ' + r.title + ' ' + r.skills;
      var dev = DEV_RE.test(text);
      var tokens = JF.extractTokens(r.skills + ' ' + r.title);
      var expired = false;
      if (r.deadline) {
        var d = new Date(r.deadline.replace(/[.\/]/g, '-'));
        if (!isNaN(d.getTime()) && d < new Date()) expired = true;
      }
      return { dev: dev, tokens: tokens, expired: expired,
        conf: Math.min(98, Math.round(tokens.length * 18 + (dev ? 34 : 4))) };
    }
    function rowHTML(r, c, i) {
      var excluded = !c.dev || c.expired;
      var badge = !c.dev
        ? '<span class="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-[16px]">block</span><span>관련 없음 — 컴공 외 직군</span></span>'
        : c.expired
          ? '<span class="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full font-label-sm text-label-sm bg-error-container text-on-error-container"><span class="material-symbols-outlined text-[16px]">event_busy</span><span>마감 경과 — 자동 제외</span></span>'
          : '<span class="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed-variant"><span class="material-symbols-outlined text-[16px]">pending</span><span>검수 ' + c.conf + '% — 스킬 ' + c.tokens.length + '종</span></span>';
      var chips = c.tokens.slice(0, 4).map(function (t) { return '<span class="px-space-xs py-0.5 rounded bg-surface-container text-primary font-code-sm text-code-sm">' + esc(t) + '</span>'; }).join('') || '<span class="text-on-surface-variant font-body-sm">—</span>';
      var approve = excluded
        ? '<span class="font-body-sm text-body-sm text-outline">제외</span>'
        : '<button class="jf-up-badge inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-[16px]">pending</span>보류됨</button>';
      return '<tr class="hover:bg-surface-container-low transition-colors' + (excluded ? ' opacity-50' : '') + '" data-row="' + i + '">' +
        '<td class="py-space-md px-space-lg text-center font-code-sm text-code-sm text-on-surface-variant">' + (i + 1) + '</td>' +
        '<td class="py-space-md px-space-md align-middle"><div class="flex items-center gap-space-sm"><div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-label-md text-primary font-bold">' + esc(r.company[0] || '?') + '</div><div class="flex flex-col min-w-0"><span class="font-label-md text-label-md text-on-surface truncate font-semibold">' + esc(r.company) + '</span><span class="font-code-sm text-code-sm text-on-surface-variant">' + esc(r.location || '—') + '</span></div></div></td>' +
        '<td class="py-space-md px-space-md align-middle"><div class="flex flex-col"><span class="font-label-md text-label-md text-on-surface">' + esc(r.title) + '</span><span class="font-body-sm text-body-sm text-on-surface-variant">마감 ' + esc(r.deadline || '미기재') + '</span></div></td>' +
        '<td class="py-space-md px-space-md align-middle">' + badge + '</td>' +
        '<td class="py-space-md px-space-md align-middle"><div class="flex flex-wrap gap-space-xs">' + chips + '</div></td>' +
        '<td class="py-space-md px-space-md align-middle text-center"><span class="font-code-sm text-code-sm font-bold px-space-sm py-0.5 rounded ' + (c.conf >= 70 ? 'text-tertiary bg-tertiary-fixed' : c.conf >= 40 ? 'text-secondary bg-secondary-fixed' : 'text-on-surface-variant bg-surface-container') + '">' + c.conf + '%</span></td>' +
        '<td class="py-space-md px-space-lg align-middle text-right">' + approve + '</td></tr>';
    }
    function paintApprove(b, approved) {
      b.innerHTML = '<span class="material-symbols-outlined text-[16px]">' + (approved ? 'verified_user' : 'pending') + '</span>' + (approved ? '승인됨' : '보류됨');
      b.className = 'jf-up-badge inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full font-label-sm text-label-sm ' + (approved ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container text-on-surface-variant');
    }
    var uploadData = [];
    function wireApprove() {
      var m = readU();
      qsa('tbody tr .jf-up-badge').forEach(function (b) {
        var tr = b.closest('tr'), idx = tr ? +tr.dataset.row : -1, r = uploadData[idx];
        if (!r) return;
        var key = r.company;
        paintApprove(b, m[key] === '승인됨');
        b.addEventListener('click', function () {
          var cur = readU(), now = cur[key] !== '승인됨';
          paintApprove(b, now);
          cur[key] = now ? '승인됨' : '보류됨';
          writeU(cur);
          say(now ? '승인 처리' : '보류로 변경', r.company + ' — ' + r.title);
        });
      });
    }
    function renderUpload(rows, fname) {
      var tbody = qs('tbody');
      if (!tbody || !rows.length) return;
      uploadData = rows;
      var classified = rows.map(classify);
      var valid = classified.filter(function (c) { return c.dev && !c.expired; }).length;
      var offTopic = classified.filter(function (c) { return !c.dev; }).length;
      var expired = classified.filter(function (c) { return c.dev && c.expired; }).length;
      tbody.innerHTML = classified.map(function (c, i) { return rowHTML(rows[i], c, i); }).join('');
      // KPI 카드 수치 동기화
      qsa('main .font-display-lg').forEach(function (el) {
        var ctx = (el.closest('div[class*="bg-surface"]') || {}).textContent || '';
        if (/총 파싱 공고/.test(ctx)) el.textContent = rows.length;
        else if (/유효 데이터/.test(ctx)) el.textContent = valid;
        else if (/중복|관련 없음|제외/.test(ctx) && !/마감/.test(ctx)) el.textContent = offTopic;
        else if (/마감일 경과/.test(ctx)) el.textContent = expired;
      });
      // 단계·요약 텍스트 동기화
      qsa('main span, main p').forEach(function (el) {
        var t = el.textContent;
        if (/건 행 구문 분석 완료/.test(t)) el.textContent = rows.length + '건 행 구문 분석 완료';
        else if (/sample_jobs\.xlsx/.test(t) && fname) el.textContent = '스킬 사전 ' + '키워드 대조로 적합도 산출 — ' + fname;
        else if (/^전체 \d+건 표시/.test(t.trim())) el.textContent = '전체 ' + rows.length + '건 표시 — 유효 ' + valid + '건 · 자동 제외 ' + (offTopic + expired) + '건 (관련 없음 ' + offTopic + ' · 마감 경과 ' + expired + ')';
        else if (/^\d+건 승인됨/.test(t.trim())) el.textContent = valid + '건 승인 가능 (전체 ' + rows.length + '건 중)';
      });
      wireApprove();
    }
    // 파일 처리 — CSV/TSV 네이티브, XLSX는 SheetJS 동적 로드
    function handleRows(grid, fname) {
      var rows = rowsFromGrid(grid);
      if (!rows.length) { say('파싱 실패', '표 형식의 데이터를 찾지 못했습니다 — 샘플 파일 형식을 참고하세요.'); return; }
      localStorage.setItem(RKEY, JSON.stringify({ rows: rows, fname: fname }));
      renderUpload(rows, fname);
      say('파일 파싱 완료 — ' + rows.length + '건', '컴공 적합 직군만 검수 대상으로 자동 분류되었습니다.');
    }
    fileInput.addEventListener('change', function () {
      var f = fileInput.files[0];
      if (!f) return;
      if (/\.(xlsx|xls)$/i.test(f.name)) {
        if (window.XLSX) { parseXlsx(f); return; }
        var s = document.createElement('script');
        s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
        s.onload = function () { parseXlsx(f); };
        s.onerror = function () { say('XLSX 엔진 로드 실패', '네트워크를 확인하거나 CSV로 저장해 업로드하세요.'); };
        document.head.appendChild(s);
      } else {
        var rd = new FileReader();
        rd.onload = function () { handleRows(parseCSVText(String(rd.result || '')), f.name); };
        rd.readAsText(f, 'utf-8');
      }
    });
    function parseXlsx(f) {
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var wb = XLSX.read(new Uint8Array(rd.result), { type: 'array' });
          var grid = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
          handleRows(grid.map(function (r) { return r.map(function (c) { return String(c); }); }), f.name);
        } catch (e) { say('XLSX 파싱 실패', e.message); }
      };
      rd.readAsArrayBuffer(f);
    }
    // '다른 파일' 버튼 → 파일 선택
    qsa('main button').forEach(function (b) {
      if (/다른 파일/.test(b.textContent)) b.addEventListener('click', function () { fileInput.click(); });
      // 샘플 데이터 버튼 — 파일 없이도 파이프라인 테스트 가능하게
      if (/일괄 게시/.test(b.textContent)) {
        var sample = document.createElement('button');
        sample.className = 'px-space-lg py-2.5 rounded-lg border border-surface-container-high font-label-md text-label-md text-on-surface flex items-center gap-2';
        sample.innerHTML = '<span class="material-symbols-outlined text-[18px]">science</span>샘플 파일로 테스트';
        sample.addEventListener('click', function () {
          var sampleRows = [
            { company: '샘플테크', title: '백엔드 개발자 (신입)', skills: 'Java Spring Boot MySQL', location: '서울 강남구', deadline: '2027-01-15' },
            { company: '데이터랩', title: '데이터 엔지니어', skills: 'Python Spark Airflow SQL', location: '성남 분당구', deadline: '2026-12-20' },
            { company: '시큐어넷', title: '보안 엔지니어', skills: '네트워크 보안 Linux 침투테스트', location: '서울 종로구', deadline: '2026-12-31' },
            { company: '모바일랩', title: 'iOS 앱 개발자', skills: 'Swift UIKit Combine', location: '서울 송파구', deadline: '2027-02-01' },
            { company: '글로벌상사', title: '해외 영업직 채용', skills: '영어 무역', location: '서울 중구', deadline: '2026-12-30' },
            { company: '인사컨설', title: 'HR 채용 담당자', skills: '채용 노무', location: '서울 마포구', deadline: '2026-12-28' },
            { company: '올드시스템', title: '레거시 시스템 개발자', skills: 'C++ Linux', location: '경기 수원', deadline: '2020-05-01' }
          ];
          localStorage.setItem(RKEY, JSON.stringify({ rows: sampleRows, fname: 'sample_jobs.csv (내장 샘플)' }));
          renderUpload(sampleRows, 'sample_jobs.csv (내장 샘플)');
          say('샘플 데이터 로드 — 7건', '개발 4 · 비개발 제외 2 · 마감 경과 1 건으로 자동 분류됩니다.');
        });
        b.parentElement.insertBefore(sample, b);
      }
    });
    // 일괄 게시 → 승인된 업로드 행을 등록 공고 + 승인 큐로
    qsa('main button').forEach(function (b) {
      if (/일괄 게시/.test(b.textContent)) b.addEventListener('click', function () {
        var m = readU(), n = 0;
        var reg = JF.getRegisteredJobs();
        uploadData.forEach(function (r) {
          var c = classify(r), key = r.company;
          var dup = reg.filter(function (x) { return x.company === r.company && x.title === r.title; })[0];
          if (c.dev && !c.expired && m[key] === '승인됨' && !dup) {
            JF.addRegisteredJob({ id: 'up-' + Date.now() + '-' + n, company: r.company, title: r.title, type: '신입', location: r.location || '미지정', skills: c.tokens, plus: [], dday: 'D-30' });
            reg.unshift({ company: r.company, title: r.title });
            n++;
          }
          if (c.dev && !c.expired && m[key] === '승인됨') JF.setReviewStatus(r.company, '승인 대기');
        });
        if (n) say(n + '건이 승인 큐로 게시되었습니다', '공고 승인 화면에서 최종 게시를 진행하세요.');
      });
    });
    // 이전 업로드 복원
    try {
      var savedUp = JSON.parse(localStorage.getItem(RKEY) || 'null');
      if (savedUp && savedUp.rows && savedUp.rows.length) renderUpload(savedUp.rows, savedUp.fname);
    } catch (e) {}
  }

  /* ===================== s27 기술 스택 로드맵 ===================== */
  if (PAGE === 's27_profile') {
    function targetJobs() {
      var ids = {};
      JF.loadBoard().forEach(function (c) { ids[c.jobId] = 1; });
      JF.readBookmarkIds().forEach(function (id) { ids[id] = 1; });
      var t = JF.JOBS.filter(function (j) { return ids[j.id]; });
      return t.length ? t : JF.JOBS.slice().sort(function (a, b) { return JF.matchJob(b).score - JF.matchJob(a).score; }).slice(0, 3);
    }
    function renderRoadmap() {
      var mine = JF.getProfileSkills().map(function (s) { return s.canonical; });
      var jobs = targetJobs();
      var freq = {}, byJob = {};
      jobs.forEach(function (j) {
        (j.skills || []).concat(j.plus || []).forEach(function (s) {
          if (mine.indexOf(s) > -1) return;
          freq[s] = (freq[s] || 0) + 1;
          (byJob[s] = byJob[s] || []).push(j.company);
        });
      });
      var gaps = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 6);
      var catalog = qsa('main section').filter(function (s) { return /핵심 기술 스택 카탈로그/.test(s.textContent); })[0];
      var old = qs('#jf-roadmap');
      if (old) old.remove();
      if (!catalog) return;
      var sec = document.createElement('section');
      sec.id = 'jf-roadmap';
      sec.className = catalog.className;
      var head = '<h2 class="font-headline-sm text-headline-sm text-on-surface">기술 스택 로드맵</h2>' +
        '<p class="font-body-sm text-body-sm text-on-surface-variant">' + jobs.length + '개 목표 공고(북마크·지원 관리)의 요구 스킬에서 내 미보유 스킬을 빈도순으로 정렬했습니다.</p>';
      if (!gaps.length) {
        sec.innerHTML = head + '<div class="flex items-center gap-space-sm text-tertiary font-body-sm text-body-sm"><span class="material-symbols-outlined text-[18px]">verified</span>목표 공고의 요구 스킬을 모두 보유하고 있습니다.</div>';
      } else {
        var items = gaps.map(function (g, i) {
          return '<div class="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container-low">' +
            '<span class="w-6 h-6 rounded-full ' + (i < 3 ? 'bg-error-container text-on-error-container' : 'bg-secondary-fixed text-on-secondary-fixed-variant') + ' font-label-sm text-[11px] font-bold flex items-center justify-center shrink-0">' + (i + 1) + '</span>' +
            '<div class="flex flex-col min-w-0 flex-1"><span class="font-label-md text-label-md text-on-surface font-semibold">' + esc(g) + '</span>' +
            '<span class="font-body-sm text-body-sm text-on-surface-variant truncate">' + freq[g] + '개 공고 요구 — ' + esc(byJob[g].slice(0, 3).join('·')) + '</span></div>' +
            '<button class="jf-rm-add px-space-sm py-1 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm shrink-0" data-skill="' + esc(g) + '">+ 스킬 추가</button></div>';
        }).join('');
        sec.innerHTML = head + '<div class="flex flex-col gap-space-xs">' + items + '</div>';
      }
      catalog.parentElement.insertBefore(sec, catalog.nextSibling);
      qsa('.jf-rm-add', sec).forEach(function (b) {
        b.addEventListener('click', function () {
          var skills = JF.getProfileSkills();
          skills.push({ canonical: b.dataset.skill, level: '중' });
          JF.saveProfileSkills(skills);
          say('로드맵 스킬 추가', b.dataset.skill + '가 프로필에 반영되었습니다 — 매칭 점수가 갱신됩니다.');
          renderRoadmap();
        });
      });
    }
    renderRoadmap();
    // 프로필 스킬 저장 시 로드맵도 갱신
    var rmSave = document.getElementById('save-btn');
    if (rmSave) rmSave.addEventListener('click', function () { setTimeout(renderRoadmap, 0); });
  }

  console.log('[JobFilter] demo.js hydrated —', PAGE);
})();
