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
exports.getRandomArticle = getRandomArticle;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const imageUtils_1 = require("../utils/imageUtils");
const https_proxy_agent_1 = require("https-proxy-agent");
const http_proxy_agent_1 = require("http-proxy-agent");
async function getRandomArticle(url, articleSelector, titleSelector, linkSelector, contentSelector, fetchFullContent, paginationSelector, maxPages = 1, useProxies = false, proxyList = '', requestTimeout = 30000) {
    // Mảng lưu tất cả các bài viết
    const allArticles = [];
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
    // Hàm tạo cấu hình axios với proxy ngẫu nhiên
    const createAxiosConfig = (currentProxy) => {
        const config = {
            timeout: requestTimeout
        };
        if (useProxies && currentProxy) {
            if (currentProxy.startsWith('https://')) {
                config.httpsAgent = new https_proxy_agent_1.HttpsProxyAgent(currentProxy);
            }
            else {
                config.httpAgent = new http_proxy_agent_1.HttpProxyAgent(currentProxy);
            }
        }
        return config;
    };
    // Mảng các URL cần truy cập
    const pagesToVisit = [url];
    const visitedPages = new Set();
    // Lấy dữ liệu từ nhiều trang nếu cần
    for (let pageIndex = 0; pageIndex < Math.min(maxPages, pagesToVisit.length); pageIndex++) {
        const currentPageUrl = pagesToVisit[pageIndex];
        // Bỏ qua trang đã truy cập
        if (visitedPages.has(currentPageUrl))
            continue;
        visitedPages.add(currentPageUrl);
        try {
            // Chọn proxy ngẫu nhiên cho request này
            const currentProxy = getRandomProxy();
            const axiosConfig = createAxiosConfig(currentProxy);
            // Gửi yêu cầu HTTP
            const response = await axios_1.default.get(currentPageUrl, axiosConfig);
            const html = response.data;
            // Load HTML vào Cheerio
            const $ = cheerio.load(html);
            // Tìm và thêm các liên kết phân trang nếu được chỉ định
            if (paginationSelector && pagesToVisit.length < maxPages) {
                $(paginationSelector).each((_, pageLink) => {
                    const href = $(pageLink).attr('href');
                    if (href) {
                        const normalizedPageUrl = (0, imageUtils_1.normalizeUrl)(href, currentPageUrl);
                        // Chỉ thêm URL mới và chưa truy cập
                        if (!visitedPages.has(normalizedPageUrl) && !pagesToVisit.includes(normalizedPageUrl)) {
                            pagesToVisit.push(normalizedPageUrl);
                        }
                    }
                });
            }
            // Tìm tất cả các bài viết trên trang hiện tại
            $(articleSelector).each((_, articleElement) => {
                // Trích xuất tiêu đề
                const title = $(articleElement).find(titleSelector).first().text().trim();
                // Trích xuất liên kết
                let link = $(articleElement).find(linkSelector).first().attr('href') || '';
                // Chuẩn hóa đường dẫn
                if (link) {
                    link = (0, imageUtils_1.normalizeUrl)(link, currentPageUrl);
                }
                // Trích xuất nội dung tóm tắt nếu có
                let content = '';
                if ($(articleElement).find(contentSelector).length > 0) {
                    content = $(articleElement).find(contentSelector).first().text().trim();
                }
                // Trích xuất hình ảnh trong bài viết
                const images = [];
                $(articleElement).find('img').each((_, img) => {
                    const src = $(img).attr('src');
                    if (src) {
                        // Chuẩn hóa đường dẫn
                        const fullSrc = (0, imageUtils_1.normalizeUrl)(src, currentPageUrl);
                        images.push(fullSrc);
                    }
                });
                if (title && link) {
                    allArticles.push({ title, link, content, images, pageUrl: currentPageUrl });
                }
            });
        }
        catch (error) {
            console.error(`Lỗi khi truy cập trang ${currentPageUrl}:`, error);
            // Tiếp tục với trang tiếp theo
        }
    }
    // Kiểm tra có bài viết không
    if (allArticles.length === 0) {
        throw new Error(`Không tìm thấy bài viết nào với selector: ${articleSelector}`);
    }
    // Chọn ngẫu nhiên 1 bài viết
    const randomIndex = Math.floor(Math.random() * allArticles.length);
    const selectedArticle = allArticles[randomIndex];
    // Lấy nội dung đầy đủ nếu cần
    if (fetchFullContent && selectedArticle.link) {
        try {
            const currentProxy = getRandomProxy();
            const axiosConfig = createAxiosConfig(currentProxy);
            const articleResponse = await axios_1.default.get(selectedArticle.link, axiosConfig);
            const articleHtml = articleResponse.data;
            const $article = cheerio.load(articleHtml);
            // Cập nhật nội dung
            selectedArticle.content = $article(contentSelector).text().trim() || $article('body').text().trim();
            // Cập nhật hình ảnh
            $article('img').each((_, img) => {
                var _a;
                const src = $article(img).attr('src');
                if (src) {
                    // Chuẩn hóa đường dẫn
                    const fullSrc = (0, imageUtils_1.normalizeUrl)(src, selectedArticle.link || '');
                    // Thêm vào danh sách nếu chưa có
                    if (!((_a = selectedArticle.images) === null || _a === void 0 ? void 0 : _a.includes(fullSrc))) {
                        if (!selectedArticle.images)
                            selectedArticle.images = [];
                        selectedArticle.images.push(fullSrc);
                    }
                }
            });
        }
        catch (error) {
            console.error(`Không thể lấy nội dung từ ${selectedArticle.link}:`, error);
        }
    }
    // Tạo ID ngẫu nhiên cho bài viết
    const articleId = `article_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    // Chuẩn bị dữ liệu đầu ra
    return {
        json: {
            operation: 'randomArticle',
            articleId,
            article: selectedArticle,
            message: `Đã lấy bài viết "${selectedArticle.title}" từ trang web`,
            stats: {
                pagesVisited: visitedPages.size,
                totalArticlesFound: allArticles.length,
                proxyUsed: useProxies && proxies.length > 0 ? 'yes' : 'no'
            }
        },
    };
}
//# sourceMappingURL=randomArticle.js.map