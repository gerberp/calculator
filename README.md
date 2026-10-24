# Calculator

Open `index.html` in a browser. The calculator remains a standalone HTML file
supporting addition, subtraction, decimals, buttons, and keyboard input.

Consecutive operators replace the pending operator without evaluating it:
`2 + +` keeps `2`, and `2 + - 3 =` produces `-1`. Only single digits are
accepted as numeric keys; function keys such as `F1` are ignored.

## Regression tests

With Node.js 22 or newer, run from the repository root:

```sh
node --test tests/calculator.test.cjs
```

No package installation or build step is needed. The tests execute the actual
inline script from `index.html` using Node's built-in test runner and VM with a
minimal DOM stub. They exercise the registered button and keyboard handlers,
covering operator replacement, ignored keys, normal arithmetic, chaining,
decimals, clearing, and input after equals. They do not test browser layout or
native browser default actions.
