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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebCrawler = void 0;
const WebCrawlerDescription_1 = require("./descriptions/WebCrawlerDescription");
const crawlPageMethod = __importStar(require("./methods/crawlPage"));
const googleImageSearchMethod = __importStar(require("./methods/googleImageSearch"));
const randomArticleMethod = __importStar(require("./methods/randomArticle"));
class WebCrawler {
    constructor() {
        this.description = WebCrawlerDescription_1.webCrawlerDescription;
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        // Lấy loại thao tác
        const operation = this.getNodeParameter('operation', 0);
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                if (operation === 'crawlPage') {
                    // Thực hiện cào dữ liệu trang web
                    const url = this.getNodeParameter('url', itemIndex);
                    const textSelector = this.getNodeParameter('textSelector', itemIndex);
                    const imageSelector = this.getNodeParameter('imageSelector', itemIndex);
                    // Tham số lọc hình ảnh theo kích thước
                    const filterImagesBySize = this.getNodeParameter('filterImagesBySize', itemIndex, false);
                    let minImageSize = 300;
                    let checkActualImageSize = true;
                    if (filterImagesBySize) {
                        minImageSize = this.getNodeParameter('minImageSize', itemIndex, 300);
                        checkActualImageSize = this.getNodeParameter('checkActualImageSize', itemIndex, true);
                    }
                    const result = await crawlPageMethod.execute(url, textSelector, imageSelector, filterImagesBySize, minImageSize, checkActualImageSize);
                    returnData.push(result);
                }
                else if (operation === 'randomArticle') {
                    // Lấy các tham số
                    const url = this.getNodeParameter('url', itemIndex);
                    const articleSelector = this.getNodeParameter('articleSelector', itemIndex);
                    const titleSelector = this.getNodeParameter('titleSelector', itemIndex);
                    const linkSelector = this.getNodeParameter('linkSelector', itemIndex);
                    const contentSelector = this.getNodeParameter('contentSelector', itemIndex);
                    const fetchFullContent = this.getNodeParameter('fetchFullContent', itemIndex);
                    // Tham số mới cho phân trang
                    const accessMultiplePages = this.getNodeParameter('accessMultiplePages', itemIndex, false);
                    let paginationSelector = '';
                    let maxPages = 1;
                    if (accessMultiplePages) {
                        paginationSelector = this.getNodeParameter('paginationSelector', itemIndex, '');
                        maxPages = this.getNodeParameter('maxPages', itemIndex, 3);
                    }
                    // Tham số cho proxy và timeout
                    const useProxies = this.getNodeParameter('useProxies', itemIndex, false);
                    let proxyList = '';
                    if (useProxies) {
                        proxyList = this.getNodeParameter('proxyList', itemIndex, '');
                    }
                    const requestTimeout = this.getNodeParameter('requestTimeout', itemIndex, 30000);
                    const result = await randomArticleMethod.execute(url, articleSelector, titleSelector, linkSelector, contentSelector, fetchFullContent, paginationSelector, maxPages, useProxies, proxyList, requestTimeout);
                    returnData.push(result);
                }
                else if (operation === 'googleImageSearch') {
                    // Thực hiện tìm kiếm ảnh Google
                    const keyword = this.getNodeParameter('keyword', itemIndex);
                    const maxImages = this.getNodeParameter('maxImages', itemIndex, 5);
                    const filterBySize = this.getNodeParameter('filterBySize', itemIndex, true);
                    let minImageSize = 500;
                    if (filterBySize) {
                        minImageSize = this.getNodeParameter('minImageSize', itemIndex, 500);
                    }
                    // Lấy thông tin proxy
                    const useProxies = this.getNodeParameter('useProxies', itemIndex, false);
                    let proxyList = '';
                    if (useProxies) {
                        proxyList = this.getNodeParameter('proxyList', itemIndex, '');
                    }
                    // Lấy thông tin timeout
                    const requestTimeout = this.getNodeParameter('requestTimeout', itemIndex, 30000);
                    const result = await googleImageSearchMethod.execute(keyword, maxImages, minImageSize, filterBySize, useProxies, proxyList, requestTimeout);
                    returnData.push(result);
                }
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