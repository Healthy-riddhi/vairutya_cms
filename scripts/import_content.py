#!/usr/bin/env python3
"""
Import Vairutya's real content into Strapi.

  STRAPI_API_TOKEN=<full-access token> python3 scripts/import_content.py "<folder with the PDFs and images>"

Optional:  --remove-placeholder   deletes the old unwritten draft article

What it does
  - Articles 2, 3 and 4 are created; article 1 (hair) is updated from its PDF.
  - The recipe "The Rebel Avocado Toast" gets its real photo (taken from the PDF),
    a corrected description and the PDF as a downloadable file.
  - The Healthy Happy Hair workshop gets a text-free hero image (cropped from the banner).
Safe to run again: it updates what exists instead of duplicating it.
"""
import io
import json
import mimetypes
import os
import sys
from pathlib import Path

import requests
from PIL import Image

try:
    import pymupdf  # PyMuPDF >= 1.24
except ImportError:  # older installs
    import fitz as pymupdf

Image.MAX_IMAGE_PIXELS = None

BASE = os.environ.get("STRAPI_URL", "http://localhost:1337").rstrip("/")
TOKEN = os.environ.get("STRAPI_API_TOKEN")
LOCALE = "en"

# --------------------------------------------------------------------------
# Content
# --------------------------------------------------------------------------

SCRAPER_URL = "/shop/silver-tongue-scraper"

