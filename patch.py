import re

with open('c:/Users/sarux/Downloads/fps/src/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Skeletons
css = re.sub(
    r'\.skeleton-loading \{[^}]*\}',
    r'.skeleton-loading {\n  background: linear-gradient(110deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%);\n  background-size: 400% 100%;\n  animation: skeleton-shimmer 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;\n}',
    css
)
css = re.sub(
    r'@keyframes skeleton-shimmer \{[^}]*\}',
    r'@keyframes skeleton-shimmer {\n  0% { background-position: 200% 0; }\n  100% { background-position: -200% 0; }\n}',
    css
)

# 2. Ripple
css = re.sub(
    r'\.ripple-active \{',
    r'.ripple-active {\n  -webkit-mask-image: -webkit-radial-gradient(white, black);\n  mask-image: radial-gradient(white, black);\n',
    css
)

# 3. Splash Screen
css = re.sub(
    r'\.splash-screen-container \{',
    r'.splash-screen-container {\n  backdrop-filter: blur(24px);\n  -webkit-backdrop-filter: blur(24px);\n  background: rgba(4, 5, 10, 0.4);\n',
    css
)
css = re.sub(
    r'\.splash-fade-out \{[^}]*\}',
    r'.splash-fade-out {\n  opacity: 0;\n  filter: blur(4px);\n  pointer-events: none;\n}',
    css
)

# 4. Game Cards
css = re.sub(
    r'\.game-card \{\s*border-radius: 18px !important;\s*overflow: hidden !important;\s*\}',
    r'.game-card {\n  border-radius: var(--radius-lg) !important;\n  overflow: hidden !important;\n}',
    css
)
css = re.sub(
    r'\.game-card \.card-poster-wrap,\s*\.game-card \.card-poster,\s*\.game-card img \{[^}]*\}',
    r'.game-card .card-poster-wrap,\n.game-card .card-poster,\n.game-card img {\n  border-radius: inherit;\n}',
    css
)

# 5. Carousel Stats
css = re.sub(r'\s*\.carousel-stat-pill,\s*\.tag-pill,', '', css)
css = re.sub(
    r'\.carousel-stat-pill\s*\{',
    r'.carousel-stat-pill,\n.tag-pill {\n  border-radius: var(--radius-md) !important;\n}\n\n.carousel-stat-pill {',
    css, count=1
)

# 6. Profile Popout Glassmorphism
css = re.sub(
    r'(\.arc-sidebar \.profile-popout \{[^}]*?)background: rgba\(16, 16, 16, 0\.96\);[^}]*?box-shadow: [^;]*;',
    r'\1background: rgba(16, 18, 27, 0.55);\n  backdrop-filter: blur(32px) saturate(1.8) brightness(1.15);\n  -webkit-backdrop-filter: blur(32px) saturate(1.8) brightness(1.15);\n  border-radius: 18px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.1);',
    css
)
css = re.sub(
    r'(\.profile-popout \{[^}]*?top: calc\(100% \+ 12px\);[^}]*?)background: rgba\(17, 20, 29, 0\.94\);[^}]*?border-radius: 18px;',
    r'\1background: rgba(17, 20, 29, 0.55);\n  backdrop-filter: blur(32px) saturate(1.8) brightness(1.15);\n  -webkit-backdrop-filter: blur(32px) saturate(1.8) brightness(1.15);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.1);\n  border-radius: 18px;',
    css
)

# 7. Remove aggressive border hiding that breaks glassmorphism
# We will just remove the specific block: "#settings-popout, .profile-popout, .settings-popout-compact ... border: none !important"
css = re.sub(r'#settings-popout,\s*\.profile-popout,\s*\.settings-popout-compact(?:,\s*\.profile-popout \*,\s*\.settings-popout-compact \*,\s*\.popout-arrow,\s*\.popout-arrow::before,\s*\.popout-arrow::after)?\s*\{[^}]*border:\s*none\s*!important;[^}]*\}', '', css)

# 8. Popout Arrows
css = re.sub(r'\.popout-arrow \{[^}]*\}', '.popout-arrow { display: none !important; }', css)
css = re.sub(r'\.arc-sidebar \.popout-arrow \{[^}]*\}', '.arc-sidebar .popout-arrow { display: none !important; }', css)

with open('c:/Users/sarux/Downloads/fps/src/style.css', 'w', encoding='utf-8') as f:
    f.write(css)
