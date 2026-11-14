#!/usr/bin/env python3
"""Reads the quiz Word documents and writes data/quizzes.json for the Strapi seeder.
Usage: python3 build-quizzes.py <folder with the .docx files> <output .json>"""
import json, re, sys, unicodedata, zipfile, xml.etree.ElementTree as ET
from pathlib import Path

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
DOSHA = {"A": "Vata", "B": "Pitta", "C": "Kapha"}
WARN = []


def warn(msg):
    WARN.append(msg)
    print("  ! " + msg)


def read(path):
    root = ET.fromstring(zipfile.ZipFile(path).read("word/document.xml"))
    out = []
    for p in root.iter(W + "p"):
        txt = ""
        for n in p.iter():
            if n.tag == W + "t":
                txt += n.text or ""
            elif n.tag in (W + "tab", W + "br"):
                txt += " "
        raw = txt.replace("\xa0", " ").replace("\u200b", "").replace("**", "")
        t = re.sub(r"[ \t]+", " ", raw).strip()
        if not t:
            continue
        out.append((t, p.find(f"{W}pPr/{W}numPr") is not None, raw[:1] == " "))
    return out


def find(folder, topic, results):
    for f in sorted(Path(folder).glob("*.docx")):
        n = f.name.lower()
        if f.name.startswith("~$") or topic not in n:
            continue
        if ("result" in n) == results:
            return f
    return None


Q_RE = re.compile(r"^(\d+)\.\s*(.+)$")
O_RE = re.compile(r"^([A-Ca-c])[\).]\s*(.+)$")


def questions(items):
    runs, cur, q = [], None, None
    for t, _, _ in items:
        m = Q_RE.match(t)
        if m:
            if int(m.group(1)) == 1 and cur is not None:
                runs.append(cur)
                cur = None
            if cur is None:
                cur = []
            q = {"prompt": re.sub(r"\s+:$", ":", m.group(2)).strip(), "answers": []}
            cur.append(q)
            continue
        m = O_RE.match(t)
        if m and q is not None:
            q["answers"].append(m.group(2).strip())
    if cur:
        runs.append(cur)
    if len(runs) != 2:
        sys.exit(f"Expected an English and a French question list, found {len(runs)}.")
    en, fr = runs
    if len(en) != len(fr):
        sys.exit(f"English has {len(en)} questions, French has {len(fr)}.")
    for i, (a, b) in enumerate(zip(en, fr), 1):
        if len(a["answers"]) != 3 or len(b["answers"]) != 3:
            sys.exit(f"Question {i} must have 3 answers in both languages.")
    return [{"en": a, "fr": b} for a, b in zip(en, fr)]


def tidy(s):
    """SHOUTING words become normal case; dosha names keep a capital."""
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"(\w)- ", r"\1-", s)

    def fix(m):
        low = m.group(0).lower()
        return low.capitalize() if re.match(r"(vata|pitta|kapha|tridosh)", low) else low

    s = re.sub(r"\b[A-ZÀ-ÝÇ]{2,}\b", fix, s)
    s = re.sub(r"\bfor for\b", "for", s)
    s = re.sub(r"^\d+\.\s*", "", s)
    s = re.sub(r"\s+:", ":", s)
    return s[:1].upper() + s[1:]


def letters_to_match(letters):
    ls = sorted(set(re.findall(r"[ABC]", letters.upper())))
    return "all" if len(ls) == 3 else "+".join(DOSHA[l] for l in ls)


def key_of(s):
    return "".join(sorted(set(re.findall(r"[ABC]", s.upper()))))


BULLET = "•-*–·"
LABEL = re.compile(r"^([^:]{1,45}?)\s*:\s*(.*)$")


