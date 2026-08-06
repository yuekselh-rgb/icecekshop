import puppeteer from "puppeteer";
import fs from "fs";

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto("http://localhost:3000/admin/musteriler", {
    waitUntil: "networkidle2",
  });

  await page.pdf({
    path: "musteriler.pdf",
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  console.log("✅ musteriler.pdf oluşturuldu.");
}

main().catch(console.error);
