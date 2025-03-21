"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageSize = getImageSize;
exports.normalizeUrl = normalizeUrl;
const axios_1 = __importDefault(require("axios"));
const image_size_1 = __importDefault(require("image-size"));
const url_1 = require("url");
// Hàm kiểm tra kích thước thực tế của hình ảnh
async function getImageSize(imageUrl) {
    try {
        const response = await axios_1.default.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const dimensions = (0, image_size_1.default)(buffer);
        return {
            width: dimensions.width,
            height: dimensions.height,
        };
    }
    catch (error) {
        console.error(`Lỗi khi lấy kích thước hình ảnh ${imageUrl}:`, error);
        return { width: undefined, height: undefined };
    }
}
// Hàm chuẩn hóa đường dẫn URL
function normalizeUrl(src, baseUrl) {
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