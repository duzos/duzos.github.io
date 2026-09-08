# Alan Hall - counselling site

A preview draft, built to show Alan for approval. Static HTML and CSS, **no
JavaScript at all**, no build step. Open `index.html` in a browser to view it.

Live path once pushed: `https://duzo.is-a.dev/sites/counselling/`
(the repo's `CNAME` is `duzo.is-a.dev`, so GitHub redirects `duzos.github.io`
there - send Alan the `duzo.is-a.dev` URL.)

## Files

| File | What it is |
|---|---|
| `index.html` | The whole page. Content is grouped under commented section banners. |
| `style.css` | Isolated stylesheet. Deliberately does **not** import the root `../../style.css`, so portfolio styling cannot leak in. Design tokens are at the top under `:root`. |
| `assets/alan-hall.png` | Portrait, 400×400. |
| `assets/favicon.svg` | Tab icon. Without this the browser would fall back to James's portfolio favicon. |
| `assets/fonts/` | Jost, self-hosted. See below. |

## Before this goes live

**Must be resolved:**

1. **Email address.** There is no email address anywhere on Alan's Counselling
   Directory profile - enquiries route through the directory's own form. Rather
   than ship a broken `mailto:`, every call-to-action currently points at
   `tel:+447736770100`. If Alan wants an email button, add the address and a
   `.btn--secondary` link beside the phone CTA in the hero.
2. **Session length.** The fee is £50 but his profile never states how long a
   session is. It is the single most common question and it is currently flagged
   as a draft in the FAQ.
3. **Cancellation and payment policy.** Not stated anywhere in the source. Needs
   his own wording.
4. **Confidentiality wording.** Flagged as draft in the FAQ. Should be his own
   words, not a paraphrase of the BACP framework.
5. **BACP membership number.** Not published on his profile. A UK counselling
   site would normally show it so a client can verify him on the BACP register.
   Deliberately not invented here. Do **not** add the BACP logo either - its use
   is licensed and conditional.
6. **The credentials discrepancy is Alan's own, not a transcription error.** His
   profile shows `BSc (Hons)` in his credentials line and
   `BSc (Econ) in Philosophy & Psychology` in his qualifications list. Both are
   reproduced here exactly as he has them. He should pick one.
7. **Remove the draft markers.** Three things: the `<meta name="robots"
   content="noindex, nofollow">` in `<head>`, the `.draft-banner` and every
   `.draft-tag` in the FAQ section, and the "Preview draft" line in the footer.
8. **Replace the portrait.** `assets/alan-hall.png` was taken from the
   Counselling Directory CDN. It is only 400×400, which is why it is displayed
   as a circular portrait capped at about 220px rather than as a large hero
   image. Ask Alan for the original file.

**Worth raising with him:**

- **Where should this actually live?** A professional practice site sitting at
  `duzo.is-a.dev/sites/counselling/` - a personal portfolio domain, on a path he
  does not control - is fine for approval but wrong long-term. If he wants it,
  it should get its own domain. That decision changes the canonical URL and any
  structured data, so make it before removing `noindex`.
- Missing pages a UK counselling site usually carries: a full privacy notice
  (the footer block is a truthful summary, not a complete notice), a complaints
  route including that clients may complain to BACP, and mention of professional
  indemnity insurance and clinical supervision.
- **Wednesday has no times** in the availability list because his profile gives
  none - it just says "Online or phone". Not an omission on this end.
- The **90-item category tick-list** on his directory profile is not reproduced
  here, on purpose. He has ticked nearly every available category, from HIV/AIDS
  to schizophrenia, which is directory search-visibility behaviour rather than a
  claim of specialism. The twelve areas on the page are the ones he describes in
  his own prose. If he wants more added, take them from things he would actually
  say he specialises in.
- **Access information is attributed, not asserted** - the page says "the therapy
  rooms' own access information states…" and invites people to ask before
  booking. Please keep that framing. It describes a shared building, and a wrong
  claim means a wheelchair user makes a wasted journey.

## Content sources

- **Copy** is from `counselling-directory.org.uk/counsellors/alan-hall`, mostly
  verbatim. The page is Cloudflare-protected and 403s plain fetches; it was read
  through a browser.
- **Visual style** follows `realselfcounselling.co.uk` (Lianne Austin), which was
  given as the reference. Note both practices work out of the same Hesketh Mount
  building, so the two sites will read as related - that was a deliberate choice
  and is worth mentioning to Alan.
- **Helpline numbers and hours** were each verified against the organisation's
  own website in September 2026, not copied from the reference site. One
  correction found in the process: Papyrus is now HOPELINE247 on 0800 068 4141
  and runs 24/7, not the older HOPELINEUK number/hours.

## Fonts

Jost (SIL Open Font License) is **self-hosted** in `assets/fonts/`, not loaded
from Google Fonts. Google Fonts would send every visitor's IP address to Google,
which is a poor fit for a counselling site with no privacy notice, and would
break the footer's claim that the site makes no third-party requests. It is a
stand-in for the reference site's Avenir, which is commercially licensed and
cannot be served. Keep `assets/fonts/OFL-NOTICE.txt` in place.

