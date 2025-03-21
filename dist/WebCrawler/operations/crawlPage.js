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
exports.crawlPage = crawlPage;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const imageUtils_1 = require("../utils/imageUtils");
async function crawlPage(url, textSelector, imageSelector, filterImagesBySize, minImageSize, checkActualImageSize) {
    // Gửi yêu cầu HTTP
    const response = await axios_1.default.get(url);
    const html = response.data;
    // Load HTML vào Cheerio
    const $ = cheerio.load(html);
    // Trích xuất nội dung văn bản
    const textContent = $(textSelector).text().trim();
    // Trích xuất tất cả các liên kết hình ảnh
    const allImages = [];
    $(imageSelector).each((_, element) => {
        const src = $(element).attr('src');
        if (!src)
            return; // Bỏ qua nếu không có src
        // Kiểm tra kích thước từ thuộc tính HTML
        const width = parseInt($(element).attr('width') || '0', 10);
        const height = parseInt($(element).attr('height') || '0', 10);
        // Chuẩn hóa đường dẫn (Base64 sẽ được giữ nguyên)
        const fullSrc = (0, imageUtils_1.normalizeUrl)(src, url);
        allImages.push({ src: fullSrc, width, height });
    });
    console.log(`Tìm thấy ${allImages.length} hình ảnh trên trang`);
    // Lọc hình ảnh theo kích thước
    let imageLinks = [];
    let skippedForSize = 0;
    let skippedBase64Icons = 0;
    if (filterImagesBySize) {
        const filteredImages = [];
        for (const image of allImages) {
            // Kiểm tra nếu là ảnh base64
            if ((0, imageUtils_1.isBase64Image)(image.src)) {
                // Với base64, nếu đã biết kích thước từ HTML và quá nhỏ -> bỏ qua luôn
                if ((image.width && image.width < minImageSize && image.height && image.height < minImageSize)) {
                    skippedBase64Icons++;
                    continue;
                }
                // Nếu không biết kích thước và cần kiểm tra
                if (checkActualImageSize && (!image.width || !image.height)) {
                    try {
                        const dimensions = await (0, imageUtils_1.getImageSize)(image.src);
                        if (dimensions.width && dimensions.height &&
                            dimensions.width >= minImageSize || dimensions.height >= minImageSize) {
                            filteredImages.push(image.src);
                        }
                        else {
                            skippedBase64Icons++;
                        }
                    }
                    catch (error) {
                        console.error(`Lỗi khi kiểm tra kích thước ảnh base64:`, error);
                    }
                }
                else {
                    // Nếu không kiểm tra kích thước thực tế, thêm vào lọc
                    filteredImages.push(image.src);
                }
                continue;
            }
            // Xử lý ảnh thông thường (không phải base64)
            // Nếu kích thước từ HTML đã đáp ứng yêu cầu
            if ((image.width && image.width >= minImageSize) || (image.height && image.height >= minImageSize)) {
                filteredImages.push(image.src);
                continue;
            }
            // Nếu cần kiểm tra kích thước thực tế và chưa biết kích thước chính xác từ HTML
            if (checkActualImageSize && (!image.width || !image.height)) {
                try {
                    const dimensions = await (0, imageUtils_1.getImageSize)(image.src);
                    if ((dimensions.width && dimensions.width >= minImageSize) ||
                        (dimensions.height && dimensions.height >= minImageSize)) {
                        filteredImages.push(image.src);
                    }
                    else {
                        skippedForSize++;
                    }
                }
                catch (error) {
                    console.error(`Lỗi khi kiểm tra kích thước ảnh: ${image.src}`, error);
                }
            }
            else {
                skippedForSize++;
            }
        }
        imageLinks = filteredImages;
    }
    else {
        // Nếu không lọc theo kích thước, lấy tất cả đường dẫn hình ảnh
        imageLinks = allImages.map(img => img.src);
    }
    // Chuẩn bị dữ liệu đầu ra
    return {
        json: {
            url,
            textContent,
            imageLinks,
            imageCount: imageLinks.length,
            filterDetails: filterImagesBySize ? {
                filtered: true,
                minImageSize,
                originalCount: allImages.length,
                filteredCount: imageLinks.length,
                skippedForSize,
                skippedBase64Icons
            } : {
                filtered: false
            }
        },
    };
}
//# sourceMappingURL=crawlPage.js.map