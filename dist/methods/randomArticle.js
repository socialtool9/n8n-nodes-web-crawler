"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const https_proxy_agent_1 = require("https-proxy-agent");
const http_proxy_agent_1 = require("http-proxy-agent");
/**
 * Tạo ID ngẫu nhiên cho bài viết
 */
function generateArticleId() {
    return `article_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}
/**
 * Lấy bài viết ngẫu nhiên từ trang web
 */
async function execute(url, articleSelector, titleSelector, linkSelector, contentSelector, fetchFullContent = true, paginationSelector = '', maxPages = 1, useProxies = false, proxyList = '', requestTimeout = 30000) {
    // Phân tích danh sách proxy nếu được cung cấp
    let proxies = [];
    if (useProxies && proxyList) {
        proxies = proxyList.split(',').map(proxy => proxy.trim()).filter(proxy => proxy.length > 0);
    }
    // Hàm chọn proxy ngẫu nhiên từ danh sách
    const getRandomProxy = () => {
        if (proxies.length === 0)
            return undefined;
        const randomIndex = Math.floor(Math.random() * proxies.length);
        return proxies[randomIndex];
    };
    try {
        const pagesUrls = [url];
        let currentPageUrl = url;
        let allArticleElements = [];
        let pagesVisited = 1;
        // Cài đặt các tùy chọn mặc định cho request
        const axiosConfig = () => {
            const config = {
                timeout: requestTimeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            };
            // Thêm proxy nếu được yêu cầu
            if (useProxies) {
                const proxy = getRandomProxy();
                if (proxy) {
                    if (proxy.startsWith('https://')) {
                        config.httpsAgent = new https_proxy_agent_1.HttpsProxyAgent(proxy);
                    }
                    else {
                        config.httpAgent = new http_proxy_agent_1.HttpProxyAgent(proxy);
                    }
                }
            }
            return config;
        };
        // Nếu truy cập nhiều trang, tìm các liên kết phân trang
        if (paginationSelector && maxPages > 1) {
            try {
                const initialPageResponse = await axios_1.default.get(url, axiosConfig());
                const $ = cheerio.load(initialPageResponse.data);
                // Lấy tất cả các phần tử bài viết từ trang đầu tiên
                const firstPageArticles = $(articleSelector).toArray();
                allArticleElements = [...allArticleElements, ...firstPageArticles];
                // Tìm các liên kết phân trang
                const paginationLinks = $(paginationSelector).toArray();
                for (const link of paginationLinks) {
                    if (pagesUrls.length >= maxPages)
                        break;
                    const href = $(link).attr('href');
                    if (href) {
                        // Chuẩn hóa URL
                        let nextPageUrl;
                        if (href.startsWith('http')) {
                            nextPageUrl = href;
                        }
                        else {
                            const baseUrl = new URL(url);
                            nextPageUrl = href.startsWith('/')
                                ? `${baseUrl.protocol}//${baseUrl.host}${href}`
                                : `${baseUrl.protocol}//${baseUrl.host}/${href}`;
                        }
                        // Chỉ thêm nếu URL mới
                        if (!pagesUrls.includes(nextPageUrl)) {
                            pagesUrls.push(nextPageUrl);
                        }
                    }
                }
                // Duyệt qua các trang tiếp theo để thu thập bài viết
                for (let i = 1; i < pagesUrls.length && i < maxPages; i++) {
                    const pageUrl = pagesUrls[i];
                    try {
                        const pageResponse = await axios_1.default.get(pageUrl, axiosConfig());
                        const pageHtml = cheerio.load(pageResponse.data);
                        const pageArticles = pageHtml(articleSelector).toArray();
                        allArticleElements = [...allArticleElements, ...pageArticles];
                        pagesVisited++;
                        currentPageUrl = pageUrl;
                    }
                    catch (error) {
                        // Bỏ qua lỗi khi truy cập trang, tiếp tục với trang tiếp theo
                        console.error(`Lỗi khi truy cập trang ${pageUrl}:`, error);
                    }
                }
            }
            catch (error) {
                // Nếu lỗi khi tải trang đầu tiên, quay lại phương pháp mặc định
                console.error('Lỗi khi tải trang đầu tiên:', error);
            }
        }
        // Nếu không có bài viết nào từ nhiều trang, thử tải trang đầu tiên
        if (allArticleElements.length === 0) {
            const response = await axios_1.default.get(url, axiosConfig());
            const $ = cheerio.load(response.data);
            allArticleElements = $(articleSelector).toArray();
            pagesVisited = 1;
            currentPageUrl = url;
        }
        // Nếu không tìm thấy bài viết nào
        if (allArticleElements.length === 0) {
            return {
                json: {
                    operation: 'randomArticle',
                    error: `Không tìm thấy bài viết nào với selector "${articleSelector}"`,
                    url,
                    success: false
                }
            };
        }
        // Chọn ngẫu nhiên một bài viết
        const randomIndex = Math.floor(Math.random() * allArticleElements.length);
        const selectedArticle = allArticleElements[randomIndex];
        // Lấy thông tin từ bài viết đã chọn
        const $ = cheerio.load(selectedArticle);
        const title = $(titleSelector).text().trim();
        const linkElement = $(linkSelector);
        // Lấy liên kết của bài viết
        let articleLink = linkElement.attr('href') || '';
        // Chuẩn hóa URL nếu là liên kết tương đối
        if (articleLink && !articleLink.startsWith('http')) {
            const baseUrl = new URL(url);
            articleLink = articleLink.startsWith('/')
                ? `${baseUrl.protocol}//${baseUrl.host}${articleLink}`
                : `${baseUrl.protocol}//${baseUrl.host}/${articleLink}`;
        }
        // Trích xuất nội dung (hoặc lấy nội dung tóm tắt)
        let content = $(contentSelector).text().trim();
        let images = [];
        // Nếu yêu cầu lấy nội dung đầy đủ, truy cập vào trang bài viết
        if (fetchFullContent && articleLink) {
            try {
                const articleResponse = await axios_1.default.get(articleLink, axiosConfig());
                const articlePage = cheerio.load(articleResponse.data);
                content = articlePage(contentSelector).text().trim();
                // Trích xuất các hình ảnh từ nội dung
                articlePage(`${contentSelector} img`).each((_, img) => {
                    const imgSrc = articlePage(img).attr('src');
                    if (imgSrc) {
                        // Chuẩn hóa URL hình ảnh
                        let imageUrl = imgSrc;
                        if (!imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
                            const baseUrl = new URL(articleLink);
                            imageUrl = imgSrc.startsWith('/')
                                ? `${baseUrl.protocol}//${baseUrl.host}${imgSrc}`
                                : `${baseUrl.protocol}//${baseUrl.host}/${imgSrc}`;
                        }
                        images.push(imageUrl);
                    }
                });
            }
            catch (error) {
                console.error('Lỗi khi tải nội dung đầy đủ:', error);
            }
        }
        // Tạo ID duy nhất cho bài viết
        const articleId = generateArticleId();
        // Trả về kết quả
        return {
            json: {
                operation: 'randomArticle',
                articleId,
                article: {
                    title,
                    link: articleLink,
                    content,
                    images,
                    pageUrl: currentPageUrl
                },
                message: `Đã lấy bài viết "${title}" từ trang web`,
                stats: {
                    pagesVisited,
                    totalArticlesFound: allArticleElements.length,
                    proxyUsed: useProxies && proxies.length > 0 ? 'yes' : 'no'
                }
            }
        };
    }
    catch (error) {
        let errorMessage = 'Lỗi không xác định';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        // Trả về thông báo lỗi
        return {
            json: {
                operation: 'randomArticle',
                error: errorMessage,
                url,
                success: false
            }
        };
    }
}
//# sourceMappingURL=randomArticle.js.map