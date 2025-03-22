"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBase64Image = isBase64Image;
exports.getBase64Buffer = getBase64Buffer;
exports.getImageSize = getImageSize;
exports.normalizeUrl = normalizeUrl;
const axios_1 = __importDefault(require("axios"));
const image_size_1 = __importDefault(require("image-size"));
const url_1 = require("url");
const https_proxy_agent_1 = require("https-proxy-agent");
const http_proxy_agent_1 = require("http-proxy-agent");
// Kiểm tra xem một chuỗi có phải là ảnh base64 không
function isBase64Image(src) {
    return src.startsWith('data:image') && src.includes(';base64,');
}
// Lấy Buffer từ chuỗi base64
function getBase64Buffer(base64String) {
    // Loại bỏ phần tiền tố data:image/png;base64, hoặc tương tự
    const base64Data = base64String.split(',')[1];
    return Buffer.from(base64Data, 'base64');
}
// Hàm kiểm tra kích thước thực tế của hình ảnh
async function getImageSize(imageUrl, proxyUrl, timeout = 30000) {
    try {
        if (isBase64Image(imageUrl)) {
            // Xử lý ảnh base64
            const buffer = getBase64Buffer(imageUrl);
            const dimensions = (0, image_size_1.default)(buffer);
            return {
                width: dimensions.width,
                height: dimensions.height,
            };
        }
        else {
            // Xử lý ảnh thông thường qua URL
            const axiosConfig = {
                responseType: 'arraybuffer',
                timeout: timeout
            };
            // Thêm cấu hình proxy nếu được cung cấp
            if (proxyUrl) {
                if (proxyUrl.startsWith('https://')) {
                    axiosConfig.httpsAgent = new https_proxy_agent_1.HttpsProxyAgent(proxyUrl);
                }
                else {
                    axiosConfig.httpAgent = new http_proxy_agent_1.HttpProxyAgent(proxyUrl);
                }
            }
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => resolve({ timeout: true }), timeout);
            });
            const fetchPromise = axios_1.default.get(imageUrl, axiosConfig)
                .then(response => {
                const buffer = Buffer.from(response.data, 'binary');
                const dimensions = (0, image_size_1.default)(buffer);
                return {
                    width: dimensions.width,
                    height: dimensions.height,
                };
            });
            // Sử dụng Promise.race để áp dụng timeout
            const result = await Promise.race([fetchPromise, timeoutPromise]);
            if ('timeout' in result) {
                return { timeout: true };
            }
            return result;
        }
    }
    catch (error) {
        console.error(`Lỗi khi lấy kích thước hình ảnh:`, error);
        return { width: undefined, height: undefined };
    }
}
// Hàm chuẩn hóa đường dẫn URL
function normalizeUrl(src, baseUrl) {
    // Nếu là ảnh base64, trả về nguyên dạng
    if (isBase64Image(src)) {
        return src;
    }
    if (src.startsWith('//')) {
        return `https:${src}`;
    }
    else if (src.startsWith('/')) {
        const urlObj = new url_1.URL(baseUrl);
        return `${urlObj.origin}${src}`;
    }
    else if (!src.startsWith('http')) {
        const urlObj = new url_1.URL(baseUrl);
        return `${urlObj.origin}/${src}`;
    }
    return src;
}
//# sourceMappingURL=imageUtils.js.map