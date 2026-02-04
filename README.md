# 📁 Documentation Structure Guide

This guide explains how to organize the additional documentation files and assets for VibeCode.

## 📂 Recommended Folder Structure

```
Vibecode/
├── README.md                    # Main README (already created)
├── CONTRIBUTING.md              # Contribution guide (already created)
├── CHANGELOG.md                 # Version history (already created)
├── LICENSE                      # MIT License
├── CODE_OF_CONDUCT.md          # Community guidelines
├── SECURITY.md                  # Security policy
│
├── docs/                        # Documentation folder
│   ├── GETTING_STARTED.md      # Beginner guide
│   ├── BEST_PRACTICES.md       # Pro tips
│   ├── API_REFERENCE.md        # API documentation
│   ├── EXAMPLES.md             # Code examples
│   ├── ARCHITECTURE.md         # System design
│   ├── TESTING.md              # Testing guide
│   ├── RELEASE.md              # Release process
│   │
│   ├── demo.gif                # Main demo GIF (REQUIRED)
│   ├── metrics.svg             # Performance chart
│   │
│   ├── gifs/                   # Feature demonstration GIFs
│   │   ├── create-api.gif
│   │   ├── add-tests.gif
│   │   └── refactor.gif
│   │
│   ├── thumbnails/             # Video thumbnails
│   │   ├── intro.jpg
│   │   └── advanced.jpg
│   │
│   ├── logos/                  # Partner/platform logos
│   │   ├── hackernews.png
│   │   ├── producthunt.png
│   │   ├── github.png
│   │   ├── techcrunch.png
│   │   └── devto.png
│   │
│   └── sponsors/               # Sponsor logos
│       ├── anthropic.png
│       ├── openai.png
│       └── vercel.png
│
├── .github/                    # GitHub specific files
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
│
└── scripts/                    # Utility scripts
    ├── generate-demo.sh        # Create demo GIF
    └── update-stats.sh         # Update metrics
```

## 🎬 Creating Demo GIFs

### Requirements
- Terminal recording tool (asciinema, ttyrec, or Terminalizer)
- GIF converter (gifski, gifsicle)
- Clean terminal environment

### Best Practices for GIFs

1. **Main Demo (demo.gif)**
   - Duration: 30-60 seconds
   - Show: Installation → First command → Result
   - Resolution: 1000x600px
   - FPS: 10-15
   - File size: < 10MB

2. **Feature GIFs**
   - Duration: 10-20 seconds each
   - Show one feature clearly
   - Resolution: 600x400px
   - FPS: 10
   - File size: < 5MB each

### Recording with Terminalizer

```bash
# Install
npm install -g terminalizer

# Record
terminalizer record demo -c terminalizer-config.yml

# Edit if needed
terminalizer play demo

# Render to GIF
terminalizer render demo -o docs/demo.gif
```

### Recording with asciinema + agg

```bash
# Install
brew install asciinema
cargo install --git https://github.com/asciinema/agg

# Record
asciinema rec demo.cast

# Convert to GIF
agg demo.cast docs/demo.gif
```

### Recommended Settings

**terminalizer-config.yml**:
```yaml
command: bash
cwd: /path/to/vibecode
env:
  recording: true
cols: 100
rows: 30
repeat: 0
quality: 100
frameDelay: auto
maxIdleTime: 2000
frameBox:
  type: window
  title: VibeCode
  style:
    border: 0px
    boxShadow: none
    margin: 0px
watermark:
  imagePath: null
  style:
    position: absolute
    right: 15px
    bottom: 15px
    width: 100px
    opacity: 0.9
```

## 📊 Creating Metrics/Charts

### Using shields.io
Already included in README with dynamic badges.

### Custom SVG Charts
Create using Chart.js or D3.js, export as SVG:

```javascript
// Example with Chart.js
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['v0.5', 'v0.7', 'v0.9', 'v1.0'],
    datasets: [{
      label: 'Task Speed (seconds)',
      data: [120, 85, 65, 47]
    }]
  }
});
```

## 🖼️ Image Guidelines

