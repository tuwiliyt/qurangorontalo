const DATA_DIR = '../json_enriched';

const el = (q) => document.querySelector(q);
const surahSelect = el('#surahSelect');
const homeBtn = el('#homeBtn');
const ayatList = el('#ayatList');
const metaBox = el('#meta');
const bismillah = el('#bismillah');
const bookmarkBtn = el('#bookmarkBtn');
const themeBtn = el('#themeBtn');
const aboutBtn = el('#aboutBtn');

const modal = el('#modal');
const modalTitle = el('#modalTitle');
const modalBody = el('#modalBody');
const modalClose = el('#modalClose');
const modalBackdrop = el('#modalBackdrop');

const state = {
  surahs: [], // {number, name, name_latin, number_of_ayah}
  currentSurah: null,
  currentData: null,
};

const BOOKMARK_KEY = 'quran.bookmark.v1';
const THEME_KEY = 'quran.theme.v1';

function getBookmark() {
  try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || 'null'); } catch { return null; }
}
function setBookmark(v) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(v));
}

function openModal(title, html) {
  modalTitle.textContent = title;
  modalBody.innerHTML = '';
  const pre = document.createElement('pre');
  pre.innerText = html; // keep text as-is
  modalBody.appendChild(pre);
  modal.classList.remove('hidden');
}
function closeModal() { modal.classList.add('hidden'); }
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadSurahList() {
  // Discover by reading index from local json_enriched directory listing is not possible.
  // We'll build from 1..114 and read minimal meta from each file's root.
  const entries = [];
  for (let i = 1; i <= 114; i++) {
    try {
      const data = await fetchJSON(`${DATA_DIR}/${i}.json`);
      const rootKey = Object.keys(data)[0];
      const s = data[rootKey];
      entries.push({
        number: parseInt(s.number, 10),
        name: s.name,
        name_latin: s.name_latin,
        number_of_ayah: parseInt(s.number_of_ayah, 10),
      });
    } catch (e) {
      console.warn('Skip', i, e);
    }
  }
  state.surahs = entries.sort((a,b)=>a.number-b.number);
  renderSurahSelect();
  renderTOC();
  const bm = getBookmark();
  renderContinue(bm);
  showHome();
}

function renderSurahSelect() {
  surahSelect.innerHTML = '';
  state.surahs.forEach(s => {
    const opt = document.createElement('option');
    opt.value = String(s.number);
    opt.textContent = `${s.number}. ${s.name_latin}`;
    surahSelect.appendChild(opt);
  });
}

function renderTOC(){
  const grid = document.querySelector('#surahGrid');
  grid.innerHTML = '';
  state.surahs.forEach(s=>{
    const card = document.createElement('div');
    card.className = 'surah-card';
    card.addEventListener('click', ()=> selectSurah(s.number));
    const name = document.createElement('div');
    name.className = 'surah-name';
    const latin = document.createElement('div'); latin.className='latin'; latin.textContent = `${s.number}. ${s.name_latin}`;
    const arab = document.createElement('div'); arab.className='arab'; arab.textContent = s.name;
    name.appendChild(latin); name.appendChild(arab);
    const sub = document.createElement('div'); sub.className='surah-sub'; sub.textContent = `${s.number_of_ayah} ayat`;
    card.appendChild(name); card.appendChild(sub);
    grid.appendChild(card);
  });

  const input = document.querySelector('#searchInput');
  input.addEventListener('input', ()=>{
    const q = input.value.trim().toLowerCase();
    const cards = Array.from(grid.children);
    cards.forEach((c,i)=>{
      const s = state.surahs[i];
      const hit = s.name_latin.toLowerCase().includes(q) || s.name.includes(q) || String(s.number).includes(q);
      c.style.display = hit? 'block':'none';
    });
  });
}

