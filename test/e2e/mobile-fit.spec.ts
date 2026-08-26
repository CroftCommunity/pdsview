import { expect, test } from '@playwright/test';

// Mobile-first, tap-first: nothing may overflow horizontally on a phone.
// Workspace standard — canonical in croft-pwa/docs/MOBILE-FIRST.md, index at
// CroftC/.claude/MOBILE-FIRST.md.
//
// Widths: 320 = small Android / older iPhone (the one that actually breaks),
// 360 = common Android, 390 = modern iPhone.
//
// documentElement.scrollWidth is SOUND here: app.css:231 uses `overflow-x: auto`
// on the wide JSON panel, which scrolls its own content rather than clipping it,
// so a bleed still reaches the document. If that ever becomes `hidden` or `clip`,
// this assertion silently stops being able to fail and must switch to per-element
// getBoundingClientRect — canonical doc, § "Measuring overflow".
const WIDTHS = [320, 360, 390];

for (const width of WIDTHS) {
  test(`no horizontal overflow: shell at ${width}px`, async ({ page }) => {
    await page.route('**/*', (route) => {
      const host = new URL(route.request().url()).hostname;
      if (host === 'localhost' || host === '127.0.0.1') void route.continue();
      else void route.abort();
    });
    await page.setViewportSize({ width, height: 780 });
    await page.goto('/');
    await expect(page.locator('.wordmark')).toHaveText('pdsview');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    // <=1 absorbs sub-pixel rounding; a real bleed is tens of pixels.
    expect(overflow, `shell @ ${width}px overflows by ${overflow}px`).toBeLessThanOrEqual(1);
  });
}

// A long unbroken token is the classic culprit — pdsview's input takes DIDs and
// at:// URIs, which are exactly that shape. Tame content would pass forever.
test('a pasted at:// URI does not widen the layout at 320px', async ({ page }) => {
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host === 'localhost' || host === '127.0.0.1') void route.continue();
    else void route.abort();
  });
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/');
  await page
    .getByRole('textbox')
    .fill('at://did:plc:aaaaaaaaaaaaaaaaaaaaaaaa/app.bsky.feed.post/3kzzzzzzzzzzzzzzzzzzzzzz');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `long at:// URI overflows by ${overflow}px`).toBeLessThanOrEqual(1);
});

// Touch targets: >=44x44 CSS px (WCAG 2.5.5, the workspace floor), on the PADDED
// hit area — for an icon-only control the fix is padding, not a bigger glyph.
//
// WCAG 2.5.5's INLINE EXCEPTION is implemented, not worked around: a target "in a
// sentence or block of text" is exempt, because padding it to 44px breaks the flow
// it lives in. Without this the check flags pdsview's two footer links (55x22 and
// 122x22, both inline beside separator text) — correct markup failing a wrong
// check, which is how a gate gets muted. Standalone controls are NOT exempt.
test('interactive controls clear the 44px tap floor on a phone', async ({ page }) => {
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host === 'localhost' || host === '127.0.0.1') void route.continue();
    else void route.abort();
  });
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await expect(page.locator('.wordmark')).toHaveText('pdsview');

  const undersized = await page.evaluate(() => {
    const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button]';
    const inlineInText = (el: Element): boolean =>
      el.tagName === 'A' &&
      (el.parentElement?.textContent ?? '').trim().length > (el.textContent ?? '').trim().length;
    return Array.from(document.querySelectorAll(sel))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.height < 44 && !inlineInText(el);
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        const cls = el instanceof HTMLElement && el.className ? `.${el.className.split(' ')[0]}` : '';
        return `${el.tagName.toLowerCase()}${cls} ${Math.round(r.width)}×${Math.round(r.height)}`;
      });
  });
  expect(undersized, undersized.join(' · ')).toEqual([]);
});
