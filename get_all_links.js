const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const baseUrl = 'https://blog.xlab.qianxin.com/';

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

async function fetchBlogLinks() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // 打开目标网站
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });

    // 模拟滚动到底部，触发懒加载
    await autoScroll(page);

    // 获取加载完成后的页面 HTML
    const html = await page.content();
    const $ = cheerio.load(html);
    const links = new Set();

    // 遍历所有 <a> 标签，提取 href
    $('a').each((i, elem) => {
      let href = $(elem).attr('href');
      if (href) {
        // 如果是相对路径则转换为绝对 URL
        if (href.startsWith('/')) {
          href = new URL(href, baseUrl).href;
        }
        // 根据条件判断：链接以 baseUrl 开头且不等于首页
        if (href.startsWith(baseUrl) && href !== baseUrl) {
          links.add(href);
        }
      }
    });

    const linksArray = Array.from(links);
    console.log('博客文章链接：');
    linksArray.forEach(link => console.log(link));

    await browser.close();
  } catch (error) {
    console.error('获取博客链接时出错：', error);
  }
}

fetchBlogLinks();
