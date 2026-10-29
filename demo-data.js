/* ============================================================================
 * JobFilter 데모 데이터 + 엔진 — 정적 HTML이 jobfilter-web(Next.js)과
 * 동일한 계산을 하도록 앱 lib/* 를 vanilla JS로 포팅한 단일 소스.
 * localStorage 키도 앱과 동일하게 사용 (jf-*).
 * ==========================================================================*/
window.JF = (function () {
  'use strict';

  /* ─── 스킬 사전 (lib/skills/dictionary.ts 동기화) ─── */
  var DICTIONARY = [
    ['TypeScript','Language',['TS','타입스크립트']],
    ['JavaScript','Language',['JS','자바스크립트','ECMAScript']],
    ['Java','Language',['자바']],
    ['Python','Language',['파이썬']],
    ['C++','Language',['CPP','씨플러스플러스']],
    ['C#','Language',['CSharp','씨샵']],
    ['Kotlin','Language',['코틀린']],
    ['Swift','Language',['스위프트']],
    ['Go','Language',['Golang'],1],
    ['Rust','Language',['러스트']],
    ['R','Language',['R언어'],1],
    ['Ruby','Language',['루비']],
    ['PHP','Language',[]],
    ['SQL','Language',[]],
    ['React','Frontend',['React.js','ReactJS','리액트']],
    ['Next.js','Frontend',['NextJS','넥스트']],
    ['Vue','Frontend',['Vue.js','VueJS','뷰']],
    ['Angular','Frontend',['앵귤러']],
    ['Svelte','Frontend',['스벨트']],
    ['React Native','Frontend',['ReactNative','리액트네이티브']],
    ['Flutter','Frontend',['플러터']],
    ['Tailwind CSS','Frontend',['TailwindCSS','테일윈드']],
    ['Redux','Frontend',['리덕스']],
    ['GraphQL','Frontend',['그래프QL']],
    ['Webpack','Frontend',['웹팩']],
    ['Vite','Frontend',['비트']],
    ['웹 접근성','Frontend',['웹접근성','a11y']],
    ['Node.js','Backend',['NodeJS','노드']],
    ['Express','Backend',['익스프레스'],1],
    ['Spring Boot','Backend',['SpringBoot','스프링부트','스프링 부트']],
    ['Spring','Backend',['스프링'],1],
    ['NestJS','Backend',['Nest.js']],
    ['Django','Backend',['장고']],
    ['Flask','Backend',['플라스크']],
    ['REST API','Backend',['RESTful','REST']],
    ['MySQL','Backend',[]],
    ['PostgreSQL','Backend',['Postgres']],
    ['MongoDB','Backend',['몽고DB','몽고디비']],
    ['Redis','Backend',['레디스']],
    ['Elasticsearch','Backend',['ElasticSearch','엘라스틱서치']],
    ['Kafka','Backend',['카프카']],
    ['Firebase','Backend',['파이어베이스']],
    ['Supabase','Backend',['수파베이스']],
    ['Microservices','Backend',['MSA','마이크로서비스']],
    ['JWT','Backend',[]],
    ['OAuth','Backend',['오어스']],
    ['Docker','DevOps',['도커']],
    ['Kubernetes','DevOps',['K8s','쿠버네티스']],
    ['AWS','DevOps',['Amazon Web Services','아마존웹서비스']],
    ['GCP','DevOps',['Google Cloud','구글클라우드']],
    ['Azure','DevOps',['애저']],
    ['CI/CD','DevOps',['CICD','지속적 통합']],
    ['Terraform','DevOps',['테라폼']],
    ['Airflow','DevOps',['Apache Airflow','에어플로우']],
    ['Jenkins','DevOps',['젠킨스']],
    ['GitHub Actions','DevOps',['깃허브액션','GithubActions']],
    ['Linux','DevOps',['리눅스']],
    ['Git','DevOps',['깃']],
    ['GitHub','DevOps',['깃허브']],
    ['GitLab','DevOps',['깃랩']],
    ['Pandas','Data',['판다스']],
    ['NumPy','Data',['넘파이']],
    ['Spark','Data',['Apache Spark','스파크'],1],
    ['Hadoop','Data',['하둡']],
    ['scikit-learn','Data',['sklearn','사이킷런']],
    ['TensorFlow','Data',['텐서플로우']],
    ['PyTorch','Data',['파이토치']],
    ['AI','Domain',['인공지능'],1],
    ['Machine Learning','Domain',['ML','머신러닝']],
    ['Deep Learning','Domain',['딥러닝']],
    ['NLP','Domain',['자연어처리']],
    ['Computer Vision','Domain',['컴퓨터비전']],
    ['LLM','Domain',['대규모언어모델']],
    ['분산 시스템','Domain',['분산시스템']],
    ['분산 스토리지','Domain',['분산스토리지','분산 키-값 저장소','분산 저장']],
    ['동시성 제어','Domain',['동시성제어']],
    ['Raft','Domain',[],1],
    ['성능 최적화','Domain',['성능최적화']],
    ['트래픽 최적화','Domain',['트래픽최적화']],
    ['테스트 코드','Domain',['테스트코드']],
    ['TDD','Domain',['테스트주도개발']],
    ['코드 리뷰','Domain',['코드리뷰','Code Review']],
    ['Agile','Domain',['애자일'],1],
    ['Scrum','Domain',['스크럼']],
    ['협업','Domain',['커뮤니케이션']],
    ['Figma','Domain',['피그마']],
    ['Jira','Domain',['지라']]
  ].map(function (r) { return { canonical: r[0], category: r[1], aliases: r[2], caution: !!r[3] }; });

  /* ─── 매칭 엔진 (lib/matching/match.ts 동기화) ─── */
  var ESC_RE = /[.*+?^${}()|[\]\\]/g;
  function surfacePattern(s) { return s.replace(ESC_RE, '\\$&').replace(/\s+/g, '\\s+'); }
  function surfaceKey(s) { return String(s).toLowerCase().replace(/\s+/g, ' ').trim(); }

  var _compiled = null;
  function getCompiled() {
    if (_compiled) return _compiled;
    var surfaces = [], lookup = {};
    DICTIONARY.forEach(function (e) {
      [{ raw: e.canonical, canonical: e.canonical, via: 'exact' }]
        .concat(e.aliases.map(function (a) { return { raw: a, canonical: e.canonical, via: 'alias' }; }))
        .forEach(function (d) {
          surfaces.push(d);
          var k = surfaceKey(d.raw);
          if (!lookup[k]) lookup[k] = d;
        });
    });
    surfaces.sort(function (a, b) { return b.raw.length - a.raw.length; });
    var re = new RegExp('(?<![A-Za-z0-9])(?:' + surfaces.map(function (s) { return surfacePattern(s.raw); }).join('|') + ')(?![A-Za-z0-9])', 'giu');
    _compiled = { re: re, lookup: lookup };
    return _compiled;
  }

  function extractTokens(text) {
    var c = getCompiled(), out = [];
    c.re.lastIndex = 0;
    var m;
    while ((m = c.re.exec(text))) {
      var s = c.lookup[surfaceKey(m[0])];
      if (s) out.push({ text: m[0], canonical: s.canonical, via: s.via, start: m.index, end: m.index + m[0].length });
    }
    return out;
  }

  function analyzeText(text) {
    var tokens = extractTokens(text), byCanonical = {};
    tokens.forEach(function (t) { (byCanonical[t.canonical] = byCanonical[t.canonical] || []).push(t); });
    return DICTIONARY.map(function (entry) {
      var mine = byCanonical[entry.canonical] || [];
      return {
        entry: entry,
        exact: mine.filter(function (t) { return t.via === 'exact'; }).length,
        alias: mine.filter(function (t) { return t.via === 'alias'; }).length
      };
    });
  }

  function keywordCoverage(text, required) {
    var analysis = analyzeText(text);
    var perSkill = required.map(function (canonical) {
      var a = analysis.filter(function (x) { return surfaceKey(x.entry.canonical) === surfaceKey(canonical); })[0];
      return { canonical: canonical, exact: a ? a.exact : 0, alias: a ? a.alias : 0 };
    });
    var n = required.length || 1;
    return {
      exactCoverage: perSkill.filter(function (s) { return s.exact > 0; }).length / n,
      totalCoverage: perSkill.filter(function (s) { return s.exact + s.alias > 0; }).length / n,
      uncovered: perSkill.filter(function (s) { return s.exact + s.alias === 0; }).map(function (s) { return s.canonical; }),
      aliasOnly: perSkill.filter(function (s) { return s.exact === 0 && s.alias > 0; }).map(function (s) { return s.canonical; }),
      perSkill: perSkill
    };
  }

  /* ─── 공고 데이터 (lib/jobs.ts 동기화) ─── */
  var JOBS = [
    { id: '1', company: '네이버', title: '프론트엔드 개발자 (신입)', logo: 'N', logoBg: '#03c75a', logoText: '#fff',
      location: '성남 분당구', type: '신입 · 정규직', salary: '5,000만원~',
      skills: ['React', 'TypeScript', 'Next.js'], plus: ['테스트 코드'], dday: 'D-3', urgent: true, isNew: true,
      category: '프론트엔드', companyFull: '네이버 (NAVER)', team: 'FE Platform팀',
      deadline: 'D-3 (마감 2026.10.25 23:59)',
      duties: ['네이버 서비스 웹 프론트엔드 React·Next.js 기반 개발 및 성능 최적화', '디자인 시스템 컴포넌트 구축과 웹 접근성 표준 준수', '대규모 트래픽 환경의 렌더링 성능 개선 및 번들 최적화'],
      requirements: ['컴퓨터공학·소프트웨어 전공 또는 이에 준하는 CS 기초 지식', 'React와 TypeScript로 프로젝트를 완성해 본 경험', '상태 관리·컴포넌트 설계에 대한 이해', '신입 또는 2년 이하 경력'],
      preferred: ['테스트 코드(Jest·Playwright 등) 작성 경험', '웹 접근성·시맨틱 마크업에 대한 관심', '오픈소스 기여 또는 기술 블로그 운영'],
      alumni: { count: '31명', stat: '58.2%', statLabel: '서류→최종 전환율' } },
    { id: '2', company: '카카오', title: '백엔드 엔지니어', logo: '카', logoBg: '#fae100', logoText: '#3c1e1e',
      location: '성남 분당구', type: '신입·경력 · 정규직', salary: '연봉 협의',
      skills: ['Java', 'Spring Boot', 'MySQL'], plus: ['Kubernetes'], dday: 'D-5', urgent: true,
      category: '백엔드', companyFull: '카카오 (Kakao)', team: '커머스 플랫폼팀',
      deadline: 'D-5 (마감 2026.10.27 23:59)',
      duties: ['커머스 주문·결제 백엔드 API 서버 Java·Spring Boot 기반 개발', 'MySQL 인덱스·쿼리 튜닝을 통한 대용량 트랜잭션 성능 개선', 'Kubernetes 기반 배포 파이프라인 및 서비스 운영 지표 관리'],
      requirements: ['Java와 Spring Boot로 API 서버를 개발해 본 경험', 'MySQL 등 RDBMS 스키마 설계와 쿼리 최적화 이해', 'REST API 설계 원칙과 HTTP 프로토콜 이해', '신입 또는 3년 이하 경력'],
      preferred: ['Kubernetes·Docker 기반 컨테이너 배포 경험', '대용량 트래픽 서비스 운영 경험', 'MSA 아키텍처 설계 참여 경험'],
      alumni: { count: '19명', stat: '47.3%', statLabel: '서류→최종 전환율' } },
    { id: '3', company: '토스', title: '풀스택 개발자', logo: '토', logoBg: '#0064ff', logoText: '#fff',
      location: '서울 강남구', type: '신입 · 정규직', salary: '6,000만원~',
      skills: ['React', 'Node.js'], plus: ['GraphQL', 'AWS'], dday: 'D-8',
      category: '풀스택', companyFull: '토스 (Toss)', team: '코어 서비스팀',
      deadline: 'D-8 (마감 2026.10.30 23:59)',
      duties: ['금융 서비스 웹·API 풀스택 개발 (React + Node.js)', 'GraphQL 스키마 설계와 BFF 레이어 성능 개선', '서비스 지표 대시보드 및 배포 자동화 개선'],
      requirements: ['React 또는 Node.js로 서비스를 개발해 본 경험', 'CS 기초(자료구조·네트워크·데이터베이스) 이해', '문제를 끝까지 파고들어 해결한 경험', '신입 지원 가능'],
      preferred: ['GraphQL API 설계·운영 경험', 'AWS 클라우드 환경 배포 경험', '제품 임팩트를 수치로 검증한 경험'],
      alumni: { count: '8명', stat: '41.0%', statLabel: '서류→최종 전환율' } },
    { id: '4', company: '당근마켓', title: 'Platform & Cloud 인프라 엔지니어 (체험형 인턴)', logo: '당', logoBg: '#ff6f0f', logoText: '#fff',
      location: '서울 서초구', type: '인턴(3개월) · 체험형', salary: '월 320만원',
      skills: ['Docker', 'Kubernetes', 'Linux'], plus: ['Terraform'], dday: 'D-5', urgent: true, isNew: true,
      category: '클라우드/인프라', companyFull: '당근마켓 (Daangn)', team: '플랫폼엔지니어링팀',
      deadline: 'D-5 (마감 2024.11.15 23:59)',
      duties: ['수천만 사용자를 서빙하는 당근마켓 Kubernetes 클러스터 운영 및 자동화 파이프라인 고도화 지원', 'AWS EKS 기반 멀티 클러스터 인프라 모니터링 개선 및 이상 트래픽 감지 룰셋 튜닝', '내부 개발자 플랫폼 CLI 도구 Go 언어 기반 개발', 'IaC 프레임워크 기반 클라우드 리소스 워크플로우 검증'],
      requirements: ['전산 기초(네트워크·운영체제·자료구조)를 탄탄히 갖추신 분', 'Linux 환경과 컨테이너(Docker) 빌드 경험이 있으신 분', 'Go, Python 중 한 가지 언어로 스크립팅 또는 API 서버 구축이 가능하신 분', '주 5일 오프라인 인턴 근무 가능한 4학년 재학생 또는 기졸업자'],
      preferred: ['AWS, GCP 등 퍼블릭 클라우드 구축·배포 프로젝트 경험', 'Terraform, Helm, ArgoCD 등 클라우드 네이티브 툴체인 경험', '오픈소스 기여 또는 기술 블로그 운영 경험', 'CS 동아리·학술대회 인프라 설계 수상 이력'],
      alumni: { count: '14명', stat: '71.4%', statLabel: '인턴 후 정규직 전환율' } },
    { id: '5', company: '라인', title: '데이터 플랫폼 엔지니어', logo: 'L', logoBg: '#00b900', logoText: '#fff',
      location: '성남 분당구', type: '신입 · 정규직', salary: '5,500만원~',
      skills: ['Python', 'SQL'], plus: ['Spark', 'Airflow'], dday: 'D-12',
      category: '데이터 엔지니어링', companyFull: '라인 (LINE)', team: '데이터 플랫폼팀',
      deadline: 'D-12 (마감 2026.11.03 23:59)',
      duties: ['로그 수집·정제 데이터 파이프라인 Python 기반 개발', 'SQL 분석 쿼리 최적화와 데이터 마트 구축', 'Airflow 배치 스케줄링 및 Spark 분산 처리 운영 지원'],
      requirements: ['Python으로 데이터 처리 스크립트를 작성해 본 경험', 'SQL 조인·집계 쿼리를 능숙하게 작성 가능', '데이터 구조와 분산 처리 기본 개념 이해', '신입 지원 가능'],
      preferred: ['Spark 등 분산 처리 프레임워크 사용 경험', 'Airflow 등 워크플로우 오케스트레이션 경험', '데이터 파이프라인 개인 프로젝트'],
      alumni: { count: '11명', stat: '39.5%', statLabel: '서류→최종 전환율' } },
    { id: '6', company: '쿠팡', title: 'iOS 앱 개발자', logo: '쿠', logoBg: '#d32f2f', logoText: '#fff',
      location: '서울 송파구', type: '신입 · 정규직', salary: '연봉 협의',
      skills: ['Git'], plus: ['Swift', 'UIKit'], dday: 'D-14',
      category: '모바일', companyFull: '쿠팡 (Coupang)', team: 'CX 모바일팀',
      deadline: 'D-14 (마감 2026.11.05 23:59)',
      duties: ['쿠팡 iOS 앱 주문·검색 화면 Swift·UIKit 기반 개발', '앱 성능 프로파일링과 크래시율 개선', 'A/B 테스트 기반 사용자 경험 개선 실험'],
      requirements: ['Git 기반 협업 버전 관리 경험', '모바일 앱 개발 기초 또는 관심', 'CS 기초(자료구조·운영체제) 이해', '신입 지원 가능'],
      preferred: ['Swift·UIKit 개인 프로젝트 또는 앱스토어 배포 경험', '비동기 프로그래밍·메모리 관리 이해', 'UI 테스트 자동화 경험'],
      alumni: { count: '9명', stat: '44.8%', statLabel: '서류→최종 전환율' } },
    { id: '7', company: '네이버클라우드', title: '분산 스토리지 백엔드 (신입·채용연계형)', logo: 'NC', logoBg: '#17ce5f', logoText: '#fff',
      location: '성남 분당구', type: '신입 · 채용연계형', salary: '4,800만원~',
      skills: ['C++', 'Linux', '분산 시스템'], plus: ['Go', 'Kubernetes', 'Redis', '분산 스토리지'], dday: 'D-9', isNew: true,
      category: '백엔드/스토리지', companyFull: '네이버클라우드 (NAVER Cloud)', team: 'Storage Platform팀',
      deadline: 'D-9 (마감 2026.10.31 18:00)',
      duties: ['초당 수십만 건의 I/O를 처리하는 오브젝트·블록 스토리지 백엔드 시스템 개발', 'Raft 기반 분산 합의 계층의 복제·장애 복구 로직 설계 및 구현', 'Linux epoll 기반 고성능 네트워크 I/O 경로와 락프리 자료구조 최적화', '대규모 클러스터 부하 테스트·레이턴시 프로파일링을 통한 트래픽 최적화'],
      requirements: ['컴퓨터공학·소프트웨어 전공 또는 이에 준하는 CS 기초', 'C++ 등 시스템 프로그래밍 언어로 성능이 중요한 코드 작성 경험', 'Linux 환경 개발·디버깅과 동시성 제어 기본기', '분산 시스템의 일관성·복제 개념 이해 (학부 수준 가능)'],
      preferred: ['Go 언어 기반 서비스 또는 CLI 도구 개발 경험', 'Kubernetes·Redis 등 클라우드 네이티브 생태계 경험', 'Raft·Paxos 등 합의 알고리즘 구현 또는 분석 경험', '정량 지표로 성능 개선을 입증한 프로젝트'],
      alumni: { count: '22명', stat: '63.6%', statLabel: '인턴 후 정규직 전환율' } }
  ];
  function getJob(id) { return JOBS.filter(function (j) { return j.id === String(id); })[0] || null; }

  /* ─── 프로필 스킬 (lib/profile.ts 동기화) — jf-profile-skills 로 확장/영속 ─── */
  var PROFILE_SEED = [
    { canonical: 'Java', level: '상' }, { canonical: 'Spring Boot', level: '상' },
    { canonical: 'Go', level: '중' }, { canonical: 'Node.js', level: '중' },
    { canonical: 'Docker', level: '상' }, { canonical: 'Kubernetes', level: '중' },
    { canonical: 'AWS', level: '중' }, { canonical: 'Linux', level: '상' },
    { canonical: 'MySQL', level: '상' }, { canonical: 'Redis', level: '중' },
    { canonical: 'PostgreSQL', level: '하' }
  ];
  var PROFILE_KEY = 'jf-profile-skills';
  function getProfileSkills() {
    try {
      var raw = localStorage.getItem(PROFILE_KEY);
      var arr = raw ? JSON.parse(raw) : null;
      if (Array.isArray(arr) && arr.length) return arr;
    } catch (e) {}
    return PROFILE_SEED.slice();
  }
  function saveProfileSkills(list) { localStorage.setItem(PROFILE_KEY, JSON.stringify(list)); }
  function ownedSet() {
    var set = {};
    getProfileSkills().forEach(function (s) { set[surfaceKey(s.canonical)] = true; });
    return set;
  }

  /* ─── 매칭 점수 (lib/profile.ts matchJobWith 동기화)
   * score = min(95, round(20 + 80×(필수충족률×0.75 + 우대충족률×0.25))) */
  function matchJobWith(skillSet, job) {
    var has = function (s) { return !!skillSet[surfaceKey(s)]; };
    var mr = job.skills.filter(has), mp = job.plus.filter(has);
    var w = (job.skills.length ? mr.length / job.skills.length * 0.75 : 0) +
            (job.plus.length ? mp.length / job.plus.length * 0.25 : 0);
    return {
      score: Math.min(95, Math.round(20 + 80 * w)),
      matchedRequired: mr, matchedPlus: mp,
      missingRequired: job.skills.filter(function (s) { return !has(s); }),
      missingPlus: job.plus.filter(function (s) { return !has(s); }),
      requiredHit: mr.length, requiredTotal: job.skills.length
    };
  }
  function matchJob(job) { return matchJobWith(ownedSet(), job); }

  /* ─── 칸반 스토어 (lib/kanban.ts 동기화) ─── */
  var STAGE_ORDER = ['preparing', 'applied', 'screened', 'interview', 'offer'];
  var STAGE_LABEL = { preparing: '서류 준비 중', applied: '지원 완료', screened: '서류 합격', interview: '면접 예정', offer: '최종 합격', rejected: '불합격' };

  var SEED_CARDS = [
    { id: 'c1', company: '당근마켓', role: 'DevOps 인턴', match: 92, dday: 'D-14', changed: '10.15', stage: 'preparing' },
    { id: 'c2', company: '쿠팡', role: 'iOS 개발자', match: 65, dday: 'D-10', changed: '10.14', stage: 'preparing' },
    { id: 'c3', company: '라인', role: 'Data Platform', match: 78, dday: 'D-5', changed: '10.11', stage: 'applied' },
    { id: 'c4', company: '우아한형제들', role: '백엔드', match: 81, dday: 'D-8', changed: '10.10', stage: 'applied' },
    { id: 'c5', company: '삼성전자', role: 'DX S/W', match: 74, dday: 'D-12', changed: '10.09', stage: 'applied' },
    { id: 'c6', company: '카카오', role: '클라우드 백엔드', match: 88, dday: '1차면접 D-2', changed: '10.12', stage: 'screened' },
    { id: 'c7', company: '네이버', role: '프론트엔드', match: 92, dday: 'D-6', changed: '10.11', stage: 'screened' },
    { id: 'c8', company: '토스뱅크', role: '백엔드', match: 83, dday: 'D-7', changed: '10.10', stage: 'screened' },
    { id: 'c9', company: '카카오', role: '클라우드 백엔드 (2지망)', match: 88, dday: '10.24 화상', changed: '10.13', stage: 'interview' },
    { id: 'c10', company: '현대자동차', role: 'SW 인턴', match: 79, dday: '10.28', changed: '10.12', stage: 'interview' },
    { id: 'c11', company: '메쉬코리아', role: '데이터 엔지니어 인턴', match: 86, dday: '합격', changed: '10.08', stage: 'offer' },
    { id: 'c12', company: '야놀자', role: '백엔드 (서류 탈락)', match: 71, dday: '-', changed: '10.05', stage: 'rejected' },
    { id: 'c13', company: '직방', role: '프론트엔드 (1차 탈락)', match: 69, dday: '-', changed: '10.03', stage: 'rejected' }
  ];

  var KANBAN_KEY = 'jf-kanban', HISTORY_KEY = 'jf-status-history';
  function readStore() {
    try {
      var s = JSON.parse(localStorage.getItem(KANBAN_KEY) || '{}');
      return { stages: s.stages || {}, added: Array.isArray(s.added) ? s.added : [], checklist: s.checklist || {} };
    } catch (e) { return { stages: {}, added: [], checklist: {} }; }
  }
  function writeStore(s) { localStorage.setItem(KANBAN_KEY, JSON.stringify(s)); }
  function todayStr() { var d = new Date(); return (d.getMonth() + 1) + '.' + String(d.getDate()).padStart(2, '0'); }

  function readHistory() {
    try { var h = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); return Array.isArray(h) ? h : []; }
    catch (e) { return []; }
  }
  function record(e) { var h = readHistory(); h.unshift(e); localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 100))); }

  function loadBoard() {
    var s = readStore();
    return s.added.map(function (c) { return Object.assign({}, c, { stage: s.stages[c.id] || c.stage }); })
      .concat(SEED_CARDS.map(function (c) { return Object.assign({}, c, { stage: s.stages[c.id] || c.stage }); }));
  }
  function stageCounts(cards) {
    var n = { preparing: 0, applied: 0, screened: 0, interview: 0, offer: 0, rejected: 0 };
    cards.forEach(function (c) { n[c.stage] = (n[c.stage] || 0) + 1; });
    return n;
  }
  function moveCard(id, dir) {
    var s = readStore(), card = loadBoard().filter(function (c) { return c.id === id; })[0];
    if (!card) return null;
    var from = card.stage, to;
    if (from === 'rejected') { if (dir !== -1) return null; to = 'applied'; }
    else { var i = STAGE_ORDER.indexOf(from) + dir; if (i < 0 || i >= STAGE_ORDER.length) return null; to = STAGE_ORDER[i]; }
    s.stages[id] = to; writeStore(s);
    record({ cardId: id, company: card.company, role: card.role, from: from, to: to, at: new Date().toISOString() });
    return to;
  }
  function addFromJob(job, match) {
    var s = readStore();
    var existing = s.added.filter(function (c) { return c.jobId === job.id; })[0];
    if (existing) return { card: existing, created: false };
    var card = { id: 'job-' + job.id, jobId: job.id, company: job.company, role: job.title, match: match, dday: job.dday, changed: todayStr(), stage: 'preparing' };
    s.added.unshift(card); writeStore(s);
    record({ cardId: card.id, company: card.company, role: card.role, from: null, to: 'preparing', at: new Date().toISOString() });
    return { card: card, created: true };
  }

  /* ─── 북마크 (lib/bookmarks.ts 동기화) ─── */
  var BOOKMARKS_KEY = 'jf-bookmarks';
  function readBookmarkIds() {
    try { var a = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function toggleBookmark(id) {
    var ids = readBookmarkIds();
    var next = ids.indexOf(id) > -1 ? ids.filter(function (v) { return v !== id; }) : ids.concat([id]);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    return next;
  }

  /* ─── 자소서 (lib/resume.ts 동기화) ─── */
  var RESUME_TITLE = '[대규모 분산 환경의 영속성을 책임지는 스토리지 백엔드 엔지니어로 성장하겠습니다]';
  var RESUME_PARAGRAPHS = [
    '컴퓨터공학과 재학 중 운영체제와 분산 시스템 강의를 수강하며, 네트워크 너머의 다수 노드가 일관성을 유지하며 대용량 데이터를 안전하게 분산 저장하는 기술 메커니즘에 깊은 매력을 느꼈습니다. 특히 네이버클라우드의 오브젝트 스토리지 및 블록 스토리지 아키텍처가 초당 수십만 건의 I/O 요청을 무중단 처리하는 기술 블로그를 분석하며, 분산스토리지 백엔드 개발자로서의 진로를 확고히 결심했습니다.',
    '이를 위해 C++ 기반 분산 키-값 저장소 오픈소스 구현 프로젝트를 4인 팀의 백엔드 리드로 주도했습니다. 당시 Raft 합의 알고리즘을 토대로 노드 장애 발생 시에도 데이터 정합성을 보장하는 리플리케이션 계층을 직접 설계했습니다. 개발 과정에서 다중 스레드 환경의 데이터 경합과 데드락 문제를 해결하기 위해 Linux커널 수준의 epoll I/O 멀티플렉싱과 락프리(Lock-free) 큐 기반의 동시성제어를 적용했습니다.',
    '그 결과, 10개 노드 클러스터 부하 테스트 환경에서 P99 응답 레이턴시를 32ms에서 12ms로 62% 단축하고 트래픽최적화를 통해 피크 타임 처리량을 초당 18,000 QPS까지 끌어올렸습니다. 이러한 실무 지향적 시스템 프로그래밍 역량과 성능 병목 해결 집념을 바탕으로, 네이버클라우드의 안정적이고 확장성 높은 글로벌 클라우드 인프라 개발에 즉시 기여하겠습니다.'
  ];
  var RESUME_FULL = RESUME_TITLE + '\n\n' + RESUME_PARAGRAPHS.join('\n\n');
  var JD_KEYWORDS = ['분산 스토리지', 'C++', 'Linux', '동시성 제어', '트래픽 최적화', 'Raft', '분산 시스템', 'Go', 'Kubernetes', 'Redis'];
  var REQUIRED = ['분산 스토리지', 'C++', 'Linux', '동시성 제어', '트래픽 최적화'];

  /* ─── 자소서 채점 (lib/scoring.ts scoreResume 동기화) ─── */
  function splitSentences(text) {
    return String(text).split(/\n+|(?<=[.!?])\s+/).map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 1 && !/^\[.*\]$/.test(s); });
  }
  var VAGUE_RE = /열심히|최선을 다|노력하겠습니다|배우고 싶습니다|관심이 많습니다|성실하게|열정적으로/g;
  var NUMBER_RE = /\d[\d,.]*\s*(?:%|ms|QPS|TPS|노드|명|인(?!턴)|개|배|점|억|만)/g;
  var STAR_SITUATION = /수강|프로젝트|과제|문제|배경|목표|당시|환경/;
  var STAR_ACTION = /설계|구현|개발|적용|도입|주도|분석|튜닝|최적화|해결|개선/;
  var STAR_RESULT = /결과|향상|개선|단축|달성|끌어올|기여|%|ms|QPS/;
  var TEAM_RE = /팀|협업|리드|소통|커뮤니케이션|리뷰|동료/;

  function scoreResume(text) {
    var sentences = splitSentences(text);
    var body = sentences.join(' ');
    var chars = String(text).trim().length;
    var avgSentence = sentences.length ? Math.round(body.length / sentences.length) : 0;
    var vague = (body.match(VAGUE_RE) || []).length;
    var numbers = new Set(body.match(NUMBER_RE) || []).size;
    var teamSentences = sentences.filter(function (s) { return TEAM_RE.test(s); }).length;
    var coverage = keywordCoverage(body, JD_KEYWORDS);

    var lenScore = chars >= 800 ? 10 : chars >= 650 ? 8 : chars >= 500 ? 6 : chars >= 300 ? 4 : 2;
    var styleScore = Math.max(3, 15 - vague * 3);
    var numScore = Math.min(15, numbers * 5);
    var starScore = (STAR_SITUATION.test(body) ? 8 : 0) + (STAR_ACTION.test(body) ? 8 : 0) + (STAR_RESULT.test(body) ? 9 : 0);
    var kwScore = Math.round(coverage.totalCoverage * 20);
    var sentenceScore = avgSentence <= 60 ? 10 : avgSentence <= 80 ? 8 : avgSentence <= 110 ? 6 : 3;
    var teamScore = teamSentences >= 2 ? 5 : teamSentences === 1 ? 3 : 0;

    var items = [
      { label: '분량', score: lenScore, max: 10 },
      { label: '표현', score: styleScore, max: 15 },
      { label: '수치', score: numScore, max: 15 },
      { label: 'STAR 구조', score: starScore, max: 25 },
      { label: '직군 키워드', score: kwScore, max: 20 },
      { label: '문장 길이', score: sentenceScore, max: 10, weak: avgSentence > 80 },
      { label: '협업', score: teamScore, max: 5 }
    ];
    var uncoveredRequired = coverage.uncovered.filter(function (k) { return REQUIRED.indexOf(k) > -1; });
    var strengths = [];
    if (numbers >= 3) strengths.push('정량 근거 우수 — 수치 지표 ' + numbers + '건 (수치 ' + numScore + '/15점)');
    if (starScore >= 21) strengths.push('상황-행동-결과 STAR 서술 구조 안정적');
    var reqHit = REQUIRED.filter(function (k) { return coverage.uncovered.indexOf(k) < 0; }).length;
    strengths.push('필수 JD 키워드 사전 기준 ' + reqHit + '/' + REQUIRED.length + ' 반영');
    var weaknesses = [];
    if (uncoveredRequired.length) weaknesses.push('필수 키워드 미커버 — ' + uncoveredRequired.join('·') + ' 문장 추가 필요');
    if (coverage.aliasOnly.length) weaknesses.push('표준 표기 미흡 — "' + coverage.aliasOnly.join('·') + '"를 띄어쓰기 표준 표기로 교체 시 ATS 노출');
    if (chars < 800) weaknesses.push('권장 분량 미달 — 현재 ' + chars + '자, 권장 800자 대비 부족');
    if (avgSentence > 80) weaknesses.push('문장 길이 과다 — 평균 ' + avgSentence + '자, 60자 내외 권장');
    if (teamScore === 0) weaknesses.push('협업 경험 서술 부재 — 팀 단위 성과 문장 추가 권장');

    return { items: items, total: items.reduce(function (n, s) { return n + s.score; }, 0),
      strengths: strengths, weaknesses: weaknesses,
      stats: { chars: chars, sentences: sentences.length, avgSentence: avgSentence, numbers: numbers },
      coverage: coverage };
  }

  /* ─── 자소서 초안 저장소 (jf-resume-draft + jf-versions) ─── */
  var DRAFT_KEY = 'jf-resume-draft', VERSIONS_KEY = 'jf-versions';
  function getDraft() {
    try { var d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); return d && d.text ? d : null; }
    catch (e) { return null; }
  }
  function saveDraft(text) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ text: text, at: new Date().toISOString() }));
  }
  function currentResume() { var d = getDraft(); return d ? d.text : RESUME_FULL; }
  function getVersions() {
    try { var v = JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function snapshotVersion() {
    var vs = getVersions();
    var text = currentResume();
    vs.unshift({ n: vs.length + 1, text: text, score: scoreResume(text).total, at: new Date().toISOString() });
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(vs.slice(0, 20)));
    return vs[0];
  }

  /* ─── 승인 큐 영속 (jf-review-status) ─── */
  var REVIEW_KEY = 'jf-review-status';
  function getReviewStatus() {
    try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}'); } catch (e) { return {}; }
  }
  function setReviewStatus(company, status) {
    var s = getReviewStatus(); s[company] = status;
    localStorage.setItem(REVIEW_KEY, JSON.stringify(s));
  }

  /* ─── 기업 등록 공고 (s31 → s11 노출) ─── */
  var REG_KEY = 'jf-registered-jobs';
  function getRegisteredJobs() {
    try { var a = JSON.parse(localStorage.getItem(REG_KEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function addRegisteredJob(job) {
    var a = getRegisteredJobs(); a.unshift(job);
    localStorage.setItem(REG_KEY, JSON.stringify(a));
  }

  /* ─── 체크리스트 (s14b) ─── */
  function toggleChecklist(cardId, index) {
    var s = readStore();
    var flags = s.checklist[cardId] || [];
    flags[index] = !flags[index];
    s.checklist[cardId] = flags;
    writeStore(s);
    return flags[index];
  }
  function getChecklist(cardId) { return readStore().checklist[cardId] || null; }

  /* ─── 학과 코호트 (lib/cohort.ts 동기화 — 지원자 목록·통계 실측 기반) ─── */
  var COHORT = [
    { id: 'S01', name: '김민준', year: 4, skills: ['Java', 'Spring Boot', 'MySQL', 'Docker', 'Git', 'Linux'] },
    { id: 'S02', name: '이서연', year: 4, skills: ['React', 'TypeScript', 'Next.js', 'Git', 'Tailwind'] },
    { id: 'S03', name: '박준혁', year: 4, skills: ['Java', 'Spring Boot', 'Kubernetes', 'AWS', 'Redis', 'MySQL'] },
    { id: 'S04', name: '최지우', year: 4, skills: ['C++', 'Linux', 'Go', '분산 시스템', 'Raft'] },
    { id: 'S05', name: '정우진', year: 4, skills: ['Python', 'SQL', 'Spark', 'Airflow', 'Linux', 'Git'] },
    { id: 'S06', name: '한소율', year: 4, skills: ['Swift', 'UIKit', 'Git', 'iOS'] },
    { id: 'S07', name: '오태양', year: 3, skills: ['Java', 'Spring Boot', 'MySQL', 'Git'] },
    { id: 'S08', name: '서연우', year: 3, skills: ['React', 'JavaScript', 'TypeScript', 'Git'] },
    { id: 'S09', name: '임도현', year: 3, skills: ['Docker', 'Kubernetes', 'Linux', 'Go', 'AWS'] },
    { id: 'S10', name: '강민서', year: 3, skills: ['Python', 'Pandas', 'SQL', 'Git'] },
    { id: 'S11', name: '윤채원', year: 3, skills: ['C++', 'Linux', 'Git'] },
    { id: 'S12', name: '신예린', year: 3, skills: ['Node.js', 'React', 'GraphQL', 'AWS', 'Docker'] },
    { id: 'S13', name: '장준호', year: 4, skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Kubernetes', 'AWS', 'Docker'] },
    { id: 'S14', name: '배수아', year: 4, skills: ['React', 'TypeScript', 'GraphQL', 'Node.js', 'Jest'] },
    { id: 'S15', name: '송지민', year: 3, skills: ['Kotlin', 'Spring Boot', 'MySQL', 'Git'] },
    { id: 'S16', name: '권태희', year: 3, skills: ['Go', 'Docker', 'Kubernetes', 'Linux', 'Terraform'] },
    { id: 'S17', name: '문성민', year: 4, skills: ['C++', 'Go', 'Linux', 'Redis', 'Kubernetes', '분산 시스템'] },
    { id: 'S18', name: '하은재', year: 2, skills: ['Python', 'C', 'Git'] },
    { id: 'S19', name: '노유빈', year: 2, skills: ['Java', 'Git', 'MySQL'] },
    { id: 'S20', name: '류현우', year: 3, skills: ['Rust', 'Linux', 'Git', 'Docker'] },
    { id: 'S21', name: '표지훈', year: 4, skills: ['Java', 'Spring Boot', 'AWS', 'Docker', 'MySQL', 'Kubernetes', 'Redis'] },
    { id: 'S22', name: '이승우', year: 3, skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'AWS'] },
    { id: 'S23', name: '홍시우', year: 4, skills: ['Python', 'Spark', 'Airflow', 'SQL', 'Docker', 'Linux'] },
    { id: 'S24', name: '유재민', year: 3, skills: ['C++', 'Linux', '동시성 제어', 'Git'] }
  ];

  /* s33 지원자 목록 — matchJobWith 점수 내림차순 정렬 (안정 정렬 = 코호트 순서 유지) */
  function applicantsFor(jobId) {
    var job = getJob(jobId) || JOBS[0];
    return COHORT.map(function (s) {
      var set = {};
      s.skills.forEach(function (k) { set[surfaceKey(k)] = true; });
      var m = matchJobWith(set, job);
      return { id: s.id, name: s.name, year: s.year, score: m.score, matched: m.requiredHit, total: job.skills.length };
    }).sort(function (a, b) { return b.score - a.score; });
  }

  return {
    DICTIONARY: DICTIONARY, JOBS: JOBS, getJob: getJob,
    COHORT: COHORT, applicantsFor: applicantsFor,
    getProfileSkills: getProfileSkills, saveProfileSkills: saveProfileSkills,
    matchJob: matchJob, matchJobWith: matchJobWith,
    extractTokens: extractTokens, analyzeText: analyzeText, keywordCoverage: keywordCoverage,
    STAGE_ORDER: STAGE_ORDER, STAGE_LABEL: STAGE_LABEL, SEED_CARDS: SEED_CARDS,
    loadBoard: loadBoard, stageCounts: stageCounts, moveCard: moveCard, addFromJob: addFromJob,
    readHistory: readHistory,
    readBookmarkIds: readBookmarkIds, toggleBookmark: toggleBookmark,
    RESUME_FULL: RESUME_FULL, JD_KEYWORDS: JD_KEYWORDS, REQUIRED: REQUIRED,
    scoreResume: scoreResume, getDraft: getDraft, saveDraft: saveDraft,
    currentResume: currentResume, getVersions: getVersions, snapshotVersion: snapshotVersion,
    getReviewStatus: getReviewStatus, setReviewStatus: setReviewStatus,
    getRegisteredJobs: getRegisteredJobs, addRegisteredJob: addRegisteredJob,
    toggleChecklist: toggleChecklist, getChecklist: getChecklist
  };
})();
