import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mainWorkspaceMock } from '../mocks/mainWorkspace.mock.js';
import { filterFormsByStatus, paginateForms, searchFormsByName, sortForms } from './formSelectors.js';

const referenceForms = mainWorkspaceMock.forms.slice(0, 8);

test('All includes all eight reference forms in their original order', () => {
  assert.deepEqual(filterFormsByStatus(referenceForms, 'all'), referenceForms);
  assert.equal(filterFormsByStatus(referenceForms).length, 8);
});

test('Published selects the six Live forms using the fixture status value', () => {
  assert.deepEqual(filterFormsByStatus(referenceForms, 'published').map(form => form.id), [
    'lead-capture', 'job-application', 'customer-feedback', 'event-rsvp', 'support-request', 'contact-us',
  ]);
});

test('Drafts selects only the two draft forms', () => {
  assert.deepEqual(filterFormsByStatus(referenceForms, 'draft').map(form => form.id), [
    'newsletter-signup', 'new-form',
  ]);
});

test('Empty input and a status with no matching records return empty lists', () => {
  for (const status of ['all', 'published', 'draft']) {
    assert.deepEqual(filterFormsByStatus([], status), []);
  }
  assert.deepEqual(filterFormsByStatus(referenceForms.slice(0, 6), 'draft'), []);
  assert.deepEqual(filterFormsByStatus(referenceForms.slice(6), 'published'), []);
});

test('Repeated filtering leaves frozen input records, their order, and nested data unchanged', () => {
  const forms = structuredClone(referenceForms);
  const original = structuredClone(forms);
  const freeze = value => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
  };
  freeze(forms);

  for (const status of ['published', 'draft', 'all', 'draft', 'published']) {
    const result = filterFormsByStatus(forms, status);
    assert.deepEqual(forms, original);
    assert.ok(result.every(form => forms.includes(form)));
  }
});

test('Name search ignores case and surrounding whitespace, and searches names only', () => {
  assert.deepEqual(searchFormsByName(referenceForms, '  JOB APPLication  ').map(form => form.id), ['job-application']);
  assert.deepEqual(searchFormsByName(referenceForms, 'new').map(form => form.id), ['newsletter-signup', 'new-form']);
  assert.deepEqual(searchFormsByName(referenceForms, 'CRM'), []);
  assert.deepEqual(searchFormsByName(referenceForms, 'no matches'), []);
});

test('Blank search preserves every record in input order; empty input remains empty', () => {
  assert.deepEqual(searchFormsByName(referenceForms), referenceForms);
  assert.deepEqual(searchFormsByName(referenceForms, '   '), referenceForms);
  assert.deepEqual(searchFormsByName([], 'form'), []);
});

test('Newest-first uses fixed timestamps to retain the reference order; oldest-first reverses it', () => {
  const originalIds = referenceForms.map(form => form.id);
  assert.deepEqual(sortForms(referenceForms).map(form => form.id), originalIds);
  assert.deepEqual(sortForms(referenceForms, 'updated-asc').map(form => form.id), [...originalIds].reverse());
  assert.ok(referenceForms.every(form => Number.isFinite(Date.parse(form.updatedAt))));
});

test('Form names sort in both alphabetical directions', () => {
  const ascending = ['contact-us', 'customer-feedback', 'event-rsvp', 'job-application', 'lead-capture', 'new-form', 'newsletter-signup', 'support-request'];
  assert.deepEqual(sortForms(referenceForms, 'name-asc').map(form => form.id), ascending);
  assert.deepEqual(sortForms(referenceForms, 'name-desc').map(form => form.id), [...ascending].reverse());
});

test('Response sorts keep missing counts after numeric counts in either direction', () => {
  const missing = ['new-form', 'newsletter-signup'];
  const ascending = ['contact-us', 'job-application', 'lead-capture', 'support-request', 'event-rsvp', 'customer-feedback'];
  assert.deepEqual(sortForms(referenceForms, 'responses-asc').map(form => form.id), [...ascending, ...missing]);
  assert.deepEqual(sortForms(referenceForms, 'responses-desc').map(form => form.id), [...ascending].reverse().concat(missing));
  const counts = [{ id: 'missing', responses: undefined }, { id: 'zero', responses: 0 }, { id: 'positive', responses: 1 }];
  assert.deepEqual(sortForms(counts, 'responses-asc').map(form => form.id), ['zero', 'positive', 'missing']);
  assert.deepEqual(sortForms(counts, 'responses-desc').map(form => form.id), ['positive', 'zero', 'missing']);
});

test('Equal values use ID ascending as a tie-breaker in every sort direction', () => {
  const forms = ['z', 'a', 'm'].map(id => ({ id, name: 'Same name', updatedAt: '2026-01-01T12:00:00.000Z', responses: 8 }));
  for (const order of ['updated-desc', 'updated-asc', 'name-asc', 'name-desc', 'responses-desc', 'responses-asc']) {
    assert.deepEqual(sortForms(forms, order).map(form => form.id), ['a', 'm', 'z']);
    assert.deepEqual(sortForms([], order), []);
  }
  const names = [{ id: 'b', name: 'alpha' }, { id: 'a', name: 'ALPHA' }];
  assert.deepEqual(sortForms(names, 'name-asc').map(form => form.id), ['a', 'b']);
});

