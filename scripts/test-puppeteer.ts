import puppeteer from "puppeteer";

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
  });

  console.log("✅ Browser açıldı");

  const page = await browser.newPage();
  await page.setContent("<h1>TEST</h1>");

  const pdf = await page.pdf({
    format: "A4",
  });

  const fs = await import("fs");

  fs.writeFileSync("test-puppeteer.pdf", pdf);

  console.log("PDF boyutu:", pdf.length);
  console.log("Kaydedildi: test-puppeteer.pdf");

  await browser.close();
}

main().catch(console.error);
