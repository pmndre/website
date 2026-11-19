# website

The website at pmnd.re.

It is plain static files, served as they are. There is no build step.

| File | What it is |
|---|---|
| `index.html` | The page: the name, the P, Poimandre, or The Vision, the works (pine, pinecone), and XVIII, the ascent through the seven spheres, which the right melody opens |
| `style.css` | Its look: the greys of the moodboard, one grid of twelve columns |
| `main.js` | What moves: the vowels of POIMANDRE, the P coming apart on scroll, the veiled text seen through the lens and the scan line |
| `sound.js` | The seventeen strips as notes of D Phrygian dominant: a square and a saw through a closing filter, an echo, a room, and now and then a glitch; the chord of the ascent and its light. Sound starts on the first click, tap or key |
| `fonts/` | Archivo and JetBrains Mono (SIL Open Font License, beside each) |
| `favicon.svg` | The P |

With reduced motion asked for, or without JavaScript, the page stands still and the text is plain.

To look at it locally:

```bash
python3 -m http.server 5310 --bind 127.0.0.1
```

The page names its stylesheet and scripts with a version (`?v=5` in `index.html`, and on the import of `sound.js` in `main.js`): pmnd.re lets browsers keep them for four hours, so raise it with every change to them.