def block(items, headline=None, intro=True):
    """One result in one language -> {headline, description, sections[]}."""
    items = list(items)
    if headline is None and items:
        first = items[0][0]
        if len(first) <= 90 and not first.endswith("."):
            headline, items = first, items[1:]
    desc, sections, cur = [], [], None

    def new(heading, lines=None, open_=True):
        nonlocal cur
        s = {"heading": heading, "lines": lines or []}
        sections.append(s)
        cur = s if open_ else None

    for t, is_list, indented in items:
        bullet = is_list or t[0] in BULLET
        clean = t.lstrip(BULLET + " ").strip()
        if unicodedata.category(t[0]).startswith("S") and not bullet:
            new(re.sub(r"\s*:\s*$", "", t[1:].strip()))
            continue
        if bullet:
            if cur is None:
                new("")
            cur["lines"].append(re.sub(r"\s*:\s*", ": ", clean, count=1) if LABEL.match(clean) else clean)
            continue
        if indented and cur is not None:
            cur["lines"].append(clean)
            continue
        m = LABEL.match(t)
        if m and len(m.group(1).split()) <= 7 and "," not in m.group(1):
            label, rest = m.group(1).strip(), m.group(2).strip()
            if not rest:
                new(label)
            elif cur is not None:
                cur["lines"].append(f"{label}: {rest}")
            else:
                new(label, [rest], open_=False)
            continue
        if len(t) <= 60 and not t.endswith(".") and (sections or desc or not intro):
            new(t)
        elif cur is not None and sections:
            cur["lines"].append(t)
        else:
            desc.append(t)
    secs = [{"heading": tidy(s["heading"]) if s["heading"] else "", "body": "\n".join(s["lines"])} for s in sections if s["lines"]]
    return {"headline": tidy(headline) if headline else None, "description": "\n\n".join(desc), "sections": secs}


def finish(slug, blocks, fixes=None, intro=True):
    out = []
    for key in sorted(blocks, key=lambda k: (len(k), k)):
        b = blocks[key]
        res = {"matches": letters_to_match(key)}
        for lang in ("en", "fr"):
            if not b.get(lang):
                sys.exit(f"{slug}: result {res['matches']} has no {lang.upper()} text.")
            r = block(b[lang], b.get("h_" + lang), intro)
            if r["headline"] is None:
                r["headline"] = (fixes or {}).get((key, lang))
                if r["headline"] is None:
                    sys.exit(f"{slug}: result {res['matches']} ({lang}) has no title.")
                warn(f"{slug} {res['matches']} ({lang}): the title was missing in the document, I added '{r['headline']}'")
            if lang == "fr":
                r["headline"] = re.sub(r"\bTridoshic\b", "Tridoshique", r["headline"])
            res[lang] = r
        out.append(res)
    if set(blocks) != {"A", "B", "C", "AB", "BC", "AC", "ABC"}:
        warn(f"{slug}: expected 7 results, found {sorted(blocks)}")
    return out


def results_mostly(items, french_title_marker=False):
    header = re.compile(r"^MOSTLY\s+([ABC](?:\s*\+?\s*[ABC])*)\s*$", re.I)
    if french_title_marker:  # gut: the French starts at its own title line
        sw = lambda t: False if re.match(r"^Flore intestinale", t, re.I) else None
    else:
        sw = lambda t: "" if re.match(r"^(FRAN[CÇ]AIS|Français)\s*$", t, re.I) else None
    blocks, cur, lang = {}, None, "en"
    for it in items:
        h = header.match(it[0])
        if h:
            cur = blocks.setdefault(key_of(h.group(1)), {"en": [], "fr": []})
            lang = "en"
            continue
        if cur is None:
            continue
        s = sw(it[0])
        if s is not None and lang == "en":
            lang = "fr"
            if s == "":
                continue
        cur[lang].append(it)
    return blocks


def results_hair(items):
    header = re.compile(r"^(?:Most\s+Answers|Answers\s+tie)\s*[«\"]\s*([ABC](?:\s*\+\s*[ABC])*)\s*[»\"]\s*$", re.I)
    blocks, cur, seen, key = {}, None, set(), None
    for it in items:
        h = header.match(it[0])
        if h:
            key = key_of(h.group(1))
            b = blocks.setdefault(key, {"en": [], "fr": []})
            cur = b["fr"] if key in seen else b["en"]
            seen.add(key)
            continue
        if cur is not None:
            if re.match(r"^Votre Type", it[0]) and cur is blocks[key]["en"]:
                cur = blocks[key]["fr"]  # the last result has no repeated header
            cur.append(it)
    return blocks


