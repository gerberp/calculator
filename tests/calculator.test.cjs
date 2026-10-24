const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// Run the real inline script with only the DOM surface it uses.
function calculator(input) {
  const display = { value: '0' };
  const buttons = [...html.matchAll(/<button\b[^>]*>(.*?)<\/button>/g)]
    .map((match) => ({ textContent: match[1] }));
  const listeners = {};
  runInNewContext(script, { document: {
    getElementById: () => display,
    querySelectorAll: () => buttons,
    addEventListener: (type, callback) => { listeners[type] = callback; },
  } });
  return {
    press(key) {
      if (input === 'keyboard') listeners.keydown({ key });
      else buttons.find((button) => button.textContent === key).onclick();
      return display.value;
    },
  };
}

const cases = [
  ['repeated plus keeps the first operand', ['2', '+', '+'], '2'],
  ['switching plus to minus', ['2', '+', '-', '3', '='], '-1'],
  ['switching minus to plus', ['2', '-', '+', '3', '='], '5'],
  ['repeated minus', ['2', '-', '-', '3', '='], '-1'],
  ['addition', ['1', '2', '+', '3', '='], '15'],
  ['subtraction', ['2', '-', '3', '='], '-1'],
  ['chained operations', ['2', '+', '3', '-', '1', '='], '4'],
  ['operator replacement after a subtotal', ['2', '+', '3', '-', '+', '4', '='], '9'],
  ['decimal right operand', ['2', '+', '.', '5', '='], '2.5'],
  ['duplicate decimal point', ['1', '.', '.', '5', '-', '.', '2', '='], '1.3'],
  ['continue after equals', ['2', '+', '3', '=', '-', '1', '='], '4'],
  ['new number after equals', ['2', '+', '3', '=', '7'], '7'],
  ['clear pending operation', ['2', '+', 'C', '3', '='], '3'],
];

for (const input of ['buttons', 'keyboard']) {
  for (const [name, keys, expected] of cases) {
    test(`${input}: ${name}`, () => {
      const calc = calculator(input);
      let actual;
      for (const key of keys) actual = calc.press(key);
      assert.equal(actual, expected);
    });
  }
}

test('keyboard: function keys and unsupported keys leave pending input intact', () => {
  const calc = calculator('keyboard');
  assert.equal(calc.press('F1'), '0');
  calc.press('2');
  calc.press('+');
  for (const key of ['F1', 'F10', 'F12', 'ArrowLeft', 'a', '12']) {
    assert.equal(calc.press(key), '2', key);
  }
  calc.press('3');
  assert.equal(calc.press('Enter'), '5');
});

test('keyboard: Escape clears and Enter evaluates', () => {
  const calc = calculator('keyboard');
  calc.press('2');
  calc.press('+');
  assert.equal(calc.press('Escape'), '0');
  for (const key of ['4', '-', '1']) calc.press(key);
  assert.equal(calc.press('Enter'), '3');
});
