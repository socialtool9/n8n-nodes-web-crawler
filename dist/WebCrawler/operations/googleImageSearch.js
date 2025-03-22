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
exports.googleImageSearch = googleImageSearch;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const imageUtils_1 = require("../utils/imageUtils");
const https_proxy_agent_1 = require("https-proxy-agent");
const http_proxy_agent_1 = require("http-proxy-agent");
async function googleImageSearch(keyword, maxImages, minImageSize = 0, filterBySize = false, useProxies = false, proxyList = '', requestTimeout = 30000) {
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
    // Chuẩn bị URL tìm kiếm Google, thêm tbm=isch để tìm kiếm ảnh
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=isch`;
    // Thiết lập User-Agent để tránh bị chặn
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/'
    };
    // Thiết lập config cho axios
    const axiosConfig = {
        headers,
        timeout: requestTimeout
    };
    // Chọn proxy ngẫu nhiên cho request tìm kiếm
    const currentProxy = getRandomProxy();
    // Thêm cấu hình proxy nếu được chọn
    if (useProxies && currentProxy) {
        if (currentProxy.startsWith('https://')) {
            axiosConfig.httpsAgent = new https_proxy_agent_1.HttpsProxyAgent(currentProxy);
        }
        else {
            axiosConfig.httpAgent = new http_proxy_agent_1.HttpProxyAgent(currentProxy);
        }
    }
    // Mảng lưu URL ảnh đã tìm thấy
    const imageUrls = [];
    const skippedImages = { small: 0, error: 0, timeout: 0 };
    try {
        // Gửi yêu cầu HTTP
        const response = await axios_1.default.get(searchUrl, axiosConfig);
        const html = response.data;
        // Load HTML vào Cheerio
        const $ = cheerio.load(html);
        // Trích xuất URL ảnh từ kết quả tìm kiếm
        // Google sử dụng các thẻ khác nhau và cấu trúc phức tạp, 
        // nên chúng ta tìm kiếm qua nhiều cách
        // Cách 1: Tìm các thẻ img có src hoặc data-src
        $('img').each((_, element) => {
            const src = $(element).attr('src') || $(element).attr('data-src');
            if (src && !src.includes('data:image') && !imageUrls.includes(src)) {
                imageUrls.push(src);
            }
        });
        // Cách 2: Tìm trong các thuộc tính data- có chứa URL ảnh
        $('[data-src]').each((_, element) => {
            const src = $(element).attr('data-src');
            if (src && !imageUrls.includes(src)) {
                imageUrls.push(src);
            }
        });
        // Cách 3: Tìm kiếm trong các script JSON có chứa URL ảnh
        $('script').each((_, element) => {
            const scriptContent = $(element).html();
            if (scriptContent) {
                // Tìm các chuỗi URL ảnh trong script
                const matches = scriptContent.match(/(https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif|webp))/g);
                if (matches) {
                    for (const match of matches) {
                        if (!imageUrls.includes(match)) {
                            imageUrls.push(match);
                        }
                    }
                }
            }
        });
        // Lọc và xử lý các URL ảnh tìm được
        const processedImages = [];
        const processedImagesInfo = [];
        // Giới hạn số lượng ảnh xử lý để tránh quá tải
        const imagesToProcess = imageUrls.slice(0, Math.min(maxImages * 3, 30));
        // Promise cho các tiến trình xử lý ảnh, với timeout cho từng ảnh riêng biệt
        const imagePromises = imagesToProcess.map(async (imageUrl, index) => {
            try {
                // Chọn một proxy ngẫu nhiên khác cho mỗi request ảnh
                const imageProxy = getRandomProxy();
                if (filterBySize && minImageSize > 0) {
                    // Kiểm tra kích thước ảnh với proxy nếu cần
                    const dimensions = await (0, imageUtils_1.getImageSize)(imageUrl, useProxies ? imageProxy : undefined, requestTimeout);
                    if (dimensions.timeout) {
                        skippedImages.timeout++;
                        return null;
                    }
                    if ((dimensions.width && dimensions.width >= minImageSize) ||
                        (dimensions.height && dimensions.height >= minImageSize)) {
                        return {
                            url: imageUrl,
                            width: dimensions.width,
                            height: dimensions.height,
                            index // Giữ vị trí ban đầu để sắp xếp đúng thứ tự
                        };
                    }
                    else {
                        skippedImages.small++;
                        return null;
                    }
                }
                else {
                    // Nếu không cần lọc theo kích thước, thêm trực tiếp
                    return {
                        url: imageUrl,
                        index
                    };
                }
            }
            catch (error) {
                // Bỏ qua ảnh lỗi
                skippedImages.error++;
                console.error(`Lỗi khi xử lý ảnh ${imageUrl}:`, error);
                return null;
            }
        });
        // Xử lý song song tất cả các ảnh, với cơ chế fallback đáng tin cậy
        let processedResults = [];
        try {
            // Xử lý song song với timeout tổng thể
            const timeoutController = new AbortController();
            const timeoutId = setTimeout(() => timeoutController.abort(), requestTimeout);
            // Sử dụng Promise.allSettled thay vì Promise.all để đảm bảo không bị dừng khi có lỗi
            const results = await Promise.allSettled(imagePromises);
            clearTimeout(timeoutId);
            // Xử lý kết quả của Promise.allSettled
            processedResults = results.map(result => {
                if (result.status === 'fulfilled' && result.value !== null) {
                    return result.value;
                }
                return null;
            });
        }
        catch (error) {
            console.error('Lỗi khi xử lý tất cả ảnh:', error);
            // Vẫn tiếp tục với các kết quả đã có (nếu có)
        }
        // Lọc bỏ các kết quả null và sắp xếp lại theo vị trí ban đầu
        const validResults = processedResults
            .filter(result => result !== null)
            .sort((a, b) => ((a === null || a === void 0 ? void 0 : a.index) || 0) - ((b === null || b === void 0 ? void 0 : b.index) || 0));
        // Lấy số lượng ảnh cần thiết
        const limitedResults = validResults.slice(0, maxImages);
        // Chuyển kết quả vào mảng kết quả cuối cùng
        limitedResults.forEach(result => {
            processedImages.push(result.url);
            processedImagesInfo.push({
                url: result.url,
                width: result.width,
                height: result.height
            });
        });
        // Chuẩn bị dữ liệu đầu ra
        return {
            json: {
                operation: 'googleImageSearch',
                keyword,
                imageCount: processedImages.length,
                requestedCount: maxImages,
                imageUrls: processedImages,
                imagesInfo: processedImagesInfo,
                proxyUsed: useProxies && currentProxy ? 'yes' : 'no',
                filterDetails: {
                    filtered: filterBySize,
                    minImageSize: filterBySize ? minImageSize : undefined,
                    totalFound: imageUrls.length,
                    processedCount: processedImages.length,
                    skipped: skippedImages
                }
            },
        };
    }
    catch (error) {
        // Nếu có lỗi khi tìm kiếm, trả về mảng ảnh rỗng
        console.error(`Lỗi khi tìm kiếm ảnh cho từ khóa "${keyword}":`, error);
        return {
            json: {
                operation: 'googleImageSearch',
                keyword,
                imageCount: 0,
                requestedCount: maxImages,
                imageUrls: [],
                imagesInfo: [],
                proxyUsed: useProxies && currentProxy ? 'yes' : 'no',
                error: error instanceof Error ? error.message : 'Lỗi không xác định',
                filterDetails: {
                    filtered: filterBySize,
                    minImageSize: filterBySize ? minImageSize : undefined,
                    totalFound: 0,
                    processedCount: 0,
                    searchFailed: true
                }
            },
        };
    }
}
//# sourceMappingURL=googleImageSearch.js.map