test('Status, name search, and sorting compose without changing deeply frozen fixtures', () => {
  const forms = structuredClone(referenceForms);
  const original = structuredClone(forms);
  const freeze = value => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
  };
  freeze(forms);
  for (const order of ['updated-desc', 'updated-asc', 'name-asc', 'name-desc', 'responses-desc', 'responses-asc']) {
    sortForms(forms, order);
    const result = sortForms(searchFormsByName(filterFormsByStatus(forms, 'draft'), ' NEW '), order);
    assert.equal(result.length, 2);
    assert.ok(result.every(form => forms.includes(form)));
    assert.deepEqual(forms, original);
  }
  const visible = sortForms(searchFormsByName(filterFormsByStatus(forms, 'published'), 'c'), 'responses-desc');
  assert.deepEqual(visible.map(form => form.id), ['customer-feedback', 'lead-capture', 'job-application', 'contact-us']);
});

test('Expanded fixtures contain 24 stable IDs and keep the reference forms newest', () => {
  const forms = mainWorkspaceMock.forms;
  assert.equal(forms.length, 24);
  assert.equal(new Set(forms.map(form => form.id)).size, 24);
  assert.deepEqual(sortForms(forms).slice(0, 8), referenceForms);
  assert.equal(filterFormsByStatus(forms, 'published').length, 14);
  assert.equal(filterFormsByStatus(forms, 'draft').length, 10);
  for (const form of forms.slice(8)) {
    assert.match(form.id, /^demo-form-\d{2}$/);
    assert.match(form.name, /^Demo form /);
    assert.ok(Date.parse(form.updatedAt) < Date.parse(referenceForms[7].updatedAt));
    assert.deepEqual(Object.keys(form).sort(), Object.keys(referenceForms[0]).sort());
  }
});

test('Three eight-row pages retain the full count and cover every record exactly once', () => {
  const forms = sortForms(mainWorkspaceMock.forms);
  const pages = [1, 2, 3].map(page => paginateForms(forms, page, 8));
  for (const [index, result] of pages.entries()) {
    assert.equal(result.currentPage, index + 1);
    assert.equal(result.pageCount, 3);
    assert.equal(result.totalCount, 24);
    assert.equal(result.visibleForms.length, 8);
    assert.deepEqual(result.range, { start: index * 8 + 1, end: (index + 1) * 8 });
  }
  assert.deepEqual(pages.flatMap(page => page.visibleForms), forms);
  assert.deepEqual(paginateForms(forms), pages[0]);
});

test('All supported page sizes report accurate final pages and ranges', () => {
  const forms = mainWorkspaceMock.forms;
  for (const [size, pageCount, lastStart, lastLength] of [[8, 3, 17, 8], [16, 2, 17, 8], [24, 1, 1, 24]]) {
    const result = paginateForms(forms, pageCount, size);
    assert.equal(result.pageCount, pageCount);
    assert.equal(result.visibleForms.length, lastLength);
    assert.deepEqual(result.range, { start: lastStart, end: 24 });
  }
});

test('Page bounds are clamped; invalid page numbers fall back to page one', () => {
  const forms = mainWorkspaceMock.forms;
  for (const page of [-10, 0, NaN, 1.5]) {
    assert.equal(paginateForms(forms, page).currentPage, 1);
  }
  assert.equal(paginateForms(forms, 99).currentPage, 3);
  for (const size of [0, -1, 1.5, NaN]) {
    assert.throws(() => paginateForms(forms, 1, size), RangeError);
  }
});

test('Zero matches have no pages or rows and show the 0–0 range', () => {
  for (const size of [8, 16, 24]) {
    assert.deepEqual(paginateForms([], 3, size), {
      visibleForms: [], totalCount: 0, currentPage: 1, pageCount: 0, range: { start: 0, end: 0 },
    });
  }
});

test('Status, search, and sorting run before slicing and retain matching totals', () => {
  const drafts = sortForms(filterFormsByStatus(mainWorkspaceMock.forms, 'draft'));
  assert.deepEqual(paginateForms(drafts, 2).range, { start: 9, end: 10 });
  assert.equal(paginateForms(drafts, 2).totalCount, 10);
  const live = sortForms(filterFormsByStatus(mainWorkspaceMock.forms, 'published'));
  assert.deepEqual(paginateForms(live, 2).range, { start: 9, end: 14 });
  const matching = sortForms(searchFormsByName(drafts, ' FoRm '));
  const result = paginateForms(matching, 2);
  assert.equal(result.totalCount, 9);
  assert.equal(result.pageCount, 2);
  assert.deepEqual(result.range, { start: 9, end: 9 });
  assert.deepEqual(result.visibleForms.map(form => form.id), ['demo-form-16']);
  const alphabetical = sortForms(searchFormsByName(mainWorkspaceMock.forms, 'demo form'), 'name-asc');
  assert.deepEqual(paginateForms(alphabetical, 2).visibleForms.map(form => form.id),
    Array.from({ length: 8 }, (_, index) => `demo-form-${String(index + 9).padStart(2, '0')}`));
});

