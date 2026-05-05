import 'dotenv/config'
import assert from 'node:assert/strict'
import { By } from 'selenium-webdriver'
import { APP_BASE_URL } from './appServer.js'
import { clearAndType, waitForUrlIncludes, waitForVisibleTestId } from './browser.js'

export const hasE2ECredentials = Boolean(
  process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD,
)

export const loginWithTestUser = async (driver) => {
  assert.ok(hasE2ECredentials, 'Missing E2E_TEST_EMAIL or E2E_TEST_PASSWORD')

  await driver.get(`${APP_BASE_URL}/login`)
  await waitForVisibleTestId(driver, 'login-page')

  await clearAndType(await driver.findElement(By.id('email')), process.env.E2E_TEST_EMAIL)
  await clearAndType(await driver.findElement(By.id('password')), process.env.E2E_TEST_PASSWORD)
  await (await waitForVisibleTestId(driver, 'login-submit-button')).click()

  await waitForUrlIncludes(driver, '/home/dashboard', 20000)
  await waitForVisibleTestId(driver, 'dashboard-page', 20000)
}