ARTICLES = [
    # ------------------------------------------------------------------ 1
    {
        "slug": "why-your-hair-problems-are-not-actually-all-about-your-hair",
        # Only used if the article somehow doesn't exist yet:
        "create_only": {
            "title": "Why Your Hair Problems Are Not Actually “All About Your Hair”",
            "category": "Hair Health · 5 min read",
            "excerpt": "Hair is a biological indicator, not an isolated feature. Ayurveda and modern science point to the same roots: nourishment, stress and rhythm.",
        },
        "sections": [
            {
                "body": """
There is a moment most of us have experienced… Watching a strand of fallen hair, wondering “What is going wrong?”

Is it the shampoo?… The oil?… The weather?… Stress?

So we try something new. A different product. A trending remedy. A quick fix.

And for a while, it feels like we’re doing something. But the truth is… most hair care today is built on reaction, not understanding.

In both Ayurveda and modern science, one idea quietly repeats itself: **hair reflects what is happening inside your body.** It is a biological indicator, not an isolated feature.

From a scientific perspective, hair is considered a non-essential tissue. This means that when the body is under stress or lacks nutrients, it prioritizes vital organs (like the brain and heart) over hair growth.

As a result, your hair often becomes one of the first visible indicators of internal imbalance.

In Ayurveda, this concept has existed for centuries. Hair (*Kesha*) is considered a byproduct (*Upadhatu*) of deeper tissues, particularly linked to nourishment pathways governed by digestion (*Agni*).

Different systems. Same wisdom. **Your hair is not the problem. It is the messenger.**

Let’s simplify what research and traditional wisdom both point toward.
"""
            },
            {
                "heading": "The 3 Scientific Roots Behind Most Hair Issues",
                "body": """
**1. Nourishment that doesn’t reach.** You may be eating well… but is your body absorbing?

In Ayurveda, this is linked to *Agni* (digestive fire). In modern terms, it’s your ability to assimilate nutrients.

When nutrients don’t reach the tissues (hair follicle) efficiently, hair is one of the first places it shows. The result can be hair thinning, slow growth and increased shedding.

**2. Chronic stress: a nervous system that never rests.** Chronic stress is one of the most underestimated causes of hair imbalances. When your body is constantly in “doing mode”, it quietly diverts energy away from regeneration… including hair growth.

Hair grows in cycles: Anagen (growth) → Catagen (transition) → Telogen (rest/shedding).

Chronic stress can disrupt this cycle, pushing more hair into the telogen phase, a condition known as telogen effluvium. This is why periods of emotional stress, burnout and sudden lifestyle changes are often followed by noticeable hair fall.

From an Ayurvedic lens, this reflects an aggravation of *Vata* and *Pitta*, affecting stability and nourishment.

**3. Hormonal and circadian imbalance: rhythms that are out of sync.** Irregular meals, late nights and constant stimulation may feel normal in modern life, but your body thrives on rhythm. And when that rhythm is disturbed, your hair begins to reflect it.

Hormones play a critical role in hair health. Imbalances in cortisol (the stress hormone), thyroid hormones, estrogen and androgens can directly affect hair density, texture and growth.

Additionally, modern research highlights the importance of the circadian rhythm (your internal body clock).

In Ayurveda, this is understood as living out of sync with *Dinacharya* (natural daily rhythm).
"""
            },
            {
                "heading": "Why Most Hair Care Routines Don’t Work",
                "body": """
Because they are built on symptoms, not systems. A product may temporarily smooth, shine or strengthen, but without addressing the internal ecosystem, results rarely last.

This is why you may have already tried expensive products, DIY remedies, natural solutions… and still feel like something is missing. Because something is missing: understanding.

Most conventional hair care focuses on the hair shaft, what you can see (external appearance). But biologically, the real activity happens at the hair follicle, beneath the scalp, influenced by blood circulation, nutrient delivery, hormonal signals and nervous system regulation.

This is why a product can improve texture temporarily, but cannot fully correct internal imbalances. Without addressing internal factors, results remain short-term and surface-level.

What if hair care wasn’t about “fixing”… but about listening? Listening to what your hair is expressing. Understanding your body’s patterns. Supporting your system gently, consistently, intelligently.

This is where true transformation begins. Not on your bathroom shelf… but in your daily life.
"""
            },
            {
                "heading": "A More Integrated, Evidence-Aligned Approach to Hair Care",
                "body": """
This philosophy is at the heart of our Healthy Happy Hair workshop. We don’t start with products. We start with awareness.

Inside the workshop, you’ll begin to:

- Understand your hair through both Ayurvedic and modern perspectives
- Recognize your unique patterns and imbalances
- Learn simple, practical rituals that align with your lifestyle
"""
            },
            {
                "heading": "What actually supports long-term hair health?",
                "body": """
Both modern science and Ayurveda converge on a few key principles:

1. Supporting digestion and nutrient absorption
2. Regulating stress and the nervous system
3. Aligning with natural biological rhythms
4. Maintaining consistent, gentle care practices

This is not about doing more. It is about doing what is aligned.
"""
            },
            {
                "heading": "Where Awareness Becomes Transformation",
                "body": """
This deeper understanding is the foundation of our “Healthy Happy Hair” workshop.

Rather than offering isolated tips, we guide you through:

- Understanding your hair through both scientific and Ayurvedic frameworks
- Identifying your personal patterns and root causes
- Building simple, sustainable rituals that support real change

Because once you understand your hair… you no longer need to chase solutions. You begin to create them. Because when you understand the WHY, you no longer depend on guesswork.

If you’ve been trying to FIX your hair for a while… perhaps it’s time to understand it. Your hair is already speaking. The question is: are you ready to listen?
"""
            },
        ],
        "ctaTitle": "If your hair has been asking for attention…",
        "ctaBody": "It may not be asking for another product. It may be asking for understanding. And that is where everything begins.",
        "ctaButton": "Discover the Healthy Happy Hair Workshop",
        "ctaHref": "/workshops/healthy-happy-hair",
    },
    # ------------------------------------------------------------------ 2
    {
        "slug": "scrape-the-slate-clean",
        "title": "Scrape the Slate Clean: The 10-Second Ritual for Gut Health, Pure Breath & Vibrant Well-Being",
        "category": "Daily Rituals · 4 min read",
        "excerpt": "Your tongue is still wearing yesterday’s residue. A ten-second morning ritual with a pure silver scraper resets your palate, your breath and your gut.",
        "hero": ("TS silver blog 2.jpeg", "A silver tongue scraper resting on a linen cloth beside a glass of water"),
        "sections": [
            {
                "body": """
We’ve all been there: you wake up, head straight to the bathroom, reach for your toothbrush, and give your teeth a thorough polish. You spit, rinse, and feel ready to face the day.

Except there’s one small problem. Your tongue is still wearing yesterday’s residue.

If you’ve ever noticed a thin, pale coating resting on your tongue first thing in the morning, you’ve met *Ama*. In Ayurvedic tradition, *Ama* refers to metabolic sludge, a buildup of undigested toxins and dead cells. In modern microbiology, it’s a cozy, thriving resort for anaerobic bacteria that accumulate while you sleep.

Brushing your teeth cleans your enamel, but scrubbing a textured tongue with bristles mostly just rearranges the bacteria. To truly reset your palate and your health, you have to scrape the slate clean.
"""
            },
            {
                "heading": "The Domino Effect: How 10 Seconds Changes Your Whole System",
                "body": """
It sounds almost too simple to be revolutionary, but physically sweeping away that morning coating triggers a surprising cascade of health benefits:

- **Your Gut Gets a Break:** When you swallow your morning glass of water without scraping first, you drag overnight bacterial buildup straight back into your digestive tract. Clearing your tongue gives your gut microbiome a fresh, unburdened start every single day.
- **Taste Buds Unlocked:** A coated tongue acts like a muted volume knob for flavor. By removing the film, you expose your taste receptors. Foods taste richer and more satisfying, which naturally curbs overeating and improves digestion.
- **Authentic Fresh Breath:** Mouthwashes often rely on harsh alcohol that dries out your mouth, creating an environment where bad bacteria actually thrive later. Scraping physically removes the source of odor instantly and naturally.
""",
                "image": ("blog 2 img.png", "Three steps of tongue scraping shown as framed photographs"),
                "caption": "Unlocking true flavor begins with a clean palate.",
            },
            {
                "heading": "Copper vs. Silver: Choosing Your Elemental Match",
                "body": """
When it comes to tongue scraping, metal reigns supreme. Metals are naturally antimicrobial, hygienic, and designed to last a lifetime. But which element belongs in your daily ritual?

**Copper: The Grounding Classic**
Copper has been revered for centuries for its potent natural antibacterial qualities. In Ayurvedic tradition, it carries warming energy that helps stimulate digestion and clear sluggishness (*Kapha*). It is robust, traditional, and functional—though it naturally oxidizes and develops a rustic patina over time, requiring periodic polishing to keep its bright sheen.

**Silver: The Pure Standard**
Silver is the ultimate upgrade for daily oral care. Biologically, silver is a broad-spectrum antimicrobial powerhouse, yet it is extraordinarily gentle on sensitive oral tissues. Radiating a naturally cooling energy (*Pitta*-soothing), pure silver never tarnishes under normal care, feels silky against the skin, and maintains a clean, pristine luster effortlessly.

For a ritual tool that blends timeless craftsmanship with unmatched hygiene, discover our handcrafted [Silver Tongue Cleaner](/shop/silver-tongue-scraper) designed to bring a calm, elevated touch to your morning routine.
""",
                "image": ("blog 2 image.jpeg", "A silver tongue scraper on a ceramic plate with mint and star anise"),
                "caption": "Crafted from pure silver for a gentle, naturally antimicrobial sweep.",
            },
            {
                "heading": "The Perfect Sweep",
                "body": """
No complicated steps, no lengthy routines. Here is how to master it in ten seconds flat:

1. **Extend:** Stick out your tongue comfortably in front of a mirror.
2. **Sweep:** Hold your metal scraper by the handles, place the curved edge gently at the very back of your tongue, and glide it forward toward the tip in one smooth stroke.
3. **Rinse:** Rinse the collector under warm water, and repeat 3 to 4 times until your tongue looks fresh and clean. Follow with your normal brushing.
""",
                "image": ("blog 2.jpeg", "Three numbered photographs showing how to use a tongue scraper"),
            },
            {
                "heading": "Less Noise, More Clarity",
                "body": """
True wellness doesn’t come from adding a dozen synthetic products to your medicine cabinet. It comes from stripping away what you don’t need—starting with the morning buildup on your tongue.

Whether you opt for traditional copper or experience the luminous purity of pure silver, this 10-second habit is proof that the simplest rituals often yield the most profound transformations.
"""
            },
        ],
        "ctaTitle": "Begin your morning ritual",
        "ctaBody": "Handcrafted from pure silver for a gentle, naturally antimicrobial sweep.",
        "ctaButton": "Discover the Silver Tongue Scraper",
        "ctaHref": SCRAPER_URL,
    },
    # ------------------------------------------------------------------ 3
    {
        "slug": "does-oil-pulling-actually-work",
        "title": "Does Oil Pulling Actually Work, or Is It Another Wellness Trend?",
        "category": "Oral Health · 5 min read",
        "excerpt": "Does swishing oil around your mouth really work, or is it just another wellness trend? What science, tradition and lived experience agree on.",
        "hero": ("blog 3.jpeg", "A collage of oil pulling and tongue scraping rituals"),
        "sections": [
            {
                "body": """
If you scroll through wellness feeds long enough, you’re bound to encounter someone swishing a spoonful of coconut or sesame oil around their mouth. Proponents claim it whitens teeth, clears up skin, and “detoxifies” the entire body. Skeptics write it off as an ancient placebo.

So, what is the truth?

If you’ve felt confused about whether oil pulling deserves a spot in your daily routine, you aren’t alone. Let’s separate the modern hype from traditional wisdom and look at what actually happens when you bring this mindful practice into your morning — and why it holds a permanent spot in our family’s routine.
"""
            },
            {
                "heading": "What Exactly Is Oil Pulling?",
                "body": """
Rooted in Ayurvedic tradition, where it is known as *Gandusha* or *Kavala Graha*, oil pulling is the act of swishing edible oil (traditionally sesame or coconut) gently around the oral cavity for 10 to 15 minutes before spitting it out.

Unlike a quick mouthwash gargle, oil pulling is designed to be a deliberate, unhurried practice.
"""
            },
            {
                "heading": "The Common Confusions Cleared Up",
                "body": """
- **The “Detox” Myth:** Does it pull toxins out of your bloodstream through your mucous membranes? Modern science says no — your salivary glands and oral mucosa don’t act as a systemic garbage chute.
- **The Microbial Reality:** However, oil does act as a magnet for lipid-soluble bacteria. The mechanical action of swishing mixes the oil with saliva, creating a cleansing emulsion that effectively traps plaque-forming bacteria, food debris, and microbial biofilms.
"""
            },
            {
                "heading": "From Skepticism to Real Results: Personal Stories That Changed Everything",
                "body": """
It’s one thing to read about clinical studies, but it’s entirely another to live the results. Oil pulling isn’t just a theoretical concept for us at Vairutya — it’s been a firsthand lifesaver.

Two years ago, I found myself dealing with persistent bleeding gums. To make matters worse, it started right at a time when my dentist in France wasn’t available, and getting a quick appointment there is notoriously difficult. Desperate for relief, I turned to a daily practice of oil pulling once a day. To my amazement, my gums completely healed within just three weeks using only that.

As an added bonus, it helped reverse something else I was struggling with: stubborn pigmentation on my gums and lips that had turned brown due to a mix of hormonal imbalances and caffeine intake. With consistent daily swishing, that discoloration eventually faded away, and they naturally returned to their healthy pink color.

The power of oil pulling hit home for our family again just last month. My brother was suffering from massive wisdom tooth pain caused by a small crack in his tooth. Alongside the painkillers suggested by his dentist, he incorporated oil pulling on my recommendation and he now completely swears by the relief and comfort it brought him during a very painful flare-up.
"""
            },
            {
                "heading": "The Proven Benefits: What Science and Tradition Agree On",
                "body": """
When you look past the exaggerated internet claims, clinical studies and centuries of holistic practice line up on several key benefits:

1. **Reduced Plaque and Gingivitis:** Studies show that daily oil pulling significantly reduces the *Streptococcus mutans* bacteria count in saliva, leading to healthier gums and less inflammation — just like experience taught us firsthand.
2. **Natural Fresher Breath:** Because it targets the volatile sulfur compounds and bacteria hiding in the crevices of the tongue and gums, it offers a remarkably clean foundation for your breath.
3. **Supports Your Microbiome (Without Harsh Chemicals):** Alcohol-based mouthwashes often wipe out all oral bacteria — both good and bad. Oils are gentler on the delicate oral microbiome while still sweeping away harmful pathogens.
"""
            },
            {
                "heading": "How to Do It Right (Without Jaw Fatigue)",
                "body": """
If you want to try it without dreading the process, keep these quick steps in mind:

- **Timing:** First thing in the morning, before eating, drinking, or brushing your teeth.
- **The Amount:** Just 1 tablespoon of high-quality organic coconut, sesame, or specialized pulling oil is plenty. (More oil just makes your jaw tired!)
- **The Technique:** Gently push and pull the oil through your teeth and around your gums. Relax your jaw.
- **The Disposal:** Always spit the oil into the trash can, never the sink. Coconut and plant oils solidify at cooler temperatures and will clog your plumbing over time.
- **Finish Strong:** Rinse your mouth thoroughly with warm water, and then follow up with your regular brushing and a gentle pass with your silver tongue scraper to clear away any loosened residue.
"""
            },
            {
                "heading": "Quick FAQ: Morning vs. Night—When Should You Do It?",
                "body": """
Many people ask if they can oil pull right before bed so their mouth gets “7 hours of rest.” While doing it at night is better than not doing it at all, first thing in the morning remains the gold standard. Overnight, your body processes waste and bacteria pool in your mouth. Oil pulling upon waking clears out this heavy accumulation before you swallow it, giving you a truly clean slate for the day.
"""
            },
            {
                "heading": "The Vairutya Verdict",
                "body": """
Oil pulling isn’t a magical cure-all, but it is a powerful, grounding ritual that elevates basic oral hygiene into an act of self-care. When paired with mindful daily habits like conscious tongue scraping and clean, intentional tools — it bridges the gap between ancient preventative care and modern wellness.
"""
            },
        ],
        "ctaTitle": "Ready to complete your morning ritual?",
        "ctaBody": "Explore our pure, handcrafted Vairutya Silver Tongue Scraper, designed to elevate your daily routine from the inside out.",
        "ctaButton": "Explore the Silver Tongue Scraper",
        "ctaHref": SCRAPER_URL,
    },
    # ------------------------------------------------------------------ 4
    {
        "slug": "decoding-the-stars-within",
        "title": "Decoding the Stars Within: A Holistic Approach to Medical Astrology and Long-Term Wellness",
        "category": "Holistic Wellness · 4 min read",
        "excerpt": "Medical astrology isn’t about predicting the future. It’s a map for understanding your body’s innate rhythms, so you can care for it with intention.",
        "hero": ("blog 4.jpeg", "An illuminated Ayurvedic-astrology mandala with a human figure at its centre"),
        "sections": [
            {
                "body": """
We live in an era of rapid wellness solutions. From 10-day metabolic resets to the latest supplement trends, the modern health landscape is saturated with quick fixes designed to yield immediate results. Yet, many of us find ourselves cycling through these trends, experiencing temporary relief only to return to the same baseline of fatigue, burnout, or systemic imbalance.

If you are looking for long-term answers, the missing piece may not be a new routine — it may be a shift in perspective. True, sustainable healing requires looking beyond surface-level symptoms and understanding the unique blueprint of your mind, body, and energy. Enter medical astrology: an ancient framework for decoding your body’s innate rhythms through the lens of the cosmos.
"""
            },
            {
                "heading": "Beyond the Horoscopes: What Is Medical Astrology?",
                "body": """
When most people hear “astrology,” they think of sun-sign horoscopes in magazines or personality traits associated with zodiac elements. Medical astrology — traditionally known as *Jyotish* healing or Ayurvedic astrology — operates on an entirely different level. It is not about predicting the future; it is a diagnostic and self-awareness tool.

Ancient healing traditions viewed the human body as a living microcosm of the universe. Medical astrology acts as a map, charting how cosmic cycles, planetary energies, and elemental forces mirror our internal biology. By understanding your unique natal blueprint, you gain insight into your constitution, your natural strengths, and the specific areas of your body that require gentle, consistent care.
"""
            },
            {
                "heading": "The Microcosm and Macrocosm: How Planetary Cycles Mirror Our Biology",
                "body": """
The foundational premise of medical astrology is simple: as above, so below; as within, so without.

Just as the moon governs the ocean tides, planetary movements and elemental shifts subtly influence our internal environment. In holistic health, different planets and signs correspond to specific physiological systems, energetic flows, and doshic imbalances.

For instance, when we look at nervous system regulation and chronic stress, certain planetary placements often highlight how an individual processes stimuli. If your chart indicates a tendency toward high-*vata* or overactive energetic patterns, your body may naturally burn through energy quickly, making you more susceptible to nervous system burnout, erratic sleep, and anxiety. Recognizing this isn’t about predicting stress — it is about understanding how your system responds to pressure so you can intercept it before it manifests as physical exhaustion.
"""
            },
            {
                "heading": "Root-Cause Healing: Reading Your Blueprint",
                "body": """
One of the most empowering aspects of medical astrology is its rejection of a one-size-fits-all approach to health. Modern wellness often treats symptoms in isolation. Medical astrology, conversely, looks at the root cause by mapping out your body’s inherent vulnerabilities and strengths.

- **Identifying Predispositions:** Your chart can illuminate where you might naturally hold tension — whether it is digestive sluggishness, a sensitive nervous system, or structural fatigue.
- **Proactive Self-Care:** Knowing your blueprint removes the anxiety of the unknown. Instead of wondering why standard wellness protocols leave you feeling depleted, you can tailor your lifestyle to support your specific elemental makeup.
- **Shifting from Fatalism to Agency:** An astrological blueprint is not a life sentence; it is a weather report. Understanding your climate allows you to pack the right umbrella.
"""
            },
            {
                "heading": "Bridging Ancient Wisdom with Daily Rituals",
                "body": """
Ancient systems are only as powerful as our ability to integrate them into modern life. Translating medical astrology insights into your daily routine doesn’t require complex calculations; it requires intentional, grounding habits that anchor your energy.

1. **Honor Your Nervous System:** If your energetic blueprint points toward depletion, prioritize nervous-system-soothing practices. This can look like dedicated periods of digital silence, breathwork that elongates the exhale, or somatic movement that brings you back into your physical body.
2. **Anchor with Intentional Rituals:** Incorporating mindful daily anchors — such as tongue-scraping to stimulate *agni* (digestive fire), oil massage (*abhyanga*) to ground *vata* energy, or a quiet morning tea ritual — helps bridge the gap between ancient philosophy and daily vitality.
3. **Sync with Natural Rhythms:** Allow your schedule to bend with your energy levels rather than fighting against them. Honor the seasons of rest just as much as the seasons of productivity.
"""
            },
            {
                "heading": "The Journey Inward",
                "body": """
True healing is not a race, nor is it a checklist of perfection. It is a lifelong journey of alignment — learning to listen to the subtle whispers of your body before they turn into shouts. By exploring the language of medical astrology, you open the door to a deeper, more compassionate relationship with yourself.

Your health is not an accident of genetics or a series of random symptoms; it is an integrated ecosystem. When you learn to read the stars within, you unlock the long-term answers you’ve been searching for all along.
"""
            },
        ],
        "ctaTitle": "Ready to dive deeper into your personal blueprint?",
        "ctaBody": "Book a one-on-one consultation to discover and understand your unique medical astrology, and craft targeted lifestyle changes to help you meet the healthiest version of yourself.",
        "ctaButton": "Book a consultation",
        "ctaHref": "/consultation",
    },
]