function renderContinue(bm){
  const card = document.querySelector('#continueCard');
  const text = document.querySelector('#continueText');
  const btn = document.querySelector('#continueBtn');
  if (bm && bm.surah){
    const s = state.surahs.find(x=>x.number===bm.surah);
    if (s){
      card.hidden = false;
      text.textContent = `Lanjutkan: ${s.number}. ${s.name_latin} — Ayat ${bm.ayah||1}`;
      btn.onclick = ()=> { selectSurah(s.number, bm.ayah||1); };
      return;
    }
  }
  card.hidden = true;
}

function showHome(){
  document.querySelector('#home').style.display = 'block';
  document.querySelector('#meta').style.display = 'none';
  document.querySelector('#bismillah').style.display = 'none';
  document.querySelector('#ayatList').style.display = 'none';
}

async function selectSurah(num, scrollAyah){
  surahSelect.value = String(num);
  await onChangeSurah();
  // show reader
  document.querySelector('#home').style.display = 'none';
  document.querySelector('#meta').style.display = '';
  document.querySelector('#bismillah').style.display = '';
  document.querySelector('#ayatList').style.display = '';
  if (scrollAyah){
    const target = document.getElementById(`ayah-${scrollAyah}`);
    if (target) target.scrollIntoView({behavior:'smooth',block:'center'});
  }
}

surahSelect.addEventListener('change', onChangeSurah);
homeBtn.addEventListener('click', showHome);
bookmarkBtn.addEventListener('click', onBookmarkClick);
themeBtn.addEventListener('click', onThemeToggle);
aboutBtn.addEventListener('click', showAbout);

async function onChangeSurah() {
  const n = parseInt(surahSelect.value, 10);
  try {
    const data = await fetchJSON(`${DATA_DIR}/${n}.json`);
    const rootKey = Object.keys(data)[0];
    const s = data[rootKey];
    state.currentSurah = s;
    state.currentData = data;
    renderSurah(s);
  } catch (e) {
    console.error(e);
  }
}

function onBookmarkClick() {
  if (!state.currentSurah) return;
  // Save current top-most ayah in viewport if any, else first ayah
  const ayah = firstVisibleAyah() || 1;
  setBookmark({ surah: parseInt(state.currentSurah.number, 10), ayah });
  bookmarkBtn.classList.add('saved');
  setTimeout(()=>bookmarkBtn.classList.remove('saved'), 600);
}

function renderSurah(s) {
  metaBox.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'badge';
  title.textContent = `${s.number}. ${s.name_latin}`;
  const ar = document.createElement('div');
  ar.className = 'badge';
  ar.textContent = s.name;
  metaBox.appendChild(title);
  metaBox.appendChild(ar);

  // Bismillah: show for all except Surah 1 (Al-Fatihah)
  bismillah.hidden = String(s.number) === '1';

  // Build ayah list
  ayatList.innerHTML = '';
  const textMap = s.text || {};
  const idMap = (s.translations?.id?.text) || {};
  const gorMap = (s.translations?.gor?.text) || {};
  const tafsirMap = (s.tafsir?.id?.kemenag?.text) || {};
  const footnotesMap = s.footnotes || {};
  const juzMap = s.juz || {};

  const ayKeys = Object.keys(textMap).sort((a,b)=>parseInt(a,10)-parseInt(b,10));
  let prevJuz = null;
  ayKeys.forEach((k) => {
    const juz = juzMap[k];
    if (juz && juz !== prevJuz) {
      const sep = document.createElement('div');
      sep.className = 'juz-sep';
      sep.textContent = `Juz ${juz}`;
      ayatList.appendChild(sep);
      prevJuz = juz;
    }

    const wrap = document.createElement('div');
    wrap.className = 'ayat';
    wrap.id = `ayah-${k}`;
    wrap.dataset.ayah = k;

    const head = document.createElement('div');
    head.className = 'ayat-header';

    const left = document.createElement('div');
    left.className = 'badge';
    left.textContent = `Ayat ${k}`;

    const right = document.createElement('div');
    right.className = 'tools';

    // Bookmark per ayat
    const btnB = document.createElement('button');
    btnB.className = 'icon-btn';
    btnB.textContent = '★ Simpan';
    btnB.title = 'Simpan penanda di ayat ini';
    btnB.addEventListener('click', ()=> saveBookmarkAyah(parseInt(k,10)));
    right.appendChild(btnB);

    if (tafsirMap[k]) {
      const btnT = document.createElement('button');
      btnT.className = 'icon-btn';
      btnT.textContent = '📖 Tafsir';
      btnT.addEventListener('click', ()=> openModal(`Tafsir Ayat ${k}`, tafsirMap[k]));
      right.appendChild(btnT);
    }

    if (footnotesMap[k]) {
      const btnF = document.createElement('button');
      btnF.className = 'icon-btn';
      btnF.textContent = '📝 Catatan';
      btnF.addEventListener('click', ()=> openModal(`Catatan Ayat ${k}`, footnotesMap[k]));
      right.appendChild(btnF);
    }

    head.appendChild(left);
    head.appendChild(right);

    const arab = document.createElement('div');
    arab.className = 'arabic';
    arab.textContent = textMap[k] || '';

    const trans = document.createElement('div');
    trans.className = 'trans';
    const id = document.createElement('div');
    id.className = 'id';
    id.textContent = idMap[k] || '';
    const gor = document.createElement('div');
    gor.className = 'gor';
    gor.textContent = gorMap[k] || '';

    trans.appendChild(id);
    trans.appendChild(gor);

    wrap.appendChild(head);
    wrap.appendChild(arab);
    wrap.appendChild(trans);

    ayatList.appendChild(wrap);
  });

  // After render, auto-save bookmark for first visible ayah
  scheduleAutoBookmark();
}

