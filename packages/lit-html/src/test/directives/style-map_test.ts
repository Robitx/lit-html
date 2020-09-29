/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {AttributePart, directive, html, render} from '../../lit-html.js';
import {StyleInfo, styleMap} from '../../directives/style-map.js';
import {assert} from '@esm-bundle/chai';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ua = window.navigator.userAgent;
const isChrome41 = ua.indexOf('Chrome/41') > 0;
const isIE = ua.indexOf('Trident/') > 0;
const testIfSupportsCSSVariables = (test: any) =>
  isIE || isChrome41 ? test.skip : test;

suite('styleMap', () => {
  let container: HTMLDivElement;

  function renderStyleMap(cssInfo: StyleInfo) {
    render(html`<div style="${styleMap(cssInfo)}"></div>`, container);
  }

  function renderStyleMapStatic(cssInfo: StyleInfo) {
    render(
      html`<div style="height: 1px; ${styleMap(cssInfo)} color: red"></div>`,
      container
    );
  }

  setup(() => {
    container = document.createElement('div');
  });

  test('render() only properties', () => {
    // Get the StyleMapDirective class indirectly, since it's not exported
    const result = styleMap({});
    const StyleMapDirective = result._$litDirective$;

    // Extend StyleMapDirective so we can test its render() method
    class TestStyleMapDirective extends StyleMapDirective {
      update(_part: AttributePart, [styleInfo]: Parameters<this['render']>) {
        return this.render(styleInfo);
      }
    }
    const testStyleMap = directive(TestStyleMapDirective);
    render(
      html`<div
        style=${testStyleMap({
          color: 'red',
          backgroundColor: 'blue',
          webkitAppearance: 'none',
          ['padding-left']: '4px',
        })}
      ></div>`,
      container
    );
    const div = container.firstElementChild as HTMLDivElement;
    const style = div.style;
    assert.equal(style.color, 'red');
    assert.equal(style.backgroundColor, 'blue');
    if ('webkitAppearance' in style) {
      assert.equal(style.webkitAppearance, 'none');
    }
    assert.equal(style.paddingLeft, '4px');
  });

  test('adds and updates properties', () => {
    renderStyleMap({marginTop: '2px', 'padding-bottom': '4px', opacity: '0.5'});
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.marginTop, '2px');
    assert.equal(el.style.paddingBottom, '4px');
    assert.equal(el.style.opacity, '0.5');
    renderStyleMap({marginTop: '4px', paddingBottom: '8px', opacity: '0.55'});
    assert.equal(el.style.marginTop, '4px');
    assert.equal(el.style.paddingBottom, '8px');
    assert.equal(el.style.opacity, '0.55');
  });

  test('removes properties', () => {
    renderStyleMap({marginTop: '2px', 'padding-bottom': '4px'});
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.marginTop, '2px');
    assert.equal(el.style.paddingBottom, '4px');
    renderStyleMap({});
    assert.equal(el.style.marginTop, '');
    assert.equal(el.style.paddingBottom, '');
  });

  test('works with static properties', () => {
    renderStyleMapStatic({marginTop: '2px', 'padding-bottom': '4px'});
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.height, '1px');
    assert.equal(el.style.color, 'red');
    assert.equal(el.style.marginTop, '2px');
    assert.equal(el.style.paddingBottom, '4px');
    renderStyleMapStatic({});
    assert.equal(el.style.height, '1px');
    assert.equal(el.style.color, 'red');
    assert.equal(el.style.marginTop, '');
    assert.equal(el.style.paddingBottom, '');
  });

  testIfSupportsCSSVariables(test)('adds and removes CSS variables', () => {
    renderStyleMap({'--size': '2px'});
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.getPropertyValue('--size'), '2px');
    renderStyleMap({'--size': '4px'});
    assert.equal(el.style.getPropertyValue('--size'), '4px');
    renderStyleMap({});
    assert.equal(el.style.getPropertyValue('--size'), '');
  });

  test('works when used with the same object', () => {
    const styleInfo = {marginTop: '2px', 'padding-bottom': '4px'};
    renderStyleMap(styleInfo);
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.marginTop, '2px');
    assert.equal(el.style.paddingBottom, '4px');
    styleInfo.marginTop = '6px';
    styleInfo['padding-bottom'] = '8px';
    renderStyleMap(styleInfo);
    assert.equal(el.style.marginTop, '6px');
    assert.equal(el.style.paddingBottom, '8px');
  });

  test('throws when used on non-style attribute', () => {
    assert.throws(() => {
      render(html`<div id="${styleMap({})}"></div>`, container);
    });
  });

  test('throws when used in attribute with more than 1 part', () => {
    assert.throws(() => {
      render(
        html`<div style="${'height: 2px;'} ${styleMap({})}"></div>`,
        container
      );
    });
  });

  test('throws when used in NodePart', () => {
    assert.throws(() => {
      render(html`<div>${styleMap({})}</div>`, container);
    });
  });
});