def results_hormonal(items):
    header = re.compile(r"^(?:TYPE\s+)?(VATA|PITTA|KAPHA|TRIDOSHIC)(?:\s*[–-]\s*(PITTA|KAPHA))?(?:\s+TYPE)?\s*([“«])\s*(.+?)\s*[”»]\s*$", re.I)
    short = {"VATA": "A", "PITTA": "B", "KAPHA": "C"}
    blocks, cur = {}, None
    for it in items:
        h = header.match(it[0])
        if h:
            names = [h.group(1).upper()] + ([h.group(2).upper()] if h.group(2) else [])
            key = "ABC" if names[0] == "TRIDOSHIC" else "".join(sorted(short[n] for n in names))
            lang = "en" if h.group(3) == "“" else "fr"
            b = blocks.setdefault(key, {"en": [], "fr": []})
            b["h_" + lang] = it[0]
            cur = b[lang]
            continue
        if cur is not None:
            cur.append(it)
    return blocks


def results_weight(items):
    start = next(i for i, it in enumerate(items) if it[0].upper().startswith("QUIZ RESULTS"))
    items = items[start + 1:]
    en_head = re.compile(r"^(?:(VATA|PITTA|KAPHA) WEIGHT PATTERN|(VATA-PITTA|VATA-KAPHA|PITTA-KAPHA|TRIDOSHIC))$")
    names = {"VATA": "A", "PITTA": "B", "KAPHA": "C"}
    blocks, cur, lang, expect_fr_head = {}, None, "en", False
    for it in items:
        t = it[0]
        if re.match(r"^French translation\s*:?\s*$", t, re.I):
            lang, expect_fr_head = "fr", True
            continue
        if lang == "en" or not expect_fr_head:
            h = en_head.match(t)
            if h:
                if h.group(1):
                    key = names[h.group(1)]
                elif h.group(2) == "TRIDOSHIC":
                    key = "ABC"
                else:
                    key = "".join(sorted(names[x] for x in h.group(2).split("-")))
                cur = blocks.setdefault(key, {"en": [], "fr": []})
                lang, expect_fr_head = "en", False
                cur["en"].append(it)
                continue
        if cur is not None:
            cur[lang].append(it)
            expect_fr_head = False
    for b in blocks.values():  # first two lines of each language = header + quoted title
        for lg in ("en", "fr"):
            lines = [x[0] for x in b[lg]]
            stripped = lines[1].strip('“” "')
            b["h_" + lg] = f"{tidy(lines[0])}: {stripped}"
            b[lg] = b[lg][2:]
    return blocks


