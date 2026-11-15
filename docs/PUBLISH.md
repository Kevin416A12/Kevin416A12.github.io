# Publishing to GitHub Pages

Nothing has been pushed. Run these yourself in Terminal. GitHub user: `iirias`. Repository: `saving-rover-orion`.

## Option A — with the GitHub CLI (`gh`)

```bash
cd "$HOME/Desktop/SpaceApps 2026/saving-rover-orion"
git init -b main
git add .
git commit -m "Junior Astronaut Mission Trainer: Saving Rover Orion v0.7.0"
gh auth login                                   # only the first time
gh repo create iirias/saving-rover-orion --public --source=. --remote=origin --push
gh api -X POST repos/iirias/saving-rover-orion/pages -f "source[branch]=main" -f "source[path]=/"
```

## Option B — without `gh`

1. github.com → **New repository** → name `saving-rover-orion` → **Public** → no README, no .gitignore, no licence → **Create repository**.
2. In Terminal:

```bash
cd "$HOME/Desktop/SpaceApps 2026/saving-rover-orion"
git init -b main
git add .
git commit -m "Junior Astronaut Mission Trainer: Saving Rover Orion v0.7.0"
git remote add origin https://github.com/iirias/saving-rover-orion.git
git push -u origin main
```

3. In the repository: **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: **main**, folder **/ (root)** → **Save**.

## Then

The game appears after a minute or two at **https://iirias.github.io/saving-rover-orion/**. Open it in a private window, then on the iPad (Silent mode off). Use that link as "Link to Final Project".

## Pre-publish check (2026-11-15)

- `index.html` at the root; every path relative; no build step; no external requests.
- No API keys, no email addresses, no absolute file paths.
- Largest file: about 5.7 MB (a music track); nothing near 25 MB.
- `.nojekyll` present. Raw `.tif` / `.IMG` maps excluded by `.gitignore`.
