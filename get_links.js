const axios = require('axios');
const cheerio = require('cheerio');

// 目标网站
const baseUrl = 'https://blog.netlab.360.com/';
async function fetchBlogLinks() {
  try {
    // 请求页面 HTML 内容
    const { data: html } = await axios.get(baseUrl);
    const $ = cheerio.load(html);
    const links = new Set();

    // 根据页面结构筛选链接
    // 这里示例中采用所有 <a> 标签的 href 属性，并过滤出符合博客链接特点的链接。
    // 可根据实际页面结构做进一步调整。
    $('a').each((i, elem) => {
      let href = $(elem).attr('href');
      if (href) {
        // 如果是相对路径，则转换为绝对 URL
        if (href.startsWith('/')) {
          href = new URL(href, baseUrl).href;
        }
        // 如果链接包含博客域名，且不等于首页，就认为是博客文章链接（此处逻辑可根据实际页面结构调整）
        if (href.startsWith(baseUrl) && href !== baseUrl) {
          links.add(href);
        }
      }
    });

    // 转换为数组并打印
    const linksArray = Array.from(links);
    console.log('博客文章链接：');
    linksArray.forEach(link => console.log(link));
  } catch (error) {
    console.error('获取博客链接时出错：', error);
  }
}

fetchBlogLinks();