META = {
    "skin": dict(slug="skin-type", icon="skin",
        en=dict(title="Ayurvedic Skin Type Quiz", description="Learn what your skin is really telling you and find the nourishment it genuinely needs.",
                instructions="Choose the option that describes your skin's usual state (not temporary conditions).",
                resultTitle="Your Skin Type", profileTitle="Your Skin Profile", balanceTitle="Your Dosha Balance"),
        fr=dict(title="Quiz ayurvédique : type de peau", description="Découvrez ce que votre peau vous dit vraiment et trouvez la nourriture dont elle a réellement besoin.",
                instructions="Choisissez l’option qui décrit l’état habituel de votre peau (et non des conditions temporaires).",
                resultTitle="Votre type de peau", profileTitle="Votre profil de peau", balanceTitle="Votre équilibre des doshas")),
    "gut": dict(slug="gut-flora", icon="leaf",
        en=dict(title="Gut Flora Quiz", description="Discover how your digestion, energy and gut balance reflect your Ayurvedic constitution.",
                instructions="Choose the option that describes your usual state (not temporary conditions).",
                resultTitle="Your Gut Type", profileTitle="Your Gut Profile", balanceTitle="Your Dosha Balance"),
        fr=dict(title="Quiz sur la flore intestinale", description="Découvrez comment votre digestion, votre énergie et l’équilibre de votre intestin reflètent votre constitution ayurvédique.",
                instructions="Choisissez l’option qui décrit votre état habituel (pas les conditions temporaires).",
                resultTitle="Votre type d’intestin", profileTitle="Votre profil intestinal", balanceTitle="Votre équilibre des doshas")),
    "hormonal": dict(slug="hormonal-health", icon="heart",
        en=dict(title="Hormonal Health Quiz", description="Understand the rhythms behind your energy, mood, and cycles — and bring them back into balance.",
                instructions="", resultTitle="Your Hormonal Type", profileTitle="Your Hormonal Profile", balanceTitle="Your Dosha Balance"),
        fr=dict(title="Quiz sur la santé hormonale", description="Comprenez les rythmes derrière votre énergie, votre humeur et vos cycles, et rétablissez leur équilibre.",
                instructions="", resultTitle="Votre profil hormonal", profileTitle="Votre profil hormonal", balanceTitle="Votre équilibre des doshas")),
    "weight": dict(slug="weight-management", icon="body",
        en=dict(title="Why Isn’t Your Body Managing Weight?", description="Discover the real Ayurvedic root cause behind your weight management challenges. Your body isn’t “wrong”, it’s communicating.",
                instructions="Each question has 3 choices. Pick the one that feels MOST true most of the time.",
                resultTitle="Your Weight Pattern", profileTitle="Your Pattern", balanceTitle="Your Dosha Balance"),
        fr=dict(title="Pourquoi votre corps ne gère-t-il pas son poids ?", description="Découvrez la vraie cause ayurvédique de vos difficultés à gérer votre poids. Votre corps n’est pas « défaillant », il communique.",
                instructions="Chaque question a 3 choix. Choisissez celui qui vous semble le PLUS vrai la plupart du temps.",
                resultTitle="Votre profil de poids", profileTitle="Votre profil", balanceTitle="Votre équilibre des doshas")),
}
FIXES = {
    ("skin", "C", "fr"): "Peau à dominance Kapha (Terre + Eau)",
    ("skin", "AC", "fr"): "Peau à dominance Vata-Kapha",
    ("skin", "BC", "fr"): "Peau à dominance Pitta-Kapha",
}


def main(folder, out_path):
    quizzes = []
    for topic in ("skin", "gut", "hormonal", "weight"):
        if topic == "weight":  # one file holds both the questions and the results
            qf = rf = find(folder, topic, True) or find(folder, topic, False)
        else:
            qf, rf = find(folder, topic, False), find(folder, topic, True)
        if not qf or not rf:
            sys.exit(f"Could not find the {topic} quiz files in {folder}")
        print(f"{topic}: questions from {qf.name}, results from {rf.name}")
        qitems = read(qf)
        if topic == "weight":
            cut = next(i for i, it in enumerate(qitems) if it[0].upper().startswith("QUIZ RESULTS"))
            qitems = qitems[:cut]
        ri = read(rf)
        blocks = {"skin": lambda: results_mostly(ri), "gut": lambda: results_mostly(ri, True),
                  "hormonal": lambda: results_hormonal(ri), "weight": lambda: results_weight(ri)}[topic]()
        fx = {(k, l): v for (t, k, l), v in FIXES.items() if t == topic}
        m = META[topic]
        quizzes.append({"slug": m["slug"], "icon": m["icon"], "en": m["en"], "fr": m["fr"],
                        "questions": questions(qitems), "results": finish(topic, blocks, fx, intro=topic != "hormonal")})
    hf = find(folder, "hair", True)
    if hf:
        print(f"hair: results from {hf.name}")
        quizzes.append({"slug": "hair-dosha", "existing": True, "questions": [], "results": finish("hair", results_hair(read(hf)))})
    if find(folder, "body", True):
        print("body: results found, but there are no questions yet, so I leave this quiz out")
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(out_path).write_text(json.dumps({"quizzes": quizzes}, ensure_ascii=False, indent=1))
    for q in quizzes:
        print(f"  {q['slug']}: {len(q['questions'])} questions, {len(q['results'])} results")
    print(f"written {out_path}" + (f" ({len(WARN)} notes above)" if WARN else ""))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Usage: python3 build-quizzes.py <folder with .docx files> <output.json>")
    main(sys.argv[1], sys.argv[2])
