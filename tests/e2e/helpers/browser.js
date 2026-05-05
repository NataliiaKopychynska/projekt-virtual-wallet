import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'

export const byTestId = (testId) => By.css(`[data-testid="${testId}"]`)

export const createDriver = async () => {
  const options = new chrome.Options()

  if (process.env.E2E_HEADLESS !== 'false') {
    options.addArguments('--headless=new')
  }

  options.addArguments(
    '--window-size=1440,1000',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  )

  return new Builder().forBrowser('chrome').setChromeOptions(options).build()
}

export const waitForTestId = (driver, testId, timeout = 10000) => {
  return driver.wait(until.elementLocated(byTestId(testId)), timeout)
}

export const waitForVisibleTestId = async (driver, testId, timeout = 10000) => {
  const element = await waitForTestId(driver, testId, timeout)
  await driver.wait(until.elementIsVisible(element), timeout)
  return element
}

export const clearAndType = async (element, value) => {
  await element.clear()
  await element.sendKeys(value)
}

export const setInputValue = async (driver, testId, value) => {
  const input = await waitForVisibleTestId(driver, testId)

  await driver.executeScript(
    `
      const element = arguments[0];
      const value = arguments[1];
      const valueSetter = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value')?.set;

      if (valueSetter) {
        valueSetter.call(element, value);
      } else {
        element.value = value;
      }

      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    `,
    input,
    value,
  )

  const isValueApplied = await driver
    .wait(async () => {
      return (await input.getAttribute('value')) === value
    }, 5000)
    .catch(() => false)

  if (!isValueApplied) {
    const actualValue = await input.getAttribute('value')
    throw new Error(`Could not set ${testId} to "${value}". Current value is "${actualValue}".`)
  }

  return input
}

export const setSelectValue = async (driver, testId, value) => {
  const select = await waitForVisibleTestId(driver, testId)
  await select.findElement(By.css(`option[value="${value}"]`)).click()
}

export const xpathTextLiteral = (text) => {
  if (!text.includes('"')) return `"${text}"`
  if (!text.includes("'")) return `'${text}'`

  return `concat(${text
    .split('"')
    .map((part) => `"${part}"`)
    .join(", '\"', ")})`
}

export const waitForText = async (driver, text, timeout = 10000) => {
  return driver.wait(
    until.elementLocated(By.xpath(`//*[contains(normalize-space(.), ${xpathTextLiteral(text)})]`)),
    timeout,
  )
}

export const waitForUrlIncludes = (driver, fragment, timeout = 10000) => {
  return driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl()
    return currentUrl.includes(fragment)
  }, timeout)
}

export const getLocalStorageItem = (driver, key) => {
  return driver.executeScript('return window.localStorage.getItem(arguments[0])', key)
}
