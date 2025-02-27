const puppeteer = require('puppeteer');

async function generatePDF(url, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // 设定页面视图大小，确保页面完整加载
  await page.setViewport({ width: 1280, height: 800 });
  
  // 打开目标 URL
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // 输出 PDF 文件
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
  });
  
  await browser.close();
}

// 示例：处理一个博客文章
const blogUrl = 'https://blog.xlab.qianxin.com/long_live_the_botnet_vo1d_is_back_cn/';
const outputPath = 'blog1.pdf';

generatePDF(blogUrl, outputPath)
  .then(() => console.log(`PDF 已保存至 ${outputPath}`))
  .catch(err => console.error(err));
