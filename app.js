const DATA_DIR = 'json_enriched';

const el = (q) => document.querySelector(q);
const surahSelect = el('#surahSelect');
const homeBtn = el('#homeBtn');
const juzBtn = el('#juzBtn');
const ayatList = el('#ayatList');
const metaBox = el('#meta');
const bismillah = el('#bismillah');
const themeBtn = el('#themeBtn');
const aboutBtn = el('#aboutBtn');
const settingsBtn = el('#settingsBtn');
const bookmarkBtn = el('#bookmarkBtn');

// Modals
const modal = el('#modal');
const modalTitle = el('#modalTitle');
const modalBody = el('#modalBody');
const modalClose = el('#modalClose');
const modalBackdrop = el('#modalBackdrop');
const modalFooterClose = el('#modalFooterClose');

const settingsModal = el('#settingsModal');
const settingsModalClose = el('#settingsModalClose');
const settingsModalBackdrop = el('#settingsModalBackdrop');
const fontSizeSlider = el('#fontSizeSlider');

const bookmarkModal = el('#bookmarkModal');
const bookmarkModalClose = el('#bookmarkModalClose');
const bookmarkModalBackdrop = el('#bookmarkModalBackdrop');
const bookmarkCategory = el('#bookmarkCategory');
const customCategoryGroup = el('#customCategoryGroup');
const customCategoryName = el('#customCategoryName');
const bookmarkNote = el('#bookmarkNote');
const saveBookmarkBtn = el('#saveBookmarkBtn');
const cancelBookmarkBtn = el('#cancelBookmarkBtn');

const bookmarkManagerModal = el('#bookmarkManagerModal');
const bookmarkManagerModalClose = el('#bookmarkManagerModalClose');
const bookmarkManagerModalBackdrop = el('#bookmarkManagerModalBackdrop');
const bookmarkTabs = document.querySelector('.bookmark-tabs');
const bookmarkList = el('#bookmarkList');

const shareModal = el('#shareModal');
const shareModalClose = el('#shareModalClose');
const shareModalBackdrop = el('#shareModalBackdrop');
const shareSurahName = el('#shareSurahName');
const shareAyahNumber = el('#shareAyahNumber');
const shareArabicText = el('#shareArabicText');
const shareTranslationText = el('#shareTranslationText');
const shareFormat = el('#shareFormat');
const copyShareBtn = el('#copyShareBtn');
const whatsappShareBtn = el('#whatsappShareBtn');
const telegramShareBtn = el('#telegramShareBtn');
const twitterShareBtn = el('#twitterShareBtn');
const audioPlayer = el('#audioPlayer');

let pendingBookmark = null;
let pendingShare = null;
let currentlyPlayingButton = null;

const state = {
  surahs: [],
  currentSurah: null,
  currentData: null,
};

const BOOKMARKS_KEY = 'quran.bookmarks.v2';
const LEGACY_BOOKMARK_KEY = 'quran.bookmark.v1';
const THEME_KEY = 'quran.theme.v1';
const FONT_SIZE_KEY = 'quran.fontsize.v1';

const JUZ_DATA = [
  { juz: 1, surah: 1, ayah: 1 },
  { juz: 2, surah: 2, ayah: 142 },
  { juz: 3, surah: 2, ayah: 253 },
  { juz: 4, surah: 3, ayah: 93 },
  { juz: 5, surah: 4, ayah: 24 },
  { juz: 6, surah: 4, ayah: 148 },
  { juz: 7, surah: 5, ayah: 82 },
  { juz: 8, surah: 6, ayah: 111 },
  { juz: 9, surah: 7, ayah: 88 },
  { juz: 10, surah: 8, ayah: 41 },
  { juz: 11, surah: 9, ayah: 93 },
  { juz: 12, surah: 11, ayah: 6 },
  { juz: 13, surah: 12, ayah: 53 },
  { juz: 14, surah: 15, ayah: 1 },
  { juz: 15, surah: 17, ayah: 1 },
  { juz: 16, surah: 18, ayah: 75 },
  { juz: 17, surah: 21, ayah: 1 },
  { juz: 18, surah: 23, ayah: 1 },
  { juz: 19, surah: 25, ayah: 21 },
  { juz: 20, surah: 27, ayah: 56 },
  { juz: 21, surah: 29, ayah: 46 },
  { juz: 22, surah: 33, ayah: 31 },
  { juz: 23, surah: 36, ayah: 28 },
  { juz: 24, surah: 39, ayah: 32 },
  { juz: 25, surah: 41, ayah: 47 },
  { juz: 26, surah: 46, ayah: 1 },
  { juz: 27, surah: 51, ayah: 31 },
  { juz: 28, surah: 58, ayah: 1 },
  { juz: 29, surah: 67, ayah: 1 },
  { juz: 30, surah: 78, ayah: 1 },
];