REBEL_TOAST = {
    "slug": "rebel-avocado-toast",
    "title": "The Rebel Avocado Toast",
    "tag": "BREAKFAST · BEGINNER",
    # The earlier placeholder text described a frozen egg yolk and microgreens.
    "description": "Crisp sweet-potato and carrot patties, frozen to firm and shallow-fried, crowned with a rose of smashed avocado on sourdough. A nourishing breakfast that balances Vata and Pitta.",
    "time": "~1 hour · Serves 2",
    "stats": [
        {"label": "SERVES: 2", "bold": True},
        {"label": "🕒 TOTAL TIME: ~1 HOUR", "bold": False},
        {"label": "COOK TIME: 15 MIN", "bold": False},
        {"label": "FREEZE TIME: 20 MIN", "bold": False},
        {"label": "PREP TIME: 25 MIN", "bold": False},
    ],
}

PLACEHOLDER_ARTICLE = "its-not-what-you-eat-its-what-you-digest"

# --------------------------------------------------------------------------
# Strapi helpers
# --------------------------------------------------------------------------

S = requests.Session()


def die(msg):
    print(f"\n✗ {msg}")
    sys.exit(1)


def api(method, path, **kw):
    r = S.request(method, f"{BASE}/api/{path}", timeout=180, **kw)
    if not r.ok:
        die(f"{method} /api/{path} → {r.status_code}\n{r.text[:700]}")
    return r.json() if r.content else {}


