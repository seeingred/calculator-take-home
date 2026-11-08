# Calculator

A small calculator web page built with **Vue 3** and **Vite**, served as static
files by unprivileged nginx on port **8080**.

Two numbers, one of `+ - % *`, and a `=` button. The result is rounded to at most
2 decimal places and shown as a plain number (`0.1 + 0.2` → `0.3`).

## Run it

With Docker:

```sh
docker build -t calculator .
docker run --rm -p 8080:8080 calculator
# open http://localhost:8080/
```

Run only the tests (the build fails if a test fails):

```sh
docker build --target test .
```

Without Docker (Node 20.19+ or 22+):

```sh
npm ci
npm test        # unit + component tests (Vitest)
npm run dev     # dev server at http://localhost:5173/
npm run build   # production build in dist/
```

## How it works

- `src/calc.js` holds the maths, and the UI never touches it directly.
  Each input is parsed from its decimal string into an exact scaled integer
  (`BigInt` units plus a decimal scale, so `-12.5` becomes `-125 / 10¹`). `+`,
  `-`, `*` and `%` are all exact in that form, so floating-point errors such as
  `0.30000000000000004` never appear. The only rounding is the final one to 2
  decimals, half away from zero.
- `%` is the remainder with the sign of the first number, as in JavaScript,
  C, Java and Go (`-7 % 3 = -1`, `7.5 % 2 = 1.5`). Because it is exact,
  `0.3 % 0.1` is `0`. JavaScript's own float `%` gives `0.0999…` for that.
- `src/App.vue` is the form. Clicking the button submits the form, and
  `@submit.prevent` stops the page from navigating or reloading. The inputs
  keep the raw strings from the browser rather than using `v-model`, which
  would cast `type="number"` values to floats.
- Invalid input (an empty field, `%` by zero) leaves the result field empty
  and shows a message below the form.

## Tests

- `tests/calc.test.js` covers the brief's examples, each operation's edge
  cases (signs, decimals, ±1,000,000 bounds, rounding, no exponent notation),
  parsing, formatting and invalid input.
- `tests/App.test.js` mounts the component and checks the required ids,
  option values, that the result appears only after clicking, and that the
  form submit is prevented.

## Container

The image has three steps: `deps` (npm ci), then `test` (vitest), then `build`
(vite build, which starts from `test`, so an image with failing tests can't be
built). The image that runs is `nginxinc/nginx-unprivileged`. It listens on
`0.0.0.0:8080`, needs no Linux capabilities or network access, and works under
any non-root UID. Everything it serves is bundled at build time.
