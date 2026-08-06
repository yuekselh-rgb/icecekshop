import puppeteer from "puppeteer";

export async function createEndOfPeriodPdf(sessionCookie: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setCookie({
      name: "paketmarket_session",
      value: sessionCookie,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
    });

    await page.goto("http://127.0.0.1:3000/admin/musteriler", {
      waitUntil: "networkidle2",
    });

    console.log("URL:", page.url());

    const html = await page.content();
    console.log("LOGIN_PAGE:", html.includes("E-posta") || html.includes("Giriş"));

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