def find(plural, slug):
    data = api(
        "GET",
        plural,
        params={"locale": LOCALE, "status": "draft", "filters[slug][$eq]": slug, "fields[0]": "slug"},
    )["data"]
    return data[0] if data else None


def existing_file(name):
    files = api("GET", "upload/files", params={"filters[name][$eq]": name})
    return files[0]["id"] if files else None


def upload(data: bytes, name: str, mime: str, alt: str):
    """Upload once; if a file with this name is already in the media library, reuse it."""
    fid = existing_file(name)
    if fid:
        return fid
    r = S.post(
        f"{BASE}/api/upload",
        files={"files": (name, data, mime)},
        data={"fileInfo": json.dumps({"name": name, "alternativeText": alt})},
        timeout=300,
    )
    if not r.ok:
        die(f"upload {name} → {r.status_code}\n{r.text[:500]}")
    return r.json()[0]["id"]


def upload_file(folder: Path, filename: str, as_name: str, alt: str):
    path = folder / filename
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    ext = path.suffix.lower()
    return upload(path.read_bytes(), f"{as_name}{ext}", mime, alt)


def upsert(plural, slug, data, create_extra=None, draft=False, label=""):
    cur = find(plural, slug)
    if cur:
        api("PUT", f"{plural}/{cur['documentId']}", params={"locale": LOCALE}, json={"data": data})
        print(f"↻ updated: {label or slug}")
        return cur["documentId"]
    payload = {**data, "slug": slug, **(create_extra or {})}
    params = {"locale": LOCALE}
    if draft:
        params["status"] = "draft"
    res = api("POST", plural, params=params, json={"data": payload})
    print(f"✓ created: {label or slug}")
    return res["data"]["documentId"]


