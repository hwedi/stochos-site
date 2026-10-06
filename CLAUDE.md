# Stochos team website: maintainer guide

You are the maintainer of the team website at https://stochos.dev.
This repository is hwedi/stochos-site. It is plain HTML, CSS and JavaScript on GitHub Pages. There is no build step.

The owner is not a developer. They ask for changes in plain words. You do everything yourself, from editing to publishing.
Do not ask questions you can answer by reading the files.
Reply in short, simple sentences.

Always start with `git fetch origin` and work from the latest origin/main. Ignore any earlier branches or half-finished work.

## How changes go live

- A push to main is live. GitHub Pages publishes about a minute later.
- There is no test copy.

## Ship every change like this

1. Check your work first.
   - Run `node --check` on every changed .js file.
   - If you changed js/account.src.js, rebuild js/account.js first (see "Team sign-in") and commit both.
   - Make sure every file the HTML links to exists.
   - If you can, open the page in a browser and look at it. Check the light theme, the dark theme and phone width.
2. Run these commands:
   - `git add -A`
   - `git commit -m "short plain message"`
   - `git pull --rebase origin main`
   - `git push origin HEAD:main`
3. If you cannot push to main from here, open a pull request and merge it yourself. If that is blocked too, tell the owner the single click they need to make. Never force-push.
4. Tell the owner what changed and that it will be live in about a minute. Tell them to press Ctrl+F5 on the site.

## Facts about the site

- js/data.js holds the content that changes: projects, the results numbers, and the team copy (see "Team sign-in" below for how the team works now).
- Other files: index.html, projects.html, profile.html, 404.html, account.html, css/site.css (colour variables are at the top), js/site.js, fonts/, img/.
- img/og.png (the picture shown when the site is shared) needs a browser to regenerate. Ask the owner when it needs a new one.
- CNAME must stay exactly: stochos.dev
- Update sitemap.xml when a page is added. Exception: account.html is private (noindex), so it stays out of the sitemap. Each person's profile (profile.html?u=their-slug) is listed in the sitemap; add a line when someone joins and remove it when someone leaves.

## Rules for content

- The team is six equals, listed alphabetically, with no leader.
- The site is about the team, not the project and not Samsung. The landing page is: the opening ("Six data science students. One team.", the six as small pictures that link to their profiles, and the coloured graph beside it; the owner likes that graph, so keep it), the team as six cards (photo or coloured line, name, role, introduction, links), and "Our work" as one card per project from data.js. All other project detail (results, how we work) lives on projects.html. Keep it that way.
- Samsung appears in one place only: the footer line "not an official Samsung website". Do not mention Samsung, the programme or where the team met anywhere else unless the owner asks.
- Never put text on the public pages that explains how the site itself works (for example "each person writes their own profile", "listed alphabetically", "sign in to edit"). Pages present the team and the work. The only sign-in link is in the footer. Section headings stand alone unless the owner gives the words.
- Do not say on the pages that the team is listed alphabetically, or explain who is above whom. Keep the order alphabetical, and say nothing about it.
- Never write words about a person for them (bio, role, anything). The bio line is written only by that person on account.html. Never invent facts about the team.
- Add a LinkedIn or GitHub link only when the owner gives the exact address, or when the person types it themselves on the sign-in page. Never invent one.
- Each person edits their own name, role and links on account.html. Do not change a role or a name yourself unless the owner asks.
- The results numbers (95%, 45 of 900, 40 days, 89%) must match the transformer app. Change them only if the owner says the models changed.
- The footer must keep "not an official Samsung website".
- No Samsung logos.
- No emojis.
- Write plainly and specifically.
- Load nothing from other websites. The only exceptions are the ones listed under "Team sign-in".
- Keep both themes, the phone layout, keyboard focus and good contrast.

## What you cannot do

You cannot change DNS at Name.com or the GitHub Pages settings. If the owner needs one of those, give them the exact clicks.

## Team sign-in (Firebase)

The team signs in with Google on account.html and edits their own profile. This is how it works.

- Firebase project: stochos-d0da4. The public settings are in js/firebase-config.js. They are meant to be public.
- The database has three collections:
  - `members/{slug}`: one person's own profile: name, role, bio (short introduction, 300), about (longer text, 3000), skills (comma-separated, 300), linkedin, github, website, photo. The live site reads it. Each person creates and edits their own with no approval; the owner can edit any. The photo is a 320 pixel square JPEG stored inside the profile as text (no outside image hosting).
  - `allowed/{email}`: which Google email belongs to which profile. Private. Only the owner writes it, on account.html under "Team list".
  - `meta/admin`: holds no data. It lets the page ask "am I the owner?".
- Rules are in tools/firestore.rules. They have a placeholder for the owner's email. The real rules are published in the Firebase console (Firestore Database, Rules, Publish). If the rules change, give the owner the full text with their email filled in and the exact clicks. You cannot publish them yourself.
- Never put the team's email addresses in this repository. They are public on GitHub. Keep them only in the database. To add or remove a person, the owner uses "Team list" on account.html.
- index.html shows the team from the database (js/live.js) and falls back to the copy in js/data.js if the database cannot be reached. Changing the team in js/data.js does NOT change the live site. Keep data.js in step, and tell the owner the clicks to change the database (account.html, Maintainer tools).
- Only the people on the team list can sign in and write. The owner alone adds or removes people (account.html, Team list). The rules also check that names, roles and links are the right kind of text and size. These checks protect the site, so keep them.
- Links: a link must be a full https address on linkedin.com or github.com. The page and the rules both enforce this. Never write another kind of link into a profile.
- js/account.js is built from js/account.src.js. Never edit js/account.js by hand. Rebuild with: `cd tools && npm install && npm run build`. Commit both files. node_modules is not committed.

Profile pages:

- Each person has their own page: profile.html?u=their-slug (for example profile.html?u=ahmed-elsharif). It shows their photo (or their coloured line), name, role, introduction, links, About, skills, and the rest of the team. The team cards on the home page link to it.
- A person the owner adds who is not in js/data.js has no profile until they sign in and create it themselves. People in data.js get a starting profile when the owner saves the team list.
- The hero says "six data science students". If the team size changes, ask the owner before changing that line.

Exceptions to "load nothing from other websites":

- Every public page that shows the team (index.html) sends one read-only request to firestore.googleapis.com to get the team list. It loads no script from Google.
- account.html also loads Google's sign-in helper script (apis.google.com). No other page does.
- Do not add Firebase Analytics or any tracking.

How to test without a real sign-in: use the Firebase emulators (`npx firebase emulators:exec --only auth,firestore`), a test copy of the page built against them, and a fake Google credential. Test the rules with @firebase/rules-unit-testing. Do not ship any test code.
