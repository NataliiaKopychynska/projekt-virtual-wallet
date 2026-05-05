import assert from 'node:assert/strict'
import { after, afterEach, before, beforeEach, describe, test } from 'node:test'
import { By, until } from 'selenium-webdriver'
import { APP_BASE_URL, ensureAppRunning, stopManagedApp } from './helpers/appServer.js'
import { hasE2ECredentials, loginWithTestUser } from './helpers/auth.js'
import {
  clearAndType,
  createDriver,
  getLocalStorageItem,
  setInputValue,
  setSelectValue,
  waitForText,
  waitForUrlIncludes,
  waitForVisibleTestId,
  xpathTextLiteral,
} from './helpers/browser.js'

const todayInputValue = () => new Date().toISOString().slice(0, 10)

const dashboardPinnedDates = ['9999-12-31', '9999-12-30', '9999-12-29']
const traceDates = ['2099-12-03', '2099-12-02', '2099-12-01']

const getElementText = async (driver, testId) => {
  return (await waitForVisibleTestId(driver, testId)).getText()
}

const waitForAnyText = async (driver, texts, timeout = 10000) => {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeout) {
    const pageText = await driver.findElement(By.css('body')).getText()
    const matchedText = texts.find((text) => pageText.includes(text))

    if (matchedText) return matchedText
    await driver.sleep(250)
  }

  throw new Error(`None of the expected texts appeared: ${texts.join(', ')}`)
}

const transactionFailureMessages = [
  'Nie udało się zapisać transakcji.',
  'Podaj poprawną kwotę większą od zera',
  'Wybierz datę transakcji.',
  'Wybierz kategorię.',
]

const waitForTransactionSaveSuccess = async (driver, successMessage, submittedComment = '') => {
  if (submittedComment) {
    const matchedMessage = await driver.wait(async () => {
      const pageText = await driver.findElement(By.css('body')).getText()
      const failureMessage = transactionFailureMessages.find((message) =>
        pageText.includes(message),
      )

      if (failureMessage) return failureMessage

      const commentInputs = await driver.findElements(
        By.css('[data-testid="transaction-comment-input"]'),
      )
      const currentComment = commentInputs[0]
        ? await commentInputs[0].getAttribute('value')
        : submittedComment

      return currentComment === '' ? successMessage : ''
    }, 30000)

    assert.equal(matchedMessage, successMessage)
    await waitForText(driver, successMessage, 5000)
    return
  }

  const matchedMessage = await waitForAnyText(
    driver,
    [successMessage, ...transactionFailureMessages],
    30000,
  )

  assert.equal(matchedMessage, successMessage)
}

const recentTransactionXpath = (comment) => {
  return `//*[@data-testid="recent-transaction" and contains(., ${xpathTextLiteral(comment)})]`
}

const findRecentTransaction = (driver, comment) => {
  return driver.findElement(By.xpath(recentTransactionXpath(comment)))
}

const waitForRecentTransactionToDisappear = async (driver, comment) => {
  await driver.wait(async () => {
    const matches = await driver.findElements(By.xpath(recentTransactionXpath(comment)))
    return matches.length === 0
  }, 20000)
}

const addDashboardTransaction = async (
  driver,
  {
    amount,
    comment,
    type = 'expense',
    transactionDate = dashboardPinnedDates[0],
    waitForDashboardComment = true,
  },
) => {
  if (type !== 'expense') {
    await setSelectValue(driver, 'transaction-type-select', type)
  }

  await clearAndType(await waitForVisibleTestId(driver, 'transaction-amount-input'), amount)
  await setInputValue(driver, 'transaction-date-input', transactionDate)
  await clearAndType(await waitForVisibleTestId(driver, 'transaction-comment-input'), comment)
  await (await waitForVisibleTestId(driver, 'transaction-submit-button')).click()

  await waitForTransactionSaveSuccess(driver, 'Transakcja dodana.', comment)
  if (waitForDashboardComment) {
    await waitForText(driver, comment, 20000)
  }
}

const deleteRecentTransaction = async (driver, comment) => {
  const transaction = await findRecentTransaction(driver, comment)
  await (await transaction.findElement(By.xpath('.//button[normalize-space()="Usuń"]'))).click()
  await driver.wait(until.alertIsPresent(), 5000)
  await driver.switchTo().alert().accept()

  await waitForText(driver, 'Transakcja usunięta.', 20000)
  await waitForRecentTransactionToDisappear(driver, comment)
}

const searchTransactionsHistory = async (driver, search) => {
  await driver.get(`${APP_BASE_URL}/home/transactions`)
  await waitForVisibleTestId(driver, 'transactions-page', 20000)
  await setInputValue(driver, 'transactions-search-input', search)
  await waitForText(driver, search, 20000)
}