# --------------------------------------------------------------------------
# Image preparation
# --------------------------------------------------------------------------

def jpeg_bytes(img: Image.Image, quality=86) -> bytes:
    buf = io.BytesIO()
    img.convert("RGB").save(buf, "JPEG", quality=quality, optimize=True)
    return buf.getvalue()


def workshop_hero(banner: Path) -> bytes:
    """The banner has the title, a button and a caption baked in, which would clash
    with the real ones on the page. Crop the clean photo area (hands + oil)."""
    img = Image.open(banner).convert("RGB")
    w, h = img.size
    box = (int(w * 0.506), int(h * 0.2025), w, int(h * 0.5353))
    crop = img.crop(box)
    crop = crop.resize((2400, round(2400 * crop.height / crop.width)), Image.LANCZOS)
    return jpeg_bytes(crop, 86)


def recipe_photo(pdf: Path) -> bytes:
    """The PDF holds the plate photo as a cut-out. Put it on warm paper, portrait 3:4."""
    doc = pymupdf.open(pdf)
    images = [i for i in doc[0].get_images(full=True) if i[1]]  # has a soft mask
    if not images:
        die(f"No cut-out photo found on page 1 of {pdf.name}")
    xref, smask = max(images, key=lambda i: i[2] * i[3])[:2]
    rgba = pymupdf.Pixmap(pymupdf.Pixmap(doc, xref), pymupdf.Pixmap(doc, smask))
    im = Image.frombytes("RGBA", (rgba.width, rgba.height), rgba.samples)
    bbox = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    plate = im.crop(bbox)
    scale = 1040 / max(plate.size)
    plate = plate.resize((round(plate.width * scale), round(plate.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGB", (1200, 1600), (240, 233, 221))
    canvas.paste(plate, ((1200 - plate.width) // 2, (1600 - plate.height) // 2), plate)
    return jpeg_bytes(canvas, 88)


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    remove_placeholder = "--remove-placeholder" in sys.argv
    if not TOKEN:
        die("Missing STRAPI_API_TOKEN (Strapi admin → Settings → API Tokens → Full access).")
    if len(args) != 1:
        die('Usage: STRAPI_API_TOKEN=… python3 scripts/import_content.py "<content folder>"')
    folder = Path(args[0]).expanduser()
    S.headers["Authorization"] = f"Bearer {TOKEN}"

    # Fail fast if a file is missing, before touching Strapi
    needed = ["hair workshop banner.png", "The Rebel Avocado Toast.pdf"]
    for a in ARTICLES:
        if "hero" in a:
            needed.append(a["hero"][0])
        for s in a["sections"]:
            if "image" in s:
                needed.append(s["image"][0])
    missing = [n for n in needed if not (folder / n).exists()]
    if missing:
        die(f"These files were not found in {folder}:\n  - " + "\n  - ".join(missing))

    print(f"Importing into {BASE}\n")

    # ---- Articles ------------------------------------------------------
    print("— Articles")
    for a in ARTICLES:
        slug = a["slug"]
        data = {
            "sections": [],
            "ctaTitle": a["ctaTitle"],
            "ctaBody": a["ctaBody"],
            "ctaButton": a["ctaButton"],
            "ctaHref": a["ctaHref"],
        }
        for key in ("title", "category", "excerpt"):
            if key in a:
                data[key] = a[key]
        if "hero" in a:
            fname, alt = a["hero"]
            data["heroImage"] = upload_file(folder, fname, f"article-{slug}-hero", alt)
        for i, s in enumerate(a["sections"], 1):
            sec = {"body": s["body"].strip()}
            if s.get("heading"):
                sec["heading"] = s["heading"]
            if "image" in s:
                fname, alt = s["image"]
                sec["image"] = upload_file(folder, fname, f"article-{slug}-{i}", alt)
            if s.get("caption"):
                sec["caption"] = s["caption"]
            data["sections"].append(sec)
        upsert("articles", slug, data, create_extra=a.get("create_only"), label=a.get("title") or slug)

    # ---- Recipe --------------------------------------------------------
    print("\n— Recipe")
    pdf = folder / "The Rebel Avocado Toast.pdf"
    photo_id = upload(recipe_photo(pdf), "recipe-rebel-avocado-toast.jpg", "image/jpeg",
                      "Two sweet-potato patties topped with avocado roses on a speckled plate")
    pdf_id = upload(pdf.read_bytes(), "The-Rebel-Avocado-Toast.pdf", "application/pdf", "The Rebel Avocado Toast — recipe PDF")
    r = {**REBEL_TOAST}
    slug = r.pop("slug")
    r["image"] = photo_id
    r["pdf"] = pdf_id
    upsert("recipes", slug, r, label="The Rebel Avocado Toast")

    # ---- Workshop hero -------------------------------------------------
    print("\n— Workshop")
    hero_id = upload(workshop_hero(folder / "hair workshop banner.png"), "workshop-healthy-happy-hair-hero.jpg",
                     "image/jpeg", "A hand applying golden oil to long brown hair")
    cur = find("workshops", "healthy-happy-hair")
    if cur:
        api("PUT", f"workshops/{cur['documentId']}", params={"locale": LOCALE}, json={"data": {"heroImage": hero_id}})
        print("↻ updated: Healthy Happy Hair (hero image)")
    else:
        print("• skipped: workshop 'healthy-happy-hair' not found in Strapi")

    # ---- Optional cleanup ---------------------------------------------
    if remove_placeholder:
        print("\n— Cleanup")
        cur = find("articles", PLACEHOLDER_ARTICLE)
        if cur:
            api("DELETE", f"articles/{cur['documentId']}")
            print("✓ removed the unwritten placeholder article")
        else:
            print("• placeholder article not found (already gone)")

    print("\nDone.")


if __name__ == "__main__":
    main()
