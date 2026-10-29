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
    var bms = JF.readBookmarkIds();
    var grid = qs('.grid.grid-cols-1, .grid');

    // 기업 등록 공고(jf-registered-jobs) 카드 삽입
    JF.getRegisteredJobs().forEach(function (rj) {
      if (!grid) return;
      var card = document.createElement('div');
      card.className = 'bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-primary flex flex-col gap-space-sm';
      card.innerHTML =
        '<div class="flex items-start justify-between"><div class="flex items-center gap-space-sm">' +
        '<div class="w-10 h-10 rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center font-headline-sm">' + esc((rj.company || '신')[0]) + '</div>' +
        '<div><p class="font-body-sm text-body-sm text-on-surface-variant">' + esc(rj.company) + '</p>' +
        '<h3 class="font-headline-sm text-headline-sm text-on-surface">' + esc(rj.title) + '</h3></div></div></div>' +
        '<p class="font-body-sm text-body-sm text-on-surface-variant">' + esc(rj.type || '') + ' · ' + esc(rj.location || '') + '</p>' +
        '<div class="flex items-center justify-between mt-auto pt-space-sm border-t border-surface-container">' +
        '<span class="font-label-sm text-label-sm text-primary font-bold">등록 신청됨</span>' +
        '<button class="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm">승인 대기</button></div>';
      grid.insertBefore(card, grid.firstChild);
      say('등록 신청 공고 반영', rj.company + ' — 관리자 승인 후 게시됩니다.');
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

  /* ===================== s14 칸반 ===================== */
  if (PAGE === 's14_kanban') {
    var STAGE_OF_COL = { '서류 준비 중': 'preparing', '지원 완료': 'applied', '서류 합격': 'screened', '면접 예정': 'interview', '최종 합격': 'offer', '불합격': 'rejected' };
    var cols = qsa('section .w-64').map(function (col) {
      var label = '';
      Object.keys(STAGE_OF_COL).forEach(function (k) { if (col.textContent.slice(0, 200).indexOf(k) > -1) label = k; });
      return { el: col, stage: STAGE_OF_COL[label], body: qs('div[class*="min-h-["]', col) };
    }).filter(function (c) { return c.stage && c.body; });

    function identifyCard(el) {
      var company = (qs('.font-label-sm', el) || {}).textContent || '';
      var role = (qs('p', el) || {}).textContent || '';
      var all = JF.loadBoard();
      return all.filter(function (c) {
        return c.company === company.trim() && role.trim().indexOf(c.role.replace(/\s*\(.*\)$/, '').trim()) > -1 ||
               (company.trim() === c.company && el.textContent.indexOf(c.role) > -1);
      })[0] || all.filter(function (c) { return c.company === company.trim() && c.role === role.trim(); })[0] || null;
    }
    function colFor(stage) { return cols.filter(function (c) { return c.stage === stage; })[0]; }
    function refreshColCounts() {
      cols.forEach(function (c) {
        var n = c.body.querySelectorAll('[class*="cursor-grab"]').length;
        qsa('.rounded-full', c.el).forEach(function (sp) { if (/^\d+$/.test(sp.textContent.trim())) sp.textContent = n; });
      });
      var h1 = qs('main h1');
      if (h1 && /총 \d+개/.test(h1.textContent)) h1.textContent = h1.textContent.replace(/총 \d+개/, '총 ' + JF.loadBoard().length + '개');
      // 상단 요약 배지(있으면) 동기화
      var counts = JF.stageCounts(JF.loadBoard());
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

    qsa('[class*="cursor-grab"]').forEach(function (cardEl) {
      var card = identifyCard(cardEl);
      if (card) cardEl.dataset.cardId = card.id;
      wireCardButtons(cardEl);
      // 드래그 종료 후 단계 영속
      cardEl.addEventListener('dragend', function () { setTimeout(persistPositions, 50); });
    });
    refreshColCounts();
  }

  /* ===================== s14b 체크리스트 ===================== */
  if (PAGE === 's14b_checklist') {
    qsa('[class*="cursor-pointer"], .cursor-pointer').forEach(function () {});
    // 카드별 체크리스트 항목 — 카드 텍스트에서 카드 식별
    qsa('div').forEach(function (d) {
      var card = JF.SEED_CARDS.filter(function (c) {
        return c.items && d.textContent.indexOf(c.company) > -1 && d.textContent.indexOf(c.role.split(' ')[0]) > -1;
      })[0];
      if (!card || d.dataset.bound) return;
      var lis = qsa('div', d).filter(function (x) {
        return x.textContent.length < 60 && card.items.some(function (it) { return x.textContent.indexOf(it.label.slice(0, 12)) > -1; });
      });
      if (lis.length < 2) return;
      d.dataset.bound = '1';
      var saved = JF.getChecklist(card.id);
      lis.slice(0, card.items.length).forEach(function (li, i) {
        var done = saved ? !!saved[i] : card.items[i].done;
        paint(li, done);
        li.style.cursor = 'pointer';
        li.addEventListener('click', function () {
          var now = JF.toggleChecklist(card.id, i);
          paint(li, now);
          updateProgress(d);
        });
      });
      function paint(li, done) {
        var ic = qs('.material-symbols-outlined', li);
        if (ic) ic.textContent = done ? 'check_box' : 'check_box_outline_blank';
        li.style.opacity = done ? '0.6' : '1';
      }
      function updateProgress(host) {
        var flags = JF.getChecklist(card.id) || card.items.map(function (i2) { return i2.done; });
        var done = flags.filter(Boolean).length;
        qsa('span, p', host).forEach(function (el) {
          if (/^\d+\/\d+$/.test(el.textContent.trim())) el.textContent = done + '/' + flags.length;
        });
      }
      updateProgress(d);
    });
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
  }

  /* ===================== s16 분석 ===================== */
  if (PAGE === 's16_analysis') {
    var res = JF.scoreResume(JF.currentResume());
    // 종합 점수
    qsa('main .font-display-lg, main .font-headline-md, main div, main span').forEach(function (el) {
      if (/^\d+\s*\/\s*100$/.test(el.textContent.trim()) && el.children.length < 3) {
        el.innerHTML = res.total + ' <span class="font-body-sm text-body-sm text-on-surface-variant">/ 100</span>';
      }
    });
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
    });
  }

  /* ===================== s41 승인 큐 ===================== */
  if (PAGE === 's41_admin_review') {
    var saved = JF.getReviewStatus();
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
      });
    });
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
  }

  console.log('[JobFilter] demo.js hydrated —', PAGE);
})();
