# website

The website at pmnd.re.

It is plain static files, served as they are. There is no build step.

| File | What it is |
|---|---|
| `index.html` | The page: the name, the P, Poimandre, or The Vision, the works (pine, pinecone), and XVIII, which the right melody opens |
| `style.css` | Its look: the greys of the moodboard, one grid of twelve columns |
| `main.js` | What moves: the vowels of POIMANDRE, the P coming apart on scroll, the veiled text seen through the lens and the scan line |
| `sound.js` | The seventeen strips as notes of D Phrygian dominant: a square and a saw through a closing filter, an echo, a room, and now and then a glitch. Sound starts on the first click, tap or key |
| `fonts/` | Archivo and JetBrains Mono (SIL Open Font License, beside each) |
| `favicon.svg` | The P |

With reduced motion asked for, or without JavaScript, the page stands still and the text is plain.

To look at it locally:

```bash
python3 -m http.server 5310 --bind 127.0.0.1
```
