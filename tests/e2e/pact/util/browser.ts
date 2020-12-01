import puppeteer from 'puppeteer'

export async function get_access_token(url: string): Promise<string> {
    const browser: puppeteer.Browser = await puppeteer.launch({
        executablePath: process.env.CHROME_BIN || null,
        args: ['--no-sandbox', '--headless', '--disable-gpu']
    })

    try {
        return await nhsdLogin(url, browser)
    } catch (error) {
        console.error("unhandled exception occurred: ", error)
    } finally {
        if (browser) {
            browser.close()
        }
    }
}

async function nhsdLogin(url: string, browser: puppeteer.Browser) {
    const navigator = gotoLogin(browser, url)
    const page = await navigator().catch(navigator).catch(navigator) // retries three times

    await page.waitForSelector('body > div > div > pre', { timeout: 30000 })
    //const credHtmlText = await page.$eval()
    const credHtmlText = await page.$eval('body > div > div > pre', e => {
        const htmlElement = e as HTMLElement
        return htmlElement.innerText
    })
    const credentialsJsonText = credHtmlText.replace(/'/g, '"')
    const credentials = JSON.parse(credentialsJsonText)

    return credentials['access_token']
}

function gotoLogin(browser: puppeteer.Browser, url: string) {
    return (async () => {
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: 'networkidle2' })
        await page.waitForSelector('#start')
        await page.click("#start")
        await page.waitForSelector('button[class="btn btn-lg btn-primary btn-block"]', { timeout: 30000 })
        await page.click('button[class="btn btn-lg btn-primary btn-block"]')

        return page
    })
}

