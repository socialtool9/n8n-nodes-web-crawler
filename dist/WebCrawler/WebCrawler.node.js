"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebCrawler = void 0;
const nodeDescription_1 = require("./nodeDescription");
const crawlPage_1 = require("./operations/crawlPage");
const randomArticle_1 = require("./operations/randomArticle");
class WebCrawler {
    constructor() {
        this.description = nodeDescription_1.nodeDescription;
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
                    const result = await (0, crawlPage_1.crawlPage)(url, textSelector, imageSelector, filterImagesBySize, minImageSize, checkActualImageSize);
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
                    const result = await (0, randomArticle_1.getRandomArticle)(url, articleSelector, titleSelector, linkSelector, contentSelector, fetchFullContent);
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