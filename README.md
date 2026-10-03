# STOCHOS team site (stochos.dev)

Plain HTML, CSS and JavaScript. No build step. To preview, unzip and double-click `index.html`.

## Change the content
Open `js/data.js`. It holds the team, the project text and the results numbers.
- Add `linkedin` and `github` links for each person. Empty ones are hidden.
- Each person should check their role line.
- To add a project, copy the project block. It shows up on the Projects page.
- The results numbers must match the models that are live on the demo.

## Put it online (GitHub Pages, free)
1. On github.com create a new public repository, for example `stochos-site`.
2. Upload everything in this folder (drag the files and folders in), then commit.
3. Repository Settings, Pages, Source: "Deploy from a branch", branch `main`, folder `/ (root)`, Save.
4. Same page, Custom domain: type `stochos.dev`, Save. Tick "Enforce HTTPS" once it lets you.
5. At Name.com, open the DNS records for stochos.dev and add:
   - four A records, host left empty, answers: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - one CNAME record, host `www`, answer `YOUR-GITHUB-USERNAME.github.io`
6. Delete any other A, AAAA, ALIAS or CNAME record whose host is empty or `stochos.dev`.
   Leave the `transformer` CNAME and the `asuid.transformer` TXT record alone. They keep the demo working.
7. Wait. It can take from a few minutes to a day for the site and its HTTPS certificate to appear.
