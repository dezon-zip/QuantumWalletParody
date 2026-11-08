# ReNest One

**Live:** https://dezon-zip.github.io/QuantumWalletParody/

A scroll-driven parody landing page for **ReNest One**, an imaginary piece of hardware that
runs your React client and your NestJS server in one hexagonal shell, complete with a
"7-hook quantum chip". None of it is real. There's no device and no waitlist, and the page
says so at the end.

It's a tribute to the [Quantum Wallet](https://quantumwallet.14islands.com/) site by
[14islands](https://14islands.com/): one 3D device stays pinned in the middle of the screen
while you scroll, and the scroll position drives everything else:

- the device's pose, a wireframe/blueprint view, an exploded view, a red "guard" alarm mode,
  and a lid that opens to show a glowing crystal
- a background that flips from dark to white and back
- a ruler on the left showing the bundle size shrinking from 1.44 MB to 0 kB
- overlay panels, a typewriter headline, and a phone mockup with an animated admin dashboard
  (fake Cloudflare and Google stats)

## Tech

- **[three.js](https://threejs.org/)** (r128) for the device, built entirely in code: extruded
  hexagon geometry, physical materials, a custom GLSL shader for the crystals, and canvas
  textures for the lid display
- **Vanilla JavaScript** (ES modules), no framework. A keyframe timeline with Hermite-spline
  tracks maps scroll progress to every animated value
- **Plain CSS**, split per section
- **Canvas 2D** for the starfield and the lid readout
- **Web Audio API** for the little boot chord
- **[Vite](https://vite.dev/)** for the dev server and build
- **ESLint** and **Prettier**
- Fonts: Sora, Outfit and JetBrains Mono from Google Fonts

## The story

I first saw the real Quantum Wallet site about two years ago and it stuck with me. It felt
like the page itself was a product: you scroll and the device turns, comes apart, and tells
you its story. I really wanted to understand how something like that is put together.

Over the last couple of days I started trying to rebuild pieces of it, one element at a time:
first the pinned device, then the scroll timeline, the dark-to-white flip, the ruler, the
overlays. I didn't plan to make a full site. At some point I looked at what I had and
realised I'd done almost everything, so I turned it into its own thing (a parody about my
own stack instead of a crypto wallet), ported it from a single HTML file to a proper Vite
project, and put it up here.

## Running it

```bash
npm install
npm run dev       # local dev server
npm run build     # production build into docs/
npm run preview   # serve the build locally
npm run lint
```

GitHub Pages serves the `docs/` folder from `main`, so run `npm run build` and commit `docs/`
whenever you change something.

## Project structure

```
index.html            markup for every section and overlay
src/
  main.js             wires everything up and runs the frame loop
  timeline.js         scroll keyframes and overlay timing
  utils/math.js       easing, ramps, spline tracks
  scene/              three.js: renderer, lights, geometry, device, crystal, lid readout
  ui/                 intro, headline, ruler, overlays, dashboard, starfield, sound
  styles/             CSS per section
public/               favicon
docs/                 built site (GitHub Pages)
```

## Credits

Motion and concept inspired by [Quantum Wallet](https://quantumwallet.14islands.com/) by
[14islands](https://14islands.com/). This is a fan-made parody and isn't affiliated with them.
React and NestJS are real, and well worth building with.