// --- Bookmark Functions ---
function getBookmarks() {
  try {
    const legacyBookmark = JSON.parse(localStorage.getItem(LEGACY_BOOKMARK_KEY) || 'null');
    if (legacyBookmark) {
      const newBookmarks = [{ ...legacyBookmark, date: new Date().toISOString(), category: 'favorite', note: 'Bookmark lama' }];
      setBookmarks(newBookmarks);
      localStorage.removeItem(LEGACY_BOOKMARK_KEY);
      return newBookmarks;
    }
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
  } catch {
    return [];
  }
}

function setBookmarks(bookmarks) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

function openBookmarkModal(surah, ayah) {
  pendingBookmark = { surah, ayah };
  bookmarkNote.value = '';
  customCategoryName.value = '';
  bookmarkCategory.value = 'favorite';
  customCategoryGroup.style.display = 'none';
  bookmarkModal.classList.remove('hidden');
}

function closeBookmarkModal() {
  bookmarkModal.classList.add('hidden');
  pendingBookmark = null;
}

function saveBookmark() {
  if (!pendingBookmark) return;

  let category = bookmarkCategory.value;
  if (category === 'custom') {
    category = customCategoryName.value.trim() || 'Kustom';
  }

  const note = bookmarkNote.value.trim();
  const newBookmark = {
    ...pendingBookmark,
    category,
    note,
    date: new Date().toISOString()
  };

  const bookmarks = getBookmarks();
  const existingIndex = bookmarks.findIndex(bm => bm.surah === newBookmark.surah && bm.ayah === newBookmark.ayah);
  if (existingIndex > -1) {
    bookmarks[existingIndex] = newBookmark;
  } else {
    bookmarks.unshift(newBookmark);
  }

  setBookmarks(bookmarks);
  closeBookmarkModal();
  showNotification('Bookmark disimpan!');
  renderContinue();
}

function deleteBookmark(surah, ayah) {
  let bookmarks = getBookmarks();
  bookmarks = bookmarks.filter(bm => !(bm.surah === surah && bm.ayah === ayah));
  setBookmarks(bookmarks);
}

function openBookmarkManager() {
  renderBookmarks();
  bookmarkManagerModal.classList.remove('hidden');
}

function closeBookmarkManager() {
  bookmarkManagerModal.classList.add('hidden');
}

function renderBookmarks(filterCategory = 'all') {
  const bookmarks = getBookmarks();
  bookmarkList.innerHTML = '';

  const filteredBookmarks = filterCategory === 'all'
    ? bookmarks
    : bookmarks.filter(bm => bm.category === filterCategory);

  if (filteredBookmarks.length === 0) {
    bookmarkList.innerHTML = '<p style="text-align:center; padding: 1rem;">Tidak ada bookmark di kategori ini.</p>';
    return;
  }

  filteredBookmarks.forEach(bm => {
    const surah = state.surahs.find(s => s.number === bm.surah);
    if (!surah) return;

    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.innerHTML = `
      <div class="bookmark-info">
        <div class="bookmark-title">${surah.name_latin} : ${bm.ayah}</div>
        <div class="bookmark-meta">
          <span class="chip">${bm.category}</span>
          <span>${new Date(bm.date).toLocaleDateString('id-ID')}</span>
        </div>
        ${bm.note ? `<p class="bookmark-note">${bm.note}</p>` : ''}
      </div>
      <div class="bookmark-actions">
        <button class="icon-btn go-to" title="Lompat ke ayat">Lanjutkan</button>
        <button class="icon-btn delete" title="Hapus bookmark">Hapus</button>
      </div>
    `;

    item.querySelector('.go-to').addEventListener('click', () => {
      closeBookmarkManager();
      selectSurah(bm.surah, bm.ayah);
    });

    item.querySelector('.delete').addEventListener('click', () => {
      deleteBookmark(bm.surah, bm.ayah);
      renderBookmarks(filterCategory);
      renderContinue();
    });

    bookmarkList.appendChild(item);
  });
}