test('The complete pipeline leaves expanded frozen fixtures and nested data unchanged', () => {
  const forms = structuredClone(mainWorkspaceMock.forms);
  const original = structuredClone(forms);
  function freeze(value) {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
  }
  freeze(forms);
  for (const status of ['all', 'published', 'draft']) {
    for (const order of ['updated-desc', 'updated-asc', 'name-asc', 'name-desc', 'responses-desc', 'responses-asc']) {
      const matching = sortForms(searchFormsByName(filterFormsByStatus(forms, status), 'form'), order);
      for (const size of [8, 16, 24]) {
        const result = paginateForms(matching, 99, size);
        assert.ok(result.visibleForms.every(form => forms.includes(form)));
        assert.notEqual(result.visibleForms, matching);
        assert.deepEqual(forms, original);
      }
    }
  }
});

test('Combined browsing preserves complete expected results across every page size', () => {
  const cases = [
    { status: 'draft', query: ' NEW ', order: 'name-asc', ids: ['new-form', 'newsletter-signup'] },
    { status: 'published', query: ' DEMO FORM ', order: 'responses-asc', ids: [3, 13, 7, 1, 9, 5, 15, 11].map(n => `demo-form-${String(n).padStart(2, '0')}`) },
    { status: 'all', query: 'demo form', order: 'name-desc', ids: Array.from({ length: 16 }, (_, i) => `demo-form-${String(16 - i).padStart(2, '0')}`) },
    { status: 'draft', query: 'demo', order: 'responses-desc', ids: Array.from({ length: 8 }, (_, i) => `demo-form-${String((i + 1) * 2).padStart(2, '0')}`) },
  ];
  for (const { status, query, order, ids } of cases) {
    const matching = sortForms(searchFormsByName(filterFormsByStatus(mainWorkspaceMock.forms, status), query), order);
    for (const size of [8, 16, 24]) {
      const pages = Array.from({ length: Math.ceil(ids.length / size) }, (_, i) => paginateForms(matching, i + 1, size));
      assert.deepEqual(pages.flatMap(page => page.visibleForms.map(form => form.id)), ids);
      assert.ok(pages.every(page => page.totalCount === ids.length));
    }
  }
});

test('Empty sources and zero-match pipelines remain valid for all browsing controls', () => {
  for (const source of [[], mainWorkspaceMock.forms]) {
    for (const status of ['all', 'published', 'draft']) {
      for (const order of ['updated-desc', 'updated-asc', 'name-asc', 'name-desc', 'responses-desc', 'responses-asc']) {
        const matching = sortForms(searchFormsByName(filterFormsByStatus(source, status), 'no matching form exists'), order);
        for (const size of [8, 16, 24]) {
          const result = paginateForms(matching, 3, size);
          assert.deepEqual(result, { visibleForms: [], totalCount: 0, currentPage: 1, pageCount: 0, range: { start: 0, end: 0 } });
        }
      }
    }
  }
  const published = filterFormsByStatus(mainWorkspaceMock.forms, 'published');
  const result = paginateForms(sortForms(published), 3, 8);
  assert.equal(result.currentPage, 2);
  assert.deepEqual(result.range, { start: 9, end: 14 });
  assert.equal(result.visibleForms.length, 6);
});

test('Missing metrics stay last across page boundaries with deterministic equal-value ordering', () => {
  const forms = Object.freeze([
    Object.freeze({ id: 'missing-b', responses: undefined }),
    Object.freeze({ id: 'numeric-b', responses: 4 }),
    Object.freeze({ id: 'missing-a', responses: null }),
    Object.freeze({ id: 'zero', responses: 0 }),
    Object.freeze({ id: 'numeric-a', responses: 4 }),
    Object.freeze({ id: 'missing-c', responses: NaN }),
  ]);
  for (const [order, numericIds] of [
    ['responses-asc', ['zero', 'numeric-a', 'numeric-b']],
    ['responses-desc', ['numeric-a', 'numeric-b', 'zero']],
  ]) {
    const sorted = sortForms(forms, order);
    assert.deepEqual(paginateForms(sorted, 1, 3).visibleForms.map(form => form.id), numericIds);
    assert.deepEqual(paginateForms(sorted, 2, 3).visibleForms.map(form => form.id), ['missing-a', 'missing-b', 'missing-c']);
    assert.equal(forms[0].id, 'missing-b');
  }
});

test('Long form names remain intact through normalized search, sorting, and pagination', () => {
  const name = `Demo ${'long form name '.repeat(40)}ending`;
  const forms = Object.freeze([Object.freeze({ id: 'long-name', name })]);
  const matching = sortForms(searchFormsByName(filterFormsByStatus(forms), '  FORM NAME  '), 'name-desc');
  assert.equal(paginateForms(matching).visibleForms[0].name, name);
  assert.equal(forms[0].name, name);
});