If the two `.woff2` files are ever lost, the CSS falls back to Century Gothic and
then a system sans stack - similar geometric feel, slightly different metrics.

## Palette

Tokens live at the top of `style.css` with their WCAG contrast ratios in
comments. The important rule: **the reference site's own sage `#71906c` and
terracotta `#cf8d7e` do not pass AA for text.** Sage is limited to display
headings of 24px and above; terracotta is decorative only and never carries text
or delineates a UI control. The `-deep`, `-deeper` and `-text` variants are the
AA-passing siblings that do all the real work. If you change a colour, recompute
the ratio before shipping it.

## Second pass: the five reworked sections

All copy is Alan's own, verbatim. The changes are typographic and structural,
not rewrites.

**Hero credentials.** Was one cramped uppercase pipe-delimited string
(`CBT L5 DIP | DIP COUNSELLING | MBACP | BSc (HONS) | PGCE`) that wrapped badly
and read as alphabet soup to anyone who does not already know the
abbreviations. Now: sentence case as he writes them, hairline separators, and
they wrap without stranding an item. A three-cell trust row underneath carries
the plain-English version (Registered Member of the BACP / first qualified 1996
/ free 20-minute call), so the letters are no longer doing the reassurance work
on their own. The full decode still lives under "About me".

**How I can help.** Was a two-column split that stranded one sentence in a
mostly-empty left column beside three dense paragraphs. Now his strongest
sentence is a serif pull quote, and the prose sits in a single comfortable
measure offset to the right of it. The long third paragraph is split at its
natural break so neurodivergence is not buried mid-block.

**What I help with.** Was twelve identical chips in a flat wall, with equal
visual weight on everything and no scanning order. Now an editorial index list.
Crucially the items are his own "Professional experience" list, in his order and
his phrasing, which is why "Phobias and low self-esteem" is one item rather than
two, and why internet/social media use uses his fuller wording. No category
headings were invented on top of them.

**When I work.** Was a definition list where the mode was buried in a sentence
and Wednesday looked broken. Now a real table with the session type as a tagged
pill, because face to face versus online is the distinction people actually
scan for. Wednesday reads "Not stated" because his profile genuinely gives no
times for it. Thursday and Sunday are called out as not listed rather than
silently absent.

**Where to find me.** Was four repetitive boxes with access buried at the
bottom of a column. Now the phone number is a single dark panel with the
strongest contrast on the page, the address carries a map link, the four session
modes have icons, and his access wording is a proper attributed quote.

## Booking and enquiry links

Both of Alan's Counselling Directory forms are now linked from the contact
panel:

- Book a call: `secure.counselling-directory.org.uk/introductory-call/110919/select-slot`
- Send a message: `secure.counselling-directory.org.uk/counselloremail_110919.html`

**They cannot be embedded, and this was checked rather than assumed.** Both
respond with `X-Frame-Options: SAMEORIGIN`, which tells every browser to refuse
to render them in an iframe on another domain. There is also no API to build
against: the available slots are server-rendered into the page, the only POST on
load is a Cloudflare bot challenge, and a plain request to either URL returns
403. So nothing a static site could consume exists even if the framing header
allowed it. Deep links out are the only honest option, and the page says plainly
that they open on Counselling Directory.

Worth knowing: the booking page offers slots from 6am to 8:30pm across all seven
days, which does not match the five days in "When I work". That is the same
tick-everything pattern as the category list, so the two need reconciling with
him.

## Counselling Directory costs

From their own join page: **£24.50 a month rolling** (cancel with 30 days'
notice) or **£245 a year**, free for registered charities. It is a flat
advertising subscription, **not** a commission, so nothing is taken per client.
Relevant because his own site could eventually replace that spend, though not
while the booking and enquiry forms still live there.

## Further items for Alan

9. **His profile carries two postcodes.** The location line reads
   "Hesketh Mount, 92-96 Lord Street, PR8 1JR, Southport, Merseyside, PR9 0PA".
   `PR8 1JR` matches the therapy rooms and is what this page uses; `PR9 0PA` is
   probably his own or registered address and looks like a data error on the
   directory listing. Worth him fixing there too.
10. **"Types of client" ticks everything** on his profile: young people through
    older adults, plus couples, families, groups and organisations. His written
    profile only ever describes one-to-one counselling. All eight are shown on
    the page but flagged with a draft tag, because couples, families, groups and
    organisations are quite different pieces of work to claim.
11. **DBS check.** His profile lists a DBS check under key details. Not shown on
    the page yet, since the listing is a disclosure link rather than a statement.
    It is a genuine trust signal and worth adding in his own words.

## Fonts, second pass

Newsreader (SIL Open Font License) is now self-hosted alongside Jost, as an
editorial counterweight: geometric sans for structure, warm serif for the
sentences meant to be read slowly. The italic subset is used for editorial
asides, because Jost ships no italic at all and the browser was otherwise
synthesising a sheared oblique. Total font payload is about 166KB across four
subsets, all first-party.
