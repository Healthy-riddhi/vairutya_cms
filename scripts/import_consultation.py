#!/usr/bin/env python3
"""
Fill the Consultation Page in Strapi with the copy from the consultation PDF.

  STRAPI_API_TOKEN=<full-access token> python3 scripts/import_consultation.py

Safe to run again: it replaces the page's text with this version each time.
"""
import os
import sys

import requests

BASE = os.environ.get("STRAPI_URL", "http://localhost:1337").rstrip("/")
TOKEN = os.environ.get("STRAPI_API_TOKEN")
LOCALE = "en"

PAGE = {
    "headline": "Find Your Clarity. Build Your Natural Rhythm.",
    "intro": (
        "Your routine and health journey should never feel like a burden or a source of pressure — "
        "because if it does, it simply isn’t going to help. Tired of endless wellness noise, rigid rules, "
        "and quick-fix anxiety? Take a breath. Your personal health journey starts here, designed around "
        "who you actually are."
    ),
    "primaryCta": "Book Your Consultation",
    "helpTitle": "How We Help You Thrive",
    "helpBody": (
        "We don’t believe in telling you how to live. Wellbeing should feel welcoming, not intimidating, "
        "and health was never meant to become another source of pressure.\n\n"
        "True guidance should build your confidence, not create dependence. In a world full of conflicting "
        "opinions, our 1-on-1 sessions cut through the confusion to help you understand your own body, align "
        "with your natural rhythm, and make choices with absolute intention."
    ),
    "journeyTitle": "Your Personalized Journey",
    "journeySteps": [
        {
            "title": "The Discovery Call",
            "description": (
                "Book your appointment and connect with us via a flexible audio or video call. We dive deep "
                "into your unique needs, lifestyle, and goals without any judgment."
            ),
        },
        {
            "title": "The Blueprint (3–5 Days)",
            "description": (
                "Because your journey is entirely unique, our experts take 3 to 5 business days post-call to "
                "meticulously curate a personalized protocol just for you."
            ),
        },
        {
            "title": "Mindful Implementation",
            "description": (
                "We introduce seamless, sustainable enhancements to your daily living and food habits—helping "
                "you achieve lasting health objectives naturally, without the burnout."
            ),
        },
    ],
    "includedTitle": "What Is Included In Your Experience",
    "includedIntro": "Get a complete, actionable toolkit tailored specifically to your body and lifestyle:",
    "includedItems": [
        {
            "title": "Body Type (Prakriti) Assessment & Lifestyle Plan (PDF)",
            "description": (
                "Custom-built guidance including Dinacharya (daily routines) and Ratricharya (evening routines) "
                "to anchor your days effortlessly."
            ),
        },
        {
            "title": "7-Day Personalized Meal Plan (PDF)",
            "description": (
                "Nourishing, realistic food choices tailored to your unique constitution and objectives, "
                "keeping meals enjoyable rather than restrictive."
            ),
        },
        {
            "title": "7-Day Body Movement Plan",
            "description": (
                "A guided routine featuring custom yoga, meditation, and movement designed to support your "
                "energy without feeling like a punishing chore."
            ),
        },
        {
            "title": "3 Total Session Calls",
            "description": (
                "Full-circle support across three dedicated sessions (starting with your initial consultation) "
                "to track your progress and refine your path at a comfortable pace."
            ),
        },
    ],
    "closingTitle": "Ready to Replace Confusion With Clarity?",
    "closingBody": "Embrace a way of living cultivated through small, intentional choices repeated with care.",
    "secondaryCta": "Secure Your Spot",
}


def main():
    if not TOKEN:
        sys.exit("Missing STRAPI_API_TOKEN (Strapi admin → Settings → API Tokens → Full access).")
    r = requests.put(
        f"{BASE}/api/consultation-page",
        params={"locale": LOCALE},
        json={"data": PAGE},
        headers={"Authorization": f"Bearer {TOKEN}"},
        timeout=120,
    )
    if not r.ok:
        sys.exit(f"✗ PUT /api/consultation-page → {r.status_code}\n{r.text[:600]}")
    print("✓ Consultation page saved and published.")


if __name__ == "__main__":
    main()
