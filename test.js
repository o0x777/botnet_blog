const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

const baseUrl = 'https://blog.netlab.360.com/';
const outputDir = path.join(__dirname, 'data');

// 如果 data 目录不存在，则创建
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// 模拟滚动以加载懒加载内容
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100; // 每次滚动 100 像素
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// 利用 Cheerio 解析页面获取所有博客文章链接
async function fetchBlogLinks(page) {
  // 先滚动到底部
  await autoScroll(page);
  // 获取页面 HTML 内容
  const html = await page.content();
  const $ = cheerio.load(html);
  const links = new Set();

  // 遍历所有 <a> 标签，提取 href 属性
  $('a').each((i, elem) => {
    let href = $(elem).attr('href');
    if (href) {
      // 若为相对路径，则转换为绝对 URL
      if (href.startsWith('/')) {
        href = new URL(href, baseUrl).href;
      }
      // 筛选出以 baseUrl 开头且不等于首页的链接（可根据实际页面结构调整过滤条件）
      if (href.startsWith(baseUrl) && href !== baseUrl) {
        links.add(href);
      }
    }
  });
  
  return Array.from(links);
}

// 从 URL 中提取最后一段作为文件名，如果最后为空，则命名为 'index'
function extractFileNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    const segments = pathname.split('/');
    return segments[segments.length - 1] || 'index';
  } catch (error) {
    return 'output';
  }
}

// 打开每个博客文章链接，并保存为 PDF 文件到 data 目录下
async function saveArticleAsPDF(browser, articleUrl) {
  const page = await browser.newPage();
  // 打开目标文章页面，等待网络空闲
  await page.goto(articleUrl, { waitUntil: 'networkidle2' });
  const fileName = extractFileNameFromUrl(articleUrl) + '.pdf';
  // 构造保存路径，将 PDF 保存在 data 目录下
  const filePath = path.join(outputDir, fileName);
  // 将页面保存为 A4 纸格式的 PDF（包含背景）
  await page.pdf({
    path: filePath,
    format: 'A4',
    printBackground: true,
  });
  console.log(`Saved ${articleUrl} as ${filePath}`);
  await page.close();
}

(async () => {
  try {
    // 启动无头浏览器
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // 打开目标网站首页
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    
    // 获取所有博客文章链接
    const links = await fetchBlogLinks(page);
    console.log('Fetched blog links:');
    links.forEach(link => console.log(link));
    
    // 关闭首页
    await page.close();
    
    // 遍历所有链接，将每篇文章保存为 PDF 到 data 文件夹中
    for (const link of links) {
      await saveArticleAsPDF(browser, link);
    }
    
    await browser.close();
  } catch (error) {
    console.error('Error:', error);
  }
})();