loadSurahList();

// Theme handling
function applyTheme(theme){
  if(theme==='dark'){
    document.documentElement.setAttribute('data-theme','dark');
  }else{
    document.documentElement.removeAttribute('data-theme');
  }
}
function currentTheme(){
  return localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light');
}
function onThemeToggle(){
  const next = currentTheme()==='dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY,next);
  applyTheme(next);
}
applyTheme(currentTheme());

// Auto-bookmark on scroll (last read)
let bookmarkTimer = null;
function firstVisibleAyah(){
  const ayahEls = Array.from(document.querySelectorAll('.ayat'));
  for (const a of ayahEls) {
    const rect = a.getBoundingClientRect();
    if (rect.top >= 0 && rect.bottom > 80) {
      return parseInt(a.dataset.ayah, 10);
    }
  }
  return null;
}
function scheduleAutoBookmark(){
  if (bookmarkTimer) clearTimeout(bookmarkTimer);
  bookmarkTimer = setTimeout(()=>{
    if (!state.currentSurah) return;
    const ayah = firstVisibleAyah();
    if (ayah){
      setBookmark({ surah: parseInt(state.currentSurah.number, 10), ayah });
    }
  }, 400);
}
window.addEventListener('scroll', scheduleAutoBookmark, { passive: true });

function saveBookmarkAyah(ayah){
  if (!state.currentSurah) return;
  setBookmark({ surah: parseInt(state.currentSurah.number, 10), ayah });
  // kecilkan notifikasi visual pada tombol yang diklik
  const btn = document.querySelector(`#ayah-${ayah} .tools .icon-btn`);
  if (btn){
    btn.classList.add('active');
    setTimeout(()=>btn.classList.remove('active'), 800);
  }
}

function showAbout(){
  const message = `Qur'an Online adalah proyek open-source yang masih aktif dikembangkan.

Kami membangun aplikasi ini untuk memudahkan pembacaan Al-Qur'an, memperkaya pengalaman dengan terjemahan Bahasa Indonesia dan Gorontalo, sekaligus melestarikan bahasa daerah melalui teknologi. Masukan Anda sangat berarti untuk menjadikannya lebih bermanfaat bagi banyak orang. Mari berkontribusi, mengusulkan fitur, atau melaporkan kendala yang Anda temukan.

Tim pengembang:
- @func0, @zr0n, @iezmyS, @wahyup, @wahyudinh, @richieoct, @fadlip, @wahyut, @amangp, @eten, @adamakj, @rachmatj, @ando, @opanje, @midin
`;
  openModal('Tentang Aplikasi', message);
}
