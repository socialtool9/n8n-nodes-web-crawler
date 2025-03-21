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
exports.WebCrawler = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
class WebCrawler {
    constructor() {
        this.description = {
            displayName: 'Web Crawler',
            name: 'webCrawler',
            group: ['transform'],
            version: 1,
            description: 'Truy cập URL và lấy nội dung văn bản cùng đường dẫn hình ảnh',
            defaults: {
                name: 'Web Crawler',
            },
            inputs: ["main" /* NodeConnectionType.Main */],
            outputs: ["main" /* NodeConnectionType.Main */],
            properties: [
                {
                    displayName: 'URL',
                    name: 'url',
                    type: 'string',
                    default: '',
                    placeholder: 'https://example.com',
                    description: 'URL của trang web cần cào dữ liệu',
                    required: true,
                },
                {
                    displayName: 'Selector cho nội dung văn bản',
                    name: 'textSelector',
                    type: 'string',
                    default: 'body',
                    description: 'CSS selector để lựa chọn phần tử chứa nội dung văn bản',
                },
                {
                    displayName: 'Selector cho hình ảnh',
                    name: 'imageSelector',
                    type: 'string',
                    default: 'img',
                    description: 'CSS selector để lựa chọn các phần tử hình ảnh',
                }
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                // Lấy các tham số
                const url = this.getNodeParameter('url', itemIndex);
                const textSelector = this.getNodeParameter('textSelector', itemIndex);
                const imageSelector = this.getNodeParameter('imageSelector', itemIndex);
                // Gửi yêu cầu HTTP
                const response = await axios_1.default.get(url);
                const html = response.data;
                // Load HTML vào Cheerio
                const $ = cheerio.load(html);
                // Trích xuất nội dung văn bản
                const textContent = $(textSelector).text().trim();
                // Trích xuất tất cả các liên kết hình ảnh
                const imageLinks = [];
                $(imageSelector).each((_, element) => {
                    const src = $(element).attr('src');
                    if (src) {
                        // Chuyển đổi đường dẫn tương đối thành tuyệt đối nếu cần
                        if (src.startsWith('//')) {
                            imageLinks.push(`https:${src}`);
                        }
                        else if (src.startsWith('/')) {
                            const urlObj = new URL(url);
                            imageLinks.push(`${urlObj.origin}${src}`);
                        }
                        else if (!src.startsWith('http')) {
                            const urlObj = new URL(url);
                            imageLinks.push(`${urlObj.origin}/${src}`);
                        }
                        else {
                            imageLinks.push(src);
                        }
                    }
                });
                // Chuẩn bị dữ liệu đầu ra
                const newItem = {
                    json: {
                        url,
                        textContent,
                        imageLinks,
                        imageCount: imageLinks.length,
                    },
                };
                returnData.push(newItem);
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                        },
                    });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.WebCrawler = WebCrawler;
//# sourceMappingURL=WebCrawler.node.js.map