const deleteTransactionFromHistory = async (driver, comment) => {
  await searchTransactionsHistory(driver, comment)

  const row = await driver.findElement(
    By.xpath(
      `//*[@data-testid="transactions-table-row" and contains(., ${xpathTextLiteral(comment)})]`,
    ),
  )

  await (await row.findElement(By.css('[data-testid="transactions-delete-button"]'))).click()
  await driver.wait(until.alertIsPresent(), 5000)
  await driver.switchTo().alert().accept()

  await driver.wait(async () => {
    const rows = await driver.findElements(
      By.xpath(
        `//*[@data-testid="transactions-table-row" and contains(., ${xpathTextLiteral(comment)})]`,
      ),
    )
    return rows.length === 0
  }, 20000)
}

describe('Virtual Wallet Selenium E2E', () => {
  let driver

  before(async () => {
    await ensureAppRunning()
  })

  after(async () => {
    await stopManagedApp()
  })

  beforeEach(async () => {
    driver = await createDriver()
  })

  afterEach(async () => {
    if (driver) await driver.quit()
  })

  test('redirects root path to the login screen', async () => {
    await driver.get(`${APP_BASE_URL}/`)

    await waitForUrlIncludes(driver, '/login')
    await waitForVisibleTestId(driver, 'login-page')
    assert.match(await driver.getPageSource(), /Virtual Wallet/)
  })

  test('shows validation messages on public authentication screens', async () => {
    await driver.get(`${APP_BASE_URL}/login`)
    await waitForVisibleTestId(driver, 'login-page')

    await (await waitForVisibleTestId(driver, 'forgot-password-button')).click()
    assert.match(await getElementText(driver, 'login-error'), /Podaj email/)

    await driver.get(`${APP_BASE_URL}/register`)
    await waitForVisibleTestId(driver, 'register-page')
    await clearAndType(await driver.findElement(By.id('email')), 'niepoprawny-email')
    await clearAndType(await driver.findElement(By.id('password')), 'weak')
    await clearAndType(await driver.findElement(By.id('repeat')), 'weak')
    await (await waitForVisibleTestId(driver, 'register-submit-button')).click()

    assert.match(await getElementText(driver, 'register-error'), /poprawny adres email/)
  })

  test('logs in with the test account and logs out', { skip: !hasE2ECredentials }, async () => {
    await loginWithTestUser(driver)

    await (await waitForVisibleTestId(driver, 'app-shell-logout-button')).click()
    await waitForUrlIncludes(driver, '/login')
    await waitForVisibleTestId(driver, 'login-page')
  })

  test(
    'keeps the AppShell collapse button stable and persists collapsed state',
    { skip: !hasE2ECredentials },
    async () => {
      await loginWithTestUser(driver)

      const sidebar = await waitForVisibleTestId(driver, 'app-shell-sidebar')
      const toggle = await waitForVisibleTestId(driver, 'app-shell-sidebar-toggle')
      await toggle.click()

      await driver.wait(async () => {
        const className = await sidebar.getAttribute('class')
        return className.includes('app-shell__sidebar--collapsed')
      })

      assert.equal(await getLocalStorageItem(driver, 'vw_app_shell_sidebar_collapsed'), 'true')

      const toggleGeometry = await driver.executeScript(
        `
          const sidebarRect = arguments[0].getBoundingClientRect();
          const toggleRect = arguments[1].getBoundingClientRect();
          return {
            width: toggleRect.width,
            height: toggleRect.height,
            centerX: toggleRect.left + toggleRect.width / 2,
            sidebarRight: sidebarRect.right,
          };
        `,
        sidebar,
        toggle,
      )

      assert.ok(toggleGeometry.height > toggleGeometry.width)
      assert.ok(Math.abs(toggleGeometry.centerX - toggleGeometry.sidebarRight) <= 16)

      await driver.navigate().refresh()
      const sidebarAfterRefresh = await waitForVisibleTestId(driver, 'app-shell-sidebar')
      const className = await sidebarAfterRefresh.getAttribute('class')
      assert.match(className, /app-shell__sidebar--collapsed/)
    },
  )

  test(
    'creates, edits, filters and deletes a transaction',
    { skip: !hasE2ECredentials },
    async () => {
      const marker = `E2E ${Date.now()}`
      const editedMarker = `${marker} edited`

      await loginWithTestUser(driver)

      await addDashboardTransaction(driver, {
        amount: '12.34',
        comment: marker,
        transactionDate: dashboardPinnedDates[0],
      })

      const transaction = await findRecentTransaction(driver, marker)
      await (
        await transaction.findElement(By.xpath('.//button[normalize-space()="Edytuj"]'))
      ).click()
      await setInputValue(driver, 'transaction-amount-input', '23.45')
      await setInputValue(driver, 'transaction-comment-input', editedMarker)
      await (await waitForVisibleTestId(driver, 'transaction-submit-button')).click()

      await waitForTransactionSaveSuccess(driver, 'Transakcja zaktualizowana.', editedMarker)
      await waitForText(driver, editedMarker, 20000)

      await searchTransactionsHistory(driver, editedMarker)
      await driver.wait(async () => {
        const rows = await driver.findElements(By.css('[data-testid="transactions-table-row"]'))
        return rows.length === 1
      }, 20000)
      assert.match(await getElementText(driver, 'transactions-results'), /1 rekord/)

      await (await waitForVisibleTestId(driver, 'transactions-reset-filters')).click()
      assert.equal(
        await (
          await waitForVisibleTestId(driver, 'transactions-search-input')
        ).getAttribute('value'),
        '',
      )

      await deleteTransactionFromHistory(driver, editedMarker)
    },
  )

  test('validates invalid transaction amount values', { skip: !hasE2ECredentials }, async () => {
    const invalidAmounts = ['', '0', '-5', '12.345', 'abc']

    await loginWithTestUser(driver)

    for (const amount of invalidAmounts) {
      await setInputValue(driver, 'transaction-amount-input', amount)
      await setInputValue(driver, 'transaction-date-input', todayInputValue())
      await setInputValue(
        driver,
        'transaction-comment-input',
        `Selenium invalid amount ${amount || 'empty'}`,
      )
      await (await waitForVisibleTestId(driver, 'transaction-submit-button')).click()

      assert.match(
        await getElementText(driver, 'transaction-form-error'),
        /Podaj poprawną kwotę większą od zera/,
      )
    }
  })

  test(
    'creates and deletes multiple disposable transactions',
    { skip: !hasE2ECredentials },
    async () => {
      const marker = `Selenium cleanup ${Date.now()}`
      const transactions = [
        {
          amount: '1.11',
          comment: `${marker} first disposable transaction`,
          transactionDate: dashboardPinnedDates[0],
        },
        {
          amount: '2.22',
          comment: `${marker} second disposable transaction`,
          transactionDate: dashboardPinnedDates[1],
        },
        {
          amount: '3.33',
          comment: `${marker} third disposable transaction`,
          transactionDate: dashboardPinnedDates[2],
        },
      ]

      await loginWithTestUser(driver)

      for (const transaction of transactions) {
        await addDashboardTransaction(driver, transaction)
      }

      for (const transaction of transactions) {
        await deleteRecentTransaction(driver, transaction.comment)
      }
    },
  )

  test(
    'leaves visible Selenium trace transactions on the test account',
    { skip: !hasE2ECredentials },
    async () => {
      const marker = `Selenium trace ${new Date().toISOString()}`
      const transactions = [
        {
          amount: '4.44',
          comment: `${marker} - prezentacja dodania transakcji 1`,
          transactionDate: traceDates[0],
          waitForDashboardComment: false,
        },
        {
          amount: '5.55',
          comment: `${marker} - prezentacja dodania transakcji 2`,
          transactionDate: traceDates[1],
          waitForDashboardComment: false,
        },
        {
          amount: '6.66',
          comment: `${marker} - ślad po teście Selenium`,
          transactionDate: traceDates[2],
          waitForDashboardComment: false,
        },
      ]

      await loginWithTestUser(driver)

      for (const transaction of transactions) {
        await addDashboardTransaction(driver, transaction)
      }

      await searchTransactionsHistory(driver, marker)
      await driver.wait(async () => {
        const rows = await driver.findElements(By.css('[data-testid="transactions-table-row"]'))
        return rows.length >= transactions.length
      }, 20000)
    },
  )

  test('saves UI preferences in settings', { skip: !hasE2ECredentials }, async () => {
    await loginWithTestUser(driver)
    await driver.get(`${APP_BASE_URL}/home/settings`)
    await waitForVisibleTestId(driver, 'settings-page', 20000)

    await setSelectValue(driver, 'preferences-currency-select', 'EUR')
    await setSelectValue(driver, 'preferences-theme-select', 'dark')
    await (await waitForVisibleTestId(driver, 'preferences-submit-button')).click()
    await waitForText(driver, 'Preferencje zapisane pomyślnie.', 10000)

    await driver.navigate().refresh()
    await waitForVisibleTestId(driver, 'settings-page', 20000)

    assert.equal(
      await (
        await waitForVisibleTestId(driver, 'preferences-currency-select')
      ).getAttribute('value'),
      'EUR',
    )
    assert.equal(
      await (await waitForVisibleTestId(driver, 'preferences-theme-select')).getAttribute('value'),
      'dark',
    )
  })
})
