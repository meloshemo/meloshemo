# Google Play Store Copy — Hall of Giants

Prepared to be **pasted straight into** the Play Console fields. Each heading
is one field; paste the contents of the code block as-is. The limits are
Google Play's own, and the text is kept under them (`npm run magaza:denetim`
counts them).

---

## 1. App details

| Field | Value |
| --- | --- |
| Package name | `com.meloshemo.devaynasi` |
| Default language | Turkish (tr-TR) |
| Second language | English (en-US) |
| App type | Game |
| Category | Puzzle |
| Tags | Puzzle, Adventure, Single player, Multiplayer |
| Free / paid | Free |
| In-app purchases | None |
| Ads | None |

> **The package name cannot be changed** once the first build is uploaded.

---

## 2. App name (max 30 characters)

```
Hall of Giants: Dev Aynası
```

---

## 3. Short description (max 80 characters)

```
Thousands of identical mirrors. Only one shows you as a giant. Find it.
```

---

## 4. Full description (max 4000 characters)

```
"Kendini dev aynasında görmek" is a Turkish idiom: to see yourself as
larger than you are. Hall of Giants turns that idiom into a game.

A DARK HALL OF MIRRORS

You hold a lantern in a fairground hall whose walls are all mirrors. Step
close to one and your reflection appears behind the glass — a true
reflection, at your real size. Thousands of them show you exactly as you
are.

Only one shows you as a giant, gold, too large for the panel.

Find it, walk into it, and the next room opens.

TWENTY ROOMS, TWENTY RULES

Every room brings its own rule, and the hall grows as you go — 5,000
mirrors in the first room, 20,000 in the last.

• I · Hall of Mirrors — Find the giant mirror and walk into it
• II · Inside the Mirror — Pick the true giant out of warped fakes
• III · Inverted Hall — The controls are mirrored: press left, go right
• IV · Shifting Mirrors — The walls will not stay put
• V · Echo — A twin repeats your every step in reverse
• VI · Room of Vanity — The brightest room of pride
• VII–XII — Paris, Venice, Tokyo, New York, Cairo, Istanbul
• XIII–XV — London fog, a Dubai glass tower, Rio carnival
• XVI · The Fleeing Mirror — The giant mirror moves away as you approach
• XVII · Kyoto, Still Water — The image scatters as you walk; only stillness gathers it
• XVIII · Reykjavík, Hall of Ice — The floor is slick; stopping is work in itself
• XIX · Marrakesh, Dying Lantern — Your lantern fades; only new glass feeds it
• XX · Infinity, Lying Mirrors — Some panels show a giant and lie

ONLINE RACE

Up to eight players race in the same hall. Everyone plays an identical
hall, and a crowd makes it bigger: each player adds another 5,000 mirrors.
Whoever finds the giant mirror last is knocked out, round after round,
until one is left. Two players who finish at the same moment share the
same place and settle it in a tie-break round.

The server decides who found it, not the player's device: the giant
mirror's location is never sent ahead of time, only revealed once you are
beside it. Teleporting is blocked by a speed limit.

ENDLESS HALL

One unending hall where the rules mix at random and the difficulty climbs.
The only goal is to beat your own record.

TWO PLAYERS, ONE DEVICE

Split-screen duel: both of you in the same hall, after the same mirror.

AN HONEST GAME

• No ads, no in-app purchases, no subscription
• No account, no email address
• No analytics, no trackers, no crash reports
• Single player works fully offline
• Complete in English and Turkish

The game is silent by design: there is no sound.
```

---

## 5. Release notes (max 500 characters)

```
First release.

Twenty rooms, an online race, an endless hall, and a two-player duel on one
device. No ads, no purchases, and a single-player mode that works entirely
offline.
```

---

## 6. Graphics

| Asset | Size | File | Status |
| --- | --- | --- | --- |
| App icon | 512×512, no transparency | `basin/android/play-ikon-512.png` | ✅ generated |
| Feature graphic | 1024×500, no transparency | `basin/android/play-ozellik-1024x500-en.png` | ✅ generated |
| Phone screenshots | 1920×1080, 2 to 8 | `basin/*-en.png` | ✅ 11 available |
| 7" tablet | 1920×1080 accepted | same files | ✅ |
| 10" tablet | 1920×1080 accepted | same files | ✅ |
| Promo video | YouTube link | upload the WebM in `fragman/` | ⬜ to upload |

Screenshots are landscape (16:9). The game is locked to landscape, so no
portrait shots are needed.

---

## 7. Data safety form

Play Console → Policy → App content → Data safety. Answers:

| Question | Answer |
| --- | --- |
| Does your app collect or share user data? | **No** |
| Is data encrypted in transit? | Yes (`wss://`, TLS) |
| Can users request data deletion? | No data is collected |
| Independent security review | No |

**Rationale (for review, if asked):** in the online mode the nickname the
player types and their position in the hall go to the server, which keeps
them in memory only while the race runs and drops them when the room
empties. There is no database and no IP logging. Under Play's definition
this is not collection: nothing is stored persistently or tied to an
identity.

> Typing a real name into the nickname field is the player's own choice;
> the game neither asks for nor verifies a real name.

---

## 8. Content rating questionnaire (IARC)

| Question | Answer |
| --- | --- |
| Violence | None |
| Sexuality / nudity | None |
| Profanity | None |
| Drugs, alcohol, tobacco | None |
| Gambling (real or simulated) | None |
| Horror / frightening content | None — a dark atmosphere, no jump scares |
| Can users interact with each other? | **Yes** — nicknames are visible in the online race |
| Do users share location? | No |
| Is user-generated content shared? | No — no chat, nickname only |
| Digital purchases | None |

Expected rating: **Everyone / 3+**.

---

## 9. Target audience and content

| Field | Value |
| --- | --- |
| Target age range | 13+ (because of online interaction) |
| Appeals to children? | No |
| Contains ads? | No |
| Government app? | No |
| Financial features | None |
| COVID-19 tracing | None |

> 13+ is chosen because players see each other's typed nicknames in the
> online mode. The content itself suits all ages; entering the "Teacher
> Approved / Families" programme would require removing the nickname field.

---

## 10. Contact and links

| Field | Value |
| --- | --- |
| Email | `y.osmanmelih@gmail.com` |
| Privacy policy URL | ⬜ **to fill in** — `belgeler/en/PRIVACY-POLICY.md` must be hosted |
| Website | ⬜ optional |
| Support phone | not required |

> **The privacy policy URL is mandatory.** A markdown file is not enough;
> Play requires a working link. The cheapest route is GitHub Pages.

---

## 11. Final check before upload

- [ ] Package name `com.meloshemo.devaynasi` confirmed (it is permanent)
- [ ] Signing key generated and **backed up** (`mobil/README.md`)
- [ ] Play App Signing enabled (Google holds the key; losing it stops being fatal)
- [ ] Privacy policy hosted and its URL entered
- [ ] Data safety form completed
- [ ] Content rating questionnaire completed
- [ ] Screenshots and feature graphic uploaded
- [ ] Tried on at least one device through closed testing
- [ ] `versionCode` higher than the previous upload