// --- Share Functions ---
function openShareModal(surah, ayah) {
    const s = state.currentSurah;
    const arabicText = s.text[ayah];
    const translationText = s.translations.gor.text[ayah];

    pendingShare = { surah: s.name_latin, ayah, arabicText, translationText };

    shareSurahName.textContent = s.name_latin;
    shareAyahNumber.textContent = `Ayat ${ayah}`;
    shareArabicText.textContent = arabicText;
    shareTranslationText.textContent = translationText;
    
    shareModal.classList.remove('hidden');
}

function closeShareModal() {
    shareModal.classList.add('hidden');
    pendingShare = null;
}

function getShareText() {
    if (!pendingShare) return '';
    const { surah, ayah, arabicText, translationText } = pendingShare;
    const format = shareFormat.value;
    const surahInfo = `(Q.S. ${surah}: ${ayah})`;

    switch (format) {
        case 'arabic':
            return `${arabicText} ${surahInfo}`;
        case 'translation':
            return `${translationText} ${surahInfo}`;
        case 'minimal':
            return surahInfo;
        case 'full':
        default:
            return `${arabicText}\n\n${translationText}\n\n${surahInfo}`;
    }
}

copyShareBtn.addEventListener('click', () => {
    const text = getShareText();
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Teks berhasil disalin!');
    }, () => {
        showNotification('Gagal menyalin teks.', 'error');
    });
});

whatsappShareBtn.addEventListener('click', () => {
    const text = getShareText();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
});

