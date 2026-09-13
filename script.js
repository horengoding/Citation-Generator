//update
const citationForm = document.getElementById('citationForm');
const citationList = document.getElementById('citationList');
const sourceType = document.getElementById('sourceType');
const journalFields = document.getElementById('journalFields');
const publisherField = document.getElementById('publisherField');
const titleLabel = document.getElementById('titleLabel');
const clearAllBtn = document.getElementById('clearAllBtn');
const citationCount = document.getElementById('citationCount');
const emptyState = document.getElementById('emptyState');

const tabs = document.querySelectorAll('.tab');
const panels = {
    manual: document.getElementById('panel-manual'),
    doi: document.getElementById('panel-doi'),
    upload: document.getElementById('panel-upload')
};

const doiInput = document.getElementById('doiInput');
const doiSearchBtn = document.getElementById('doiSearchBtn');
const doiStatus = document.getElementById('doiStatus');

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');

if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

document.addEventListener('DOMContentLoaded', displayCitations);

const themeToggle = document.getElementById('themeToggle');

function applyThemeIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggle.textContent = isDark ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    applyThemeIcon();
});

applyThemeIcon();

function switchTab(name) {
    tabs.forEach(t => {
        const active = t.dataset.tab === name;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
    });
    Object.entries(panels).forEach(([key, panel]) => {
        panel.hidden = key !== name;
    });
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

sourceType.addEventListener('change', function () {
    if (sourceType.value === 'jurnal') {
        journalFields.style.display = 'block';
        publisherField.style.display = 'none';
        titleLabel.innerText = 'Judul artikel jurnal';
        document.getElementById('publisher').required = false;
        document.getElementById('journalName').required = true;
    } else {
        journalFields.style.display = 'none';
        publisherField.style.display = 'block';
        titleLabel.innerText = 'Judul buku';
        document.getElementById('publisher').required = true;
        document.getElementById('journalName').required = false;
    }
});

citationForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const type = sourceType.value;
    const author = document.getElementById('author').value.trim();
    const year = document.getElementById('year').value.trim();
    const title = document.getElementById('title').value.trim();
    const doi = document.getElementById('doi').value.trim();

    let formattedAuthor = author;
    if (!author.includes(',')) {
        const nameParts = author.split(' ').filter(Boolean);
        if (nameParts.length > 1) {
            const lastName = nameParts[nameParts.length - 1];
            const firstNameInitial = nameParts[0].charAt(0);
            formattedAuthor = `${lastName}, ${firstNameInitial}.`;
        }
    }

    let newCitation = { type, author: formattedAuthor, year, title };
    if (doi) newCitation.doi = doi;

    if (type === 'buku') {
        newCitation.publisher = document.getElementById('publisher').value.trim();
    } else if (type === 'jurnal') {
        newCitation.journalName = document.getElementById('journalName').value.trim();
        newCitation.volume = document.getElementById('volume').value.trim();
        newCitation.pages = document.getElementById('pages').value.trim();
    }

    saveToLocalStorage(newCitation);
    displayCitations();
    citationForm.reset();

    journalFields.style.display = 'none';
    publisherField.style.display = 'block';
    titleLabel.innerText = 'Judul buku';
});

function saveToLocalStorage(citation) {
    let citations = localStorage.getItem('citations') ? JSON.parse(localStorage.getItem('citations')) : [];
    citations.push(citation);
    localStorage.setItem('citations', JSON.stringify(citations));
}

function doiUrl(item) {
    if (!item.doi) return '';
    return item.doi.startsWith('http') ? item.doi : `https://doi.org/${item.doi}`;
}

function citationHTML(item) {
    let html;
    if (item.type === 'buku') {
        html = `${item.author} (${item.year}). <em>${item.title}</em>`;
        html += item.publisher ? `. ${item.publisher}.` : '.';
    } else {
        html = `${item.author} (${item.year}). ${item.title}. <em>${item.journalName}</em>`;
        const details = [item.volume, item.pages].filter(Boolean);
        if (details.length) html += `, ${details.join(', ')}`;
        html += '.';
    }
    const url = doiUrl(item);
    if (url) html += ` <a href="${url}" target="_blank" rel="noopener">${url}</a>`;
    return html;
}

function citationPlainText(item) {
    let text;
    if (item.type === 'buku') {
        text = `${item.author} (${item.year}). ${item.title}`;
        text += item.publisher ? `. ${item.publisher}.` : '.';
    } else {
        text = `${item.author} (${item.year}). ${item.title}. ${item.journalName}`;
        const details = [item.volume, item.pages].filter(Boolean);
        if (details.length) text += `, ${details.join(', ')}`;
        text += '.';
    }
    const url = doiUrl(item);
    if (url) text += ` ${url}`;
    return text;
}

function displayCitations() {
    citationList.innerHTML = '';
    let citations = localStorage.getItem('citations') ? JSON.parse(localStorage.getItem('citations')) : [];

    citationCount.innerText = `${citations.length} entri`;
    emptyState.style.display = citations.length === 0 ? 'block' : 'none';
    clearAllBtn.style.display = citations.length === 0 ? 'none' : 'block';

    citations.forEach(function (item, index) {
        const li = document.createElement('li');
        li.className = `citation-card ${item.type}`;

        const top = document.createElement('div');
        top.className = 'card-top';

        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = item.type === 'buku' ? 'Buku' : 'Jurnal';
        top.appendChild(tag);

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'btn-copy';
        copyBtn.textContent = 'Salin';
        copyBtn.addEventListener('click', () => {
            const markCopied = () => {
                copyBtn.textContent = 'Tersalin';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.textContent = 'Salin';
                    copyBtn.classList.remove('copied');
                }, 1500);
            };

            const plain = citationPlainText(item);
            const html = citationHTML(item);

            if (navigator.clipboard && window.ClipboardItem) {
                const clipboardItem = new ClipboardItem({
                    'text/plain': new Blob([plain], { type: 'text/plain' }),
                    'text/html': new Blob([html], { type: 'text/html' })
                });
                navigator.clipboard.write([clipboardItem]).then(markCopied) .catch(() => {
                    navigator.clipboard.writeText(plain).then(markCopied);
                });
            } else {
                navigator.clipboard.writeText(plain).then(markCopied);
            }
        });

        top.appendChild(copyBtn);

        const text = document.createElement('p');
        text.className = 'citation-text';
        text.innerHTML = citationHTML(item);

        li.appendChild(top);
        li.appendChild(text);
        citationList.appendChild(li);
    });
}

