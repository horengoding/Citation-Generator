import os
import re
import sqlite3
from io import BytesIO

import requests
from flask import Flask, jsonify, render_template, request
from pypdf import PdfReader

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), "citations.db")

DOI_REGEX = re.compile(r"10\.\d{4,9}/[-._;()/:A-Za-z0-9]+")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS citations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            author TEXT NOT NULL,
            year TEXT NOT NULL,
            title TEXT NOT NULL,
            publisher TEXT,
            journal_name TEXT,
            volume TEXT,
            pages TEXT,
            doi TEXT
        )
        """
    )
    # Migrate older databases created before the doi column existed.
    existing_cols = [row["name"] for row in conn.execute("PRAGMA table_info(citations)")]
    if "doi" not in existing_cols:
        conn.execute("ALTER TABLE citations ADD COLUMN doi TEXT")
    conn.commit()
    conn.close()


def row_to_dict(row):
    return {
        "id": row["id"],
        "type": row["type"],
        "author": row["author"],
        "year": row["year"],
        "title": row["title"],
        "publisher": row["publisher"],
        "journalName": row["journal_name"],
        "volume": row["volume"],
        "pages": row["pages"],
        "doi": row["doi"],
    }


def clean_doi(raw):
    raw = raw.strip()
    raw = re.sub(r"^https?://(dx\.)?doi\.org/", "", raw, flags=re.IGNORECASE)
    raw = re.sub(r"^doi:\s*", "", raw, flags=re.IGNORECASE)
    return raw.rstrip(".,")


def format_authors_apa(authors):
    if not authors:
        return ""

    def one(author):
        family = author.get("family") or author.get("name") or ""
        given = (author.get("given") or "").strip()
        initial = f"{given[0].upper()}." if given else ""
        return f"{family}, {initial}" if initial else family

    if len(authors) == 1:
        return one(authors[0])
    if len(authors) == 2:
        return f"{one(authors[0])} & {one(authors[1])}"
    return f"{one(authors[0])} et al."


def lookup_doi(raw_doi):
    """Clean + query CrossRef for a DOI. Returns (data, error_message)."""
    doi = clean_doi(raw_doi or "")
    if not doi:
        return None, "Masukkan nomor DOI terlebih dahulu."

    try:
        res = requests.get(f"https://api.crossref.org/works/{doi}", timeout=10)
        res.raise_for_status()
    except requests.RequestException:
        return None, "DOI tidak ditemukan. Periksa kembali nomornya atau isi secara manual."

    msg = res.json().get("message", {})
    is_journal = "journal" in (msg.get("type") or "")

    year_parts = (
        (msg.get("published") or {}).get("date-parts", [[]])[0]
        or (msg.get("published-print") or {}).get("date-parts", [[]])[0]
        or (msg.get("published-online") or {}).get("date-parts", [[]])[0]
        or []
    )

    volume = msg.get("volume") or ""
    issue = msg.get("issue")
    if issue:
        volume = f"{volume}({issue})"

    data = {
        "type": "jurnal" if is_journal else "buku",
        "author": format_authors_apa(msg.get("author")),
        "year": str(year_parts[0]) if year_parts else "",
        "title": (msg.get("title") or [""])[0],
        "publisher": msg.get("publisher") or "",
        "journalName": (msg.get("container-title") or [""])[0],
        "volume": volume,
        "pages": msg.get("page") or "",
        "doi": doi,
    }
    return data, None


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/citations", methods=["GET"])
def list_citations():
    conn = get_db()
    rows = conn.execute("SELECT * FROM citations ORDER BY id").fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows])


@app.route("/api/citations", methods=["POST"])
def add_citation():
    data = request.get_json(force=True) or {}
    required = ["type", "author", "year", "title"]
    if not all(data.get(f) for f in required):
        return jsonify({"error": "Data belum lengkap."}), 400

    conn = get_db()
    conn.execute(
        """
        INSERT INTO citations (type, author, year, title, publisher, journal_name, volume, pages, doi)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data["type"],
            data["author"],
            data["year"],
            data["title"],
            data.get("publisher", ""),
            data.get("journalName", ""),
            data.get("volume", ""),
            data.get("pages", ""),
            data.get("doi", ""),
        ),
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True}), 201


@app.route("/api/citations", methods=["DELETE"])
def clear_citations():
    conn = get_db()
    conn.execute("DELETE FROM citations")
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.route("/api/doi-lookup", methods=["POST"])
def doi_lookup():
    body = request.get_json(force=True) or {}
    data, error = lookup_doi(body.get("doi", ""))
    if error:
        return jsonify({"error": error}), 404
    return jsonify(data)


@app.route("/api/pdf-lookup", methods=["POST"])
def pdf_lookup():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "Tidak ada berkas yang dikirim."}), 400

    try:
        reader = PdfReader(BytesIO(file.read()))
    except Exception:
        return jsonify({"error": "Gagal membaca berkas ini sebagai PDF."}), 400

    text = ""
    for page in reader.pages[:3]:
        text += (page.extract_text() or "") + " "

    match = DOI_REGEX.search(text)
    if not match:
        return (
            jsonify(
                {
                    "error": (
                        "Tidak menemukan DOI di beberapa halaman pertama berkas ini. "
                        'Gunakan tab "Cari DOI" atau isi manual.'
                    )
                }
            ),
            404,
        )

    doi = match.group(0).rstrip(").,")
    data, error = lookup_doi(doi)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(data)


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
