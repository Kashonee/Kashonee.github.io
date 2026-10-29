// Keyboard/menu behaviour with DOM doubles; not a visual browser test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Element {
  constructor() { this.attrs = {}; this.events = {}; this.classes = new Set(); this.focused = false; this.children = []; }
  get classList() { return { contains: c => this.classes.has(c), remove: c => this.classes.delete(c), add: c => this.classes.add(c) }; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(k, fn) { (this.events[k] ||= []).push(fn); }
  emit(k, e = {}) { (this.events[k] || []).forEach(fn => fn({ target: this, ...e })); }
  contains(el) { return this === el || this.children.includes(el); }
  focus() { this.focused = true; }
  closest(selector) { return selector === this.selector ? this : null; }
  append(el) { this.children.push(el); }
  querySelector() { return this.children.find(el => el.className === 'image-unavailable') || null; }
}
const nav = new Element(), toggle = new Element(), outside = new Element(), link = new Element();
toggle.setAttribute('aria-expanded', 'false');
nav.children.push(link);
link.selector = 'a';
const tabs = Array.from({ length: 4 }, () => new Element());
tabs.forEach((el, i) => { el.selector = '.segmented [role="tab"]'; el.setAttribute('aria-selected', i === 0); });
const filters = [new Element(), new Element()];
filters[0].classes.add('active');
filters.forEach(el => { el.selector = '[data-filter]'; });
const media = { matches: true, addEventListener(_, fn) { this.changed = fn; } };
const document = new Element();
document.getElementById = id => ({ mainNav: nav, menuToggle: toggle })[id];
document.querySelectorAll = selector => selector.includes('[role="tab"]') ? tabs : selector === '[data-filter]' ? filters : [];
// Existing base app owns menu and tab clicks; presentation hooks run after it.
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', open);
  open ? nav.classes.add('open') : nav.classes.delete('open');
});
tabs.forEach(el => { el.click = () => {
  tabs.forEach(other => other.setAttribute('aria-selected', other === el));
  document.emit('click', { target: el });
}; });
vm.runInNewContext(fs.readFileSync(require.resolve('../ui.js'), 'utf8'), { document, window: { matchMedia: () => media } });
assert.equal(nav.inert, true);
toggle.emit('click');
assert.equal(nav.inert, false);
assert.equal(toggle.getAttribute('aria-label'), 'Мәзірді жабу');
document.emit('keydown', { key: 'Escape' });
assert.equal(toggle.getAttribute('aria-expanded'), 'false');
assert.equal(nav.inert, true);
assert.equal(toggle.focused, true);
toggle.emit('click');
document.emit('click', { target: link });
assert.equal(toggle.getAttribute('aria-expanded'), 'true', 'Clicks inside the menu do not trigger outside dismissal');
document.emit('click', { target: outside });
assert.equal(toggle.getAttribute('aria-expanded'), 'false');
toggle.emit('click');
document.emit('focusin', { target: outside });
assert.equal(nav.inert, true);
media.matches = false; media.changed();
assert.equal(nav.inert, false, 'Desktop menu remains keyboard accessible');
media.matches = true; media.changed();
assert.equal(nav.inert, true, 'Returning to mobile closes the menu');
let prevented = false;
tabs[0].emit('keydown', { key: 'ArrowLeft', preventDefault() { prevented = true; } });
assert.equal(prevented, true);
assert.equal(tabs[3].getAttribute('aria-selected'), 'true');
assert.equal(tabs[3].tabIndex, 0);
assert.equal(tabs[0].tabIndex, -1);
assert.equal(tabs[3].focused, true);
tabs[3].emit('keydown', { key: 'Home', preventDefault() {} });
assert.equal(tabs[0].tabIndex, 0);
tabs[0].emit('keydown', { key: 'End', preventDefault() {} });
assert.equal(tabs[3].tabIndex, 0);
filters[0].classes.delete('active'); filters[1].classes.add('active');
document.emit('click', { target: filters[1] });
assert.equal(filters[0].getAttribute('aria-pressed'), 'false');
assert.equal(filters[1].getAttribute('aria-pressed'), 'true');
console.log('PASS: mobile Escape/outside/focus dismissal, focus restoration, responsive inert state, route keyboard tabs and filter accessibility state.');