telegramShareBtn.addEventListener('click', () => {
    const text = getShareText();
    window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`, '_blank');
});

twitterShareBtn.addEventListener('click', () => {
    const text = getShareText();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
});

// --- Audio Functions ---
function playAudio(surahNumber, verseNumber, buttonEl) {
  const surahPad = String(surahNumber).padStart(3, '0');
  const versePad = String(verseNumber).padStart(3, '0');
  const audioUrl = `https://media.qurankemenag.net/audio/Abu_Bakr_Ash-Shaatree_aac64/${surahPad}${versePad}.m4a`;

  if (currentlyPlayingButton && currentlyPlayingButton !== buttonEl) {
    currentlyPlayingButton.classList.remove('playing');
    currentlyPlayingButton.textContent = '▶️';
  }

  if (audioPlayer.src === audioUrl && !audioPlayer.paused) {
    audioPlayer.pause();
    buttonEl.classList.remove('playing');
    buttonEl.textContent = '▶️';
    currentlyPlayingButton = null;
  } else {
    audioPlayer.src = audioUrl;
    audioPlayer.play();
    buttonEl.classList.add('playing');
    buttonEl.textContent = '⏸️';
    currentlyPlayingButton = buttonEl;
  }
}

audioPlayer.addEventListener('ended', () => {
    if(currentlyPlayingButton) {
        currentlyPlayingButton.classList.remove('playing');
        currentlyPlayingButton.textContent = '▶️';
        currentlyPlayingButton = null;
    }
});


// --- General Functions ---
function openModal(title, html) {
  modalTitle.textContent = title;
  modalBody.innerHTML = '';
  const pre = document.createElement('pre');
  pre.innerText = html;
  modalBody.appendChild(pre);
  modal.classList.remove('hidden');
}
function closeModal() { modal.classList.add('hidden'); }

function openSettings() { settingsModal.classList.remove('hidden'); }
function closeSettings() { settingsModal.classList.add('hidden'); }

function applyFontSize(size) {
  document.documentElement.style.setProperty('--arabic-font-size', `${size}rem`);
}

function loadAndApplySettings() {
  const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || '1.7';
  fontSizeSlider.value = savedFontSize;
  applyFontSize(savedFontSize);
  applyTheme(currentTheme());
}

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadSurahList() {
  const promises = [];
  for (let i = 1; i <= 114; i++) {
    promises.push(fetchJSON(`${DATA_DIR}/${i}.json`));
  }

  try {
    const allSurahData = await Promise.all(promises);
    const entries = allSurahData.map(data => {
      const rootKey = Object.keys(data)[0];
      const s = data[rootKey];
      return {
        number: parseInt(s.number, 10),
        name: s.name,
        name_latin: s.name_latin,
        number_of_ayah: parseInt(s.number_of_ayah, 10),
      };
    });

    state.surahs = entries.sort((a,b)=>a.number-b.number);
    renderSurahSelect();
    renderTOC();
    renderJuzGrid();
    renderContinue();
    showHome();
  } catch (e) {
    console.error("Gagal memuat daftar surah:", e);
    // Handle error, maybe show a message to the user
  }
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
  const skeleton = grid.querySelector('.loading-skeleton');
  if (skeleton) skeleton.style.display = 'none';
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

function renderJuzGrid(){
  const grid = document.querySelector('#juzGrid');
  const skeleton = grid.querySelector('.loading-skeleton');
  if (skeleton) skeleton.style.display = 'none';
  grid.innerHTML = '';
  JUZ_DATA.forEach(j=>{
    const card = document.createElement('div');
    card.className = 'juz-card';
    card.addEventListener('click', ()=> loadJuz(j.juz));
    const name = document.createElement('div');
    name.className = 'juz-name';
    name.textContent = `Juz ${j.juz}`;
    card.appendChild(name);
    grid.appendChild(card);
  });
}

function loadJuz(juz) {
  const juzInfo = JUZ_DATA.find(j => j.juz === juz);
  if (juzInfo) {
    selectSurah(juzInfo.surah, juzInfo.ayah);
  }
}

function renderContinue(){
  const bookmarks = getBookmarks();
  const lastBookmark = bookmarks.length > 0 ? bookmarks[0] : null;
  const card = document.querySelector('#continueCard');
  const text = document.querySelector('#continueText');
  const btn = document.querySelector('#continueBtn');

  if (lastBookmark) {
    const s = state.surahs.find(x => x.number === lastBookmark.surah);
    if (s) {
      card.hidden = false;
      text.textContent = `Lanjutkan: ${s.name_latin} — Ayat ${lastBookmark.ayah}`;
      btn.onclick = () => { selectSurah(lastBookmark.surah, lastBookmark.ayah); };
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
  document.querySelector('#home').style.display = 'none';
  document.querySelector('#meta').style.display = '';
  document.querySelector('#bismillah').style.display = '';
  document.querySelector('#ayatList').style.display = '';
  if (scrollAyah){
    const target = document.getElementById(`ayah-${scrollAyah}`);
    if (target) {
        setTimeout(() => target.scrollIntoView({behavior:'smooth',block:'center'}), 300);
        target.classList.add('highlight');
        setTimeout(() => target.classList.remove('highlight'), 2000);
    }
  }
}

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

  bismillah.hidden = String(s.number) === '1' || String(s.number) === '9';

  ayatList.innerHTML = '';
  const textMap = s.text || {};
  const idMap = (s.translations?.id?.text) || {};
  const gorMap = (s.translations?.gor?.text) || {};
  const tafsirMap = (s.tafsir?.id?.kemenag?.text) || {};
  const footnotesMap = s.footnotes || {};

  const ayKeys = Object.keys(textMap).sort((a,b)=>parseInt(a,10)-parseInt(b,10));
  let prevJuz = null;
  ayKeys.forEach((k) => {
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

    const btnB = document.createElement('button');
    btnB.className = 'icon-btn';
    btnB.textContent = '★';
    btnB.title = 'Simpan penanda di ayat ini';
    btnB.addEventListener('click', ()=> saveBookmarkAyah(parseInt(k,10)));
    right.appendChild(btnB);

    const btnShare = document.createElement('button');
    btnShare.className = 'icon-btn';
    btnShare.textContent = 'Bagikan';
    btnShare.title = 'Bagikan ayat ini';
    btnShare.addEventListener('click', ()=> openShareModal(s.number, parseInt(k,10)));
    right.appendChild(btnShare);

    if (tafsirMap[k]) {
      const btnT = document.createElement('button');
      btnT.className = 'icon-btn';
      btnT.textContent = 'Tafsir';
      btnT.addEventListener('click', ()=> openModal(`Tafsir Ayat ${k}`, tafsirMap[k]));
      right.appendChild(btnT);
    }

    if (footnotesMap[k]) {
      const btnF = document.createElement('button');
      btnF.className = 'icon-btn';
      btnF.textContent = 'Catatan';
      btnF.addEventListener('click', ()=> openModal(`Catatan Kaki Ayat ${k}`, footnotesMap[k]));
      right.appendChild(btnF);
    }

    const btnPlay = document.createElement('button');
    btnPlay.className = 'icon-btn';
    btnPlay.textContent = '▶️';
    btnPlay.title = 'Putar Audio';
    btnPlay.addEventListener('click', (e) => playAudio(s.number, parseInt(k, 10), e.currentTarget));
    right.appendChild(btnPlay);

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
}

function saveBookmarkAyah(ayah) {
  if (!state.currentSurah) return;
  const surah = parseInt(state.currentSurah.number, 10);
  openBookmarkModal(surah, ayah);
}

function showAbout(){
  const message = `بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ

Qur'an Online adalah proyek open-source yang masih aktif dikembangkan.

Kami membangun aplikasi ini untuk memudahkan pembacaan Al-Qur'an, memperkaya pengalaman dengan terjemahan Bahasa Indonesia dan Gorontalo, sekaligus melestarikan bahasa daerah melalui teknologi. Masukan Anda sangat berarti untuk menjadikannya lebih bermanfaat bagi banyak orang. Mari berkontribusi, mengusulkan fitur, atau melaporkan kendala yang Anda temukan.

Tim pengembang:
- @func0, @zr0n, @iezmyS, @wahyup, @wahyudinh, @richieoct, @fadlip, @wahyut, @amangp, @eten, @adamakj, @rachmatj, @ando, @opanje, @midin, @fadhilh
`;
  openModal('Tentang Aplikasi', message);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// --- Event Listeners ---

juzBtn.addEventListener('click', () => {
  const surahGrid = document.querySelector('#surahGrid');
  const juzGrid = document.querySelector('#juzGrid');
  const surahHeader = document.querySelector('.toc h2');

  if (surahGrid.style.display !== 'none') {
    surahGrid.style.display = 'none';
    juzGrid.style.display = 'grid';
    surahHeader.textContent = 'Daftar Juz';
    juzBtn.textContent = 'Pilih Surah';
  } else {
    surahGrid.style.display = 'grid';
    juzGrid.style.display = 'none';
    surahHeader.textContent = 'Daftar Surah';
    juzBtn.textContent = 'Pilih Juz';
  }
});

// Modal listeners
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
modalFooterClose.addEventListener('click', closeModal);
settingsModalClose.addEventListener('click', closeSettings);
settingsModalBackdrop.addEventListener('click', closeSettings);
shareModalClose.addEventListener('click', closeShareModal);
shareModalBackdrop.addEventListener('click', closeShareModal);

// Settings
fontSizeSlider.addEventListener('input', (e) => {
  const fontSize = e.target.value;
  applyFontSize(fontSize);
  localStorage.setItem(FONT_SIZE_KEY, fontSize);
});

// Bookmark modal
saveBookmarkBtn.addEventListener('click', saveBookmark);
cancelBookmarkBtn.addEventListener('click', closeBookmarkModal);
bookmarkModalClose.addEventListener('click', closeBookmarkModal);
bookmarkModalBackdrop.addEventListener('click', closeBookmarkModal);
bookmarkCategory.addEventListener('change', () => {
  customCategoryGroup.style.display = bookmarkCategory.value === 'custom' ? 'block' : 'none';
});

// Bookmark manager
bookmarkBtn.addEventListener('click', openBookmarkManager);
bookmarkManagerModalClose.addEventListener('click', closeBookmarkManager);
bookmarkManagerModalBackdrop.addEventListener('click', closeBookmarkManager);
bookmarkTabs.addEventListener('click', (e) => {
  if (e.target.classList.contains('tab-btn')) {
    const category = e.target.dataset.category;
    if(bookmarkTabs.querySelector('.active')){
        bookmarkTabs.querySelector('.active').classList.remove('active');
    }
    e.target.classList.add('active');
    renderBookmarks(category);
  }
});

// Main navigation
surahSelect.addEventListener('change', onChangeSurah);
homeBtn.addEventListener('click', showHome);
aboutBtn.addEventListener('click', showAbout);
settingsBtn.addEventListener('click', openSettings);
themeBtn.addEventListener('click', onThemeToggle);

// --- Theme Handling ---
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

// --- Init ---
loadSurahList();
loadAndApplySettings();