### Logo Files
- Format: PNG with transparency
- Sizes: 
  - Small: 80x80px
  - Medium: 150x150px  
  - Large: 300x300px
- Background: Transparent
- File size: < 50KB each

### Screenshots
- Format: PNG or JPEG
- Resolution: 1920x1080 or 1440x900
- Compress before committing
- Use tools: TinyPNG, ImageOptim

### Thumbnails
- Format: JPEG
- Resolution: 1280x720 (16:9)
- Quality: 85%
- File size: < 200KB

## 📝 Documentation Files to Create

### 1. GETTING_STARTED.md
```markdown
# Getting Started with VibeCode

Complete beginner's guide covering:
- Installation (all methods)
- First-time setup
- Your first command
- Common use cases
- Troubleshooting
```

### 2. BEST_PRACTICES.md
```markdown
# VibeCode Best Practices

Professional tips including:
- Effective prompting
- Project organization
- Team workflows
- Performance optimization
- Security considerations
```

### 3. API_REFERENCE.md
```markdown
# API Reference

Complete API documentation:
- Core API
- AI Provider API
- CLI Commands
- Configuration Options
- Plugin System
```

### 4. EXAMPLES.md
```markdown
# Real-World Examples

Practical use cases:
- Building a REST API
- Creating microservices
- Adding authentication
- Database integration
- Testing strategies
```

## 🎨 Design Resources

### Color Palette
```css
/* VibeCode Brand Colors */
--primary: #A78BFA;      /* Purple */
--secondary: #22C55E;    /* Green */
--accent: #3B82F6;       /* Blue */
--dark: #181818;         /* Near Black */
--light: #F8FAFC;        /* Near White */
```

### Typography
- Headings: Fira Code, JetBrains Mono
- Body: -apple-system, system-ui
- Code: Fira Code, monospace

## 🔗 External Resources

### GIF Creation Tools
- [Terminalizer](https://terminalizer.com/) - Terminal recording
- [asciinema](https://asciinema.org/) - Terminal recording
- [LICEcap](https://www.cockos.com/licecap/) - Screen capture
- [gifski](https://gif.ski/) - GIF converter

### Image Optimization
- [TinyPNG](https://tinypng.com/) - PNG/JPEG compression
- [SVGOMG](https://jakearchibald.github.io/svgomg/) - SVG optimization
- [ImageOptim](https://imageoptim.com/) - Mac image optimizer

### Badge Generators
- [shields.io](https://shields.io/) - Custom badges
- [badgen.net](https://badgen.net/) - Fast badge generator

### Chart Libraries
- [Chart.js](https://www.chartjs.org/) - Simple charts
- [D3.js](https://d3js.org/) - Advanced visualizations
- [Recharts](https://recharts.org/) - React charts

## ✅ Checklist Before Launch

- [ ] Main demo.gif created (< 10MB)
- [ ] Feature GIFs created (3-5 demos)
- [ ] All logos collected and optimized
- [ ] Screenshots taken and compressed
- [ ] Documentation files written
- [ ] Links in README verified
- [ ] Images loading correctly on GitHub
- [ ] Mobile-friendly layout tested
- [ ] Social media preview working
- [ ] All badges displaying correctly

## 📱 Social Media Setup

### GitHub Social Preview
Create image: 1280x640px for README preview on social shares.

### Twitter Card
Add to repository settings for better Twitter previews.

## 🚀 Quick Start Script

```bash
#!/bin/bash
# setup-docs.sh - Quick documentation setup

# Create folder structure
mkdir -p docs/{gifs,thumbnails,logos,sponsors}

# Create placeholder files
touch docs/GETTING_STARTED.md
touch docs/BEST_PRACTICES.md
touch docs/API_REFERENCE.md
touch docs/EXAMPLES.md

echo "✓ Documentation structure created!"
echo "→ Add your GIFs to docs/demo.gif"
echo "→ Add feature demos to docs/gifs/"
echo "→ Update documentation files"
```

---

<div align="center">

**Need help?** Join our [Discord](https://discord.gg/vibecode) or check [GitHub Discussions](https://github.com/ArthurDS-tech/Vibecode/discussions)

</div>