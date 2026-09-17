import { test as base, expect } from '@playwright/test';

// Optionally reuse an installed browser opened with a dedicated CDP test profile.
const test = base.extend({
  browser: [async ({ playwright }, use) => {
    const browser = process.env.PW_CDP_ENDPOINT
      ? await playwright.chromium.connectOverCDP(process.env.PW_CDP_ENDPOINT)
      : await playwright.chromium.launch();
    await use(browser);
    await browser.close();
  }, { scope: 'worker' }],
});

test('fixture exploration, documentation, and pending controls stay coherent', async ({ page }, testInfo) => {
  const errors = [];
  const writes = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
  await page.goto('/');
  await expect(page.getByRole('button', {name:'Start synthetic case'})).toBeVisible();
  await page.locator('[data-filter="escalated"]').click();
  await expect(page.locator('[data-case="TC-F01"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.detail-heading')).toContainText('TC-F01');
  await expect(page.locator('.question-block')).toContainText('900,000');
  await page.getByRole('tab',{name:'Review',exact:true}).click();
  for (const name of ['Approve','Reject','Pause','Resume','Undo','Record override']) {
    await expect(page.getByRole('button',{name,exact:true})).toBeDisabled();
  }
  await page.getByRole('tab',{name:'Audit',exact:true}).click();
  await expect(page.getByRole('heading',{name:'No audit events yet'})).toBeVisible();
  await page.goto('/#/verify');
  await expect(page.getByRole('button',{name:'Run Verify'})).toBeDisabled();
  await expect(page.getByRole('cell',{name:'Not run',exact:true})).toHaveCount(5);
  await page.goto('/#/docs');
  await page.getByRole('searchbox').fill('07-architecture');
  await expect(page.locator('.doc-nav-item')).toHaveCount(1);
  await page.locator('.doc-nav-item').click();
  await expect(page.locator('.markdown')).toContainText('Adopted target architecture');
  await page.goto('/#/settings');
  await page.getByRole('button',{name:'Model API'}).click();
  await expect(page.getByRole('button',{name:'Save configuration'})).toBeDisabled();
  await expect(page.locator('.secret-placeholder')).toContainText('does not accept, store or transmit API keys');
  for (const route of ['workspace','verify','docs','architecture','settings']) {
    await page.goto(`/#/${route}`);
    await expect(page.locator('.page-heading h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} should not overflow`).toBe(true);
  }
  await page.goto('/#/workspace');
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({path:`../.local/ui-checks/${testInfo.project.name}-workspace.png`,fullPage:true,animations:'disabled'});
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
});

test('draft dialog validates, previews safely, and restores keyboard focus', async ({ page }, testInfo) => {
  await page.goto('/');
  const start = page.getByRole('button',{name:'Start synthetic case'});
  await start.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.getByRole('button',{name:'Preview draft'}).click();
  await expect(page.locator('#task-or-event')).toBeFocused();
  await expect(page.locator('#task-or-event')).toHaveAttribute('aria-invalid','true');
  await page.locator('#task-or-event').fill('Synthetic orientation');
  await page.locator('#purpose').fill('<img src=x onerror=alert(1)> synthetic printing');
  await page.locator('#budget-reference').fill('BUDGET-SYN-001');
  await page.locator('#total-vnd').fill('850000');
  await page.locator('#evidence-reference').fill('INVOICE-SYN-001');
  await page.getByRole('radio',{name:'Advance settlement'}).check();
  await page.getByRole('button',{name:'Preview draft'}).click();
  await expect(page.locator('#advance-reference')).toBeFocused();
  await page.locator('#advance-reference').fill('ADVANCE-SYN-001');
  await page.locator('#advance-amount-vnd').fill('1000000');
  await page.getByRole('button',{name:'Preview draft'}).click();
  await expect(page.locator('[data-preview]')).toBeVisible();
  await expect(page.locator('[data-preview] img')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Submit case (v1 API pending)'})).toBeDisabled();
  await page.locator('#purpose').fill('Updated synthetic purpose');
  await expect(page.locator('[data-preview]')).toBeHidden();
  await page.locator('.dialog-close').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button',{name:'Preview draft'})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.dialog-close')).toBeFocused();
  await page.screenshot({path:`../.local/ui-checks/${testInfo.project.name}-dialog.png`,animations:'disabled'});
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(start).toBeFocused();
});

test('reduced motion disables decorative transitions', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.getByRole('button',{name:'Start synthetic case'}).click();
  expect(await page.locator('.case-dialog').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});
