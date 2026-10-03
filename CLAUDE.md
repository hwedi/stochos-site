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

- js/data.js holds all the content that changes: the team, roles, LinkedIn and GitHub links, projects, and the results numbers.
- Other files: index.html, projects.html, 404.html, css/site.css (colour variables are at the top), js/site.js, fonts/, img/.
- img/og.png needs a browser to regenerate. Ask the owner when it needs a new one.
- CNAME must stay exactly: stochos.dev
- Update sitemap.xml when a page is added.

## Rules for content

- The team is six equals, listed alphabetically, with no leader.
- Add a LinkedIn or GitHub link only when the owner gives the exact address. Never invent one.
- Change a role only when the owner asks.
- The results numbers (95%, 45 of 900, 40 days, 89%) must match the transformer app. Change them only if the owner says the models changed.
- The footer must keep "not an official Samsung website".
- No Samsung logos.
- No emojis.
- Write plainly and specifically.
- Load nothing from other websites.
- Keep both themes, the phone layout, keyboard focus and good contrast.

## What you cannot do

You cannot change DNS at Name.com or the GitHub Pages settings. If the owner needs one of those, give them the exact clicks.
