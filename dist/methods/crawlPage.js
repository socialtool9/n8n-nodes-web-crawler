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
const imageUtils_1 = require("../utils/imageUtils");
async function execute(url, textSelector, imageSelector, filterBySize = false, minImageSize = 0, checkActualSize = true) {
    try {
        // Gửi yêu cầu HTTP
        const response = await axios_1.default.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        // Trích xuất nội dung văn bản
        const textContent = $(textSelector).text().trim();
        // Trích xuất các liên kết hình ảnh
        const allImageElements = $(imageSelector);
        const allImageLinks = [];
        // Thống kê về hình ảnh đã lọc
        const stats = {
            filtered: filterBySize,
            minImageSize: filterBySize ? minImageSize : undefined,
            originalCount: allImageElements.length,
            filteredCount: 0,
            skippedForSize: 0,
            skippedBase64Icons: 0
        };
        for (let i = 0; i < allImageElements.length; i++) {
            const img = allImageElements[i];
            const srcAttribute = $(img).attr('src');
            if (srcAttribute) {
                const imageUrl = (0, imageUtils_1.normalizeImageUrl)(srcAttribute, url);
                if (imageUrl.startsWith('data:image')) {
                    if (!filterBySize) {
                        allImageLinks.push(imageUrl);
                        stats.filteredCount++;
                    }
                    else {
                        stats.skippedBase64Icons++;
                    }
                    continue;
                }
                if ((0, imageUtils_1.isValidImageUrl)(imageUrl)) {
                    if (filterBySize && minImageSize > 0) {
                        if (checkActualSize) {
                            // Kiểm tra kích thước thực tế
                            const size = await (0, imageUtils_1.getImageSize)(imageUrl);
                            if ((size.width && size.width >= minImageSize) ||
                                (size.height && size.height >= minImageSize)) {
                                allImageLinks.push(imageUrl);
                                stats.filteredCount++;
                            }
                            else {
                                stats.skippedForSize++;
                            }
                        }
                        else {
                            allImageLinks.push(imageUrl);
                            stats.filteredCount++;
                        }
                    }
                    else {
                        allImageLinks.push(imageUrl);
                        stats.filteredCount++;
                    }
                }
            }
        }
        return {
            json: {
                url,
                textContent,
                imageLinks: allImageLinks,
                imageCount: allImageLinks.length,
                filterDetails: stats
            },
        };
    }
    catch (error) {
        if (error instanceof Error) {
            return {
                json: {
                    url,
                    error: error.message,
                    success: false
                },
            };
        }
        return {
            json: {
                url,
                error: 'Lỗi không xác định',
                success: false
            },
        };
    }
}
//# sourceMappingURL=crawlPage.js.map