clearAllBtn.addEventListener('click', function () {
    if (confirm('Apakah Anda yakin ingin menghapus semua daftar pustaka? Data di browser akan hilang.')) {
        localStorage.removeItem('citations');
        displayCitations();
    }
});

function fillManualForm(data) {
    sourceType.value = data.type === 'jurnal' ? 'jurnal' : 'buku';
    sourceType.dispatchEvent(new Event('change'));

    document.getElementById('author').value = data.author || '';
    document.getElementById('year').value = data.year || '';
    document.getElementById('title').value = data.title || '';
    document.getElementById('doi').value = data.doi || '';

    if (data.type === 'jurnal') {
        document.getElementById('journalName').value = data.journalName || '';
        document.getElementById('volume').value = data.volume || '';
        document.getElementById('pages').value = data.pages || '';
    } else {
        document.getElementById('publisher').value = data.publisher || '';
    }

    switchTab('manual');
}

function cleanDoi(raw) {
    return raw
        .trim()
        .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
        .replace(/^doi:\s*/i, '')
        .replace(/[.,]+$/, '');
}

function formatAuthorsAPA(authors) {
    if (!authors || authors.length === 0) return '';
    const one = a => {
        const family = a.family || a.name || '';
        const given = (a.given || '').trim();
        const initial = given ? `${given.charAt(0).toUpperCase()}.` : '';
        return initial ? `${family}, ${initial}` : family;
    };
    if (authors.length === 1) return one(authors[0]);
    if (authors.length === 2) return `${one(authors[0])} & ${one(authors[1])}`;
    return `${one(authors[0])} et al.`;
}

async function lookupDOI(rawDoi) {
    const doi = cleanDoi(rawDoi);
    if (!doi) {
        doiStatus.textContent = 'Masukkan nomor DOI terlebih dahulu.';
        return;
    }

    doiStatus.textContent = 'Mencari metadata...';
    doiSearchBtn.disabled = true;

    try {
        const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
        if (!res.ok) {
            throw new Error('not found');
        }
        const json = await res.json();
        const msg = json.message;

        const isJournal = (msg.type || '').includes('journal');
        const yearParts =
            msg.published?.['date-parts']?.[0] ||
            msg['published-print']?.['date-parts']?.[0] ||
            msg['published-online']?.['date-parts']?.[0] ||
            [];

        const data = {
            type: isJournal ? 'jurnal' : 'buku',
            author: formatAuthorsAPA(msg.author),
            year: yearParts[0] || '',
            title: (msg.title && msg.title[0]) || '',
            publisher: msg.publisher || '',
            journalName: (msg['container-title'] && msg['container-title'][0]) || '',
            volume: msg.issue ? `${msg.volume || ''}(${msg.issue})` : (msg.volume || ''),
            pages: msg.page || '',
            doi: doi
        };

        fillManualForm(data);
        doiStatus.textContent = 'Metadata ditemukan — periksa isian di tab Manual, lalu klik "Tambahkan ke daftar".';
    } catch (err) {
        doiStatus.textContent = 'DOI tidak ditemukan. Periksa kembali nomornya atau isi secara manual.';
    } finally {
        doiSearchBtn.disabled = false;
    }
}

doiSearchBtn.addEventListener('click', () => lookupDOI(doiInput.value));
doiInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        lookupDOI(doiInput.value);
    }
});

const DOI_REGEX = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;

async function extractDoiFromPDF(file) {
    if (!window.pdfjsLib) {
        uploadStatus.textContent = 'Pembaca PDF gagal dimuat. Coba muat ulang halaman atau isi secara manual.';
        return;
    }

    uploadStatus.textContent = `Membaca ${file.name}...`;

    try {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const pagesToScan = Math.min(pdf.numPages, 3);
        let fullText = '';

        for (let i = 1; i <= pagesToScan; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(it => it.str).join(' ') + ' ';
        }

        const match = fullText.match(DOI_REGEX);
        if (!match) {
            uploadStatus.textContent =
                'Tidak menemukan DOI di beberapa halaman pertama berkas ini. Gunakan tab "Cari DOI" atau isi manual.';
            return;
        }

        const doi = match[0].replace(/[).,]+$/, '');
        uploadStatus.textContent = `DOI ditemukan: ${doi} — mencari metadata...`;
        doiInput.value = doi;
        await lookupDOI(doi);
        uploadStatus.textContent = `DOI ${doi} ditemukan di berkas. Periksa isian di tab Manual.`;
    } catch (err) {
        uploadStatus.textContent = 'Gagal membaca berkas ini sebagai PDF.';
    }
}

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) extractDoiFromPDF(fileInput.files[0]);
});

['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, e => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
});

['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
    });
});

dropzone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
        uploadStatus.textContent = 'Hanya berkas PDF yang didukung.';
        return;
    }
    extractDoiFromPDF(file);
});