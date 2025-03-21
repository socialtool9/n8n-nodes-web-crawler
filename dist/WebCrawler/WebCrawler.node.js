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
const mysql = __importStar(require("mysql2/promise"));
const pg = __importStar(require("pg"));
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
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    default: 'crawlPage',
                    options: [
                        {
                            name: 'Cào Dữ Liệu Trang Web',
                            value: 'crawlPage',
                            description: 'Truy cập URL và lấy nội dung văn bản cùng đường dẫn hình ảnh',
                        },
                        {
                            name: 'Lấy Bài Viết Ngẫu Nhiên',
                            value: 'randomArticle',
                            description: 'Lấy ngẫu nhiên một bài viết từ trang web và lưu vào cơ sở dữ liệu',
                        },
                        {
                            name: 'Lấy Bài Viết Từ Cơ Sở Dữ Liệu',
                            value: 'getFromDatabase',
                            description: 'Lấy bài viết đã lưu từ cơ sở dữ liệu',
                        },
                    ],
                },
                // Các trường chung
                {
                    displayName: 'URL',
                    name: 'url',
                    type: 'string',
                    default: '',
                    placeholder: 'https://example.com',
                    description: 'URL của trang web cần cào dữ liệu',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['crawlPage', 'randomArticle'],
                        },
                    },
                },
                // Trường cho việc cào trang
                {
                    displayName: 'Selector cho nội dung văn bản',
                    name: 'textSelector',
                    type: 'string',
                    default: 'body',
                    description: 'CSS selector để lựa chọn phần tử chứa nội dung văn bản',
                    displayOptions: {
                        show: {
                            operation: ['crawlPage'],
                        },
                    },
                },
                {
                    displayName: 'Selector cho hình ảnh',
                    name: 'imageSelector',
                    type: 'string',
                    default: 'img',
                    description: 'CSS selector để lựa chọn các phần tử hình ảnh',
                    displayOptions: {
                        show: {
                            operation: ['crawlPage'],
                        },
                    },
                },
                // Trường cho việc lấy bài viết ngẫu nhiên
                {
                    displayName: 'Selector cho bài viết',
                    name: 'articleSelector',
                    type: 'string',
                    default: 'article, .post, .article',
                    description: 'CSS selector để lựa chọn các phần tử bài viết',
                    displayOptions: {
                        show: {
                            operation: ['randomArticle'],
                        },
                    },
                },
                {
                    displayName: 'Selector cho tiêu đề bài viết',
                    name: 'titleSelector',
                    type: 'string',
                    default: 'h1, h2, .title',
                    description: 'CSS selector để lựa chọn tiêu đề bài viết',
                    displayOptions: {
                        show: {
                            operation: ['randomArticle'],
                        },
                    },
                },
                {
                    displayName: 'Selector cho liên kết bài viết',
                    name: 'linkSelector',
                    type: 'string',
                    default: 'a',
                    description: 'CSS selector để lựa chọn liên kết bài viết',
                    displayOptions: {
                        show: {
                            operation: ['randomArticle'],
                        },
                    },
                },
                {
                    displayName: 'Loại cơ sở dữ liệu',
                    name: 'databaseType',
                    type: 'options',
                    default: 'mysql',
                    options: [
                        {
                            name: 'MySQL',
                            value: 'mysql',
                        },
                        {
                            name: 'PostgreSQL',
                            value: 'postgresql',
                        },
                    ],
                    displayOptions: {
                        show: {
                            operation: ['randomArticle', 'getFromDatabase'],
                        },
                    },
                },
                {
                    displayName: 'Kết nối cơ sở dữ liệu',
                    name: 'databaseConnection',
                    type: 'string',
                    default: '',
                    placeholder: 'mysql://user:password@localhost:3306/database',
                    description: 'Chuỗi kết nối đến cơ sở dữ liệu',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['randomArticle', 'getFromDatabase'],
                        },
                    },
                },
                {
                    displayName: 'Tên bảng',
                    name: 'tableName',
                    type: 'string',
                    default: 'web_articles',
                    description: 'Tên bảng lưu trữ bài viết',
                    displayOptions: {
                        show: {
                            operation: ['randomArticle', 'getFromDatabase'],
                        },
                    },
                },
                {
                    displayName: 'ID Bài Viết',
                    name: 'articleId',
                    type: 'string',
                    default: '',
                    description: 'ID của bài viết cần lấy từ cơ sở dữ liệu',
                    displayOptions: {
                        show: {
                            operation: ['getFromDatabase'],
                        },
                    },
                },
                {
                    displayName: 'Tạo bảng nếu chưa tồn tại',
                    name: 'createTableIfNotExists',
                    type: 'boolean',
                    default: true,
                    description: 'Tạo bảng trong cơ sở dữ liệu nếu chưa tồn tại',
                    displayOptions: {
                        show: {
                            operation: ['randomArticle'],
                        },
                    },
                },
            ],
        };
    }
    // Hàm để tạo bảng MySQL
    static async createMySQLTable(connection, tableName) {
        const createTableQuery = `
			CREATE TABLE IF NOT EXISTS ${tableName} (
				id VARCHAR(100) PRIMARY KEY,
				title VARCHAR(500) NOT NULL,
				link VARCHAR(1000) NOT NULL,
				content TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`;
        await connection.query(createTableQuery);
    }
    // Hàm để tạo bảng PostgreSQL
    static async createPostgresTable(client, tableName) {
        const createTableQuery = `
			CREATE TABLE IF NOT EXISTS ${tableName} (
				id VARCHAR(100) PRIMARY KEY,
				title VARCHAR(500) NOT NULL,
				link VARCHAR(1000) NOT NULL,
				content TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`;
        await client.query(createTableQuery);
    }
    // Hàm để lưu bài viết vào MySQL
    static async saveArticleToMySQL(connection, tableName, articleId, title, link, content = '') {
        const insertQuery = `
			INSERT INTO ${tableName} (id, title, link, content)
			VALUES (?, ?, ?, ?)
		`;
        await connection.query(insertQuery, [articleId, title, link, content]);
    }
    // Hàm để lưu bài viết vào PostgreSQL
    static async saveArticleToPostgres(client, tableName, articleId, title, link, content = '') {
        const insertQuery = `
			INSERT INTO ${tableName} (id, title, link, content)
			VALUES ($1, $2, $3, $4)
		`;
        await client.query(insertQuery, [articleId, title, link, content]);
    }
    // Hàm để lấy bài viết từ MySQL theo ID
    static async getArticleFromMySQL(connection, tableName, articleId) {
        const selectQuery = `
			SELECT * FROM ${tableName} WHERE id = ?
		`;
        const [rows] = await connection.query(selectQuery, [articleId]);
        if (Array.isArray(rows) && rows.length > 0) {
            return rows[0];
        }
        throw new Error(`Không tìm thấy bài viết với ID: ${articleId}`);
    }
    // Hàm để lấy bài viết từ PostgreSQL theo ID
    static async getArticleFromPostgres(client, tableName, articleId) {
        const selectQuery = `
			SELECT * FROM ${tableName} WHERE id = $1
		`;
        const result = await client.query(selectQuery, [articleId]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        throw new Error(`Không tìm thấy bài viết với ID: ${articleId}`);
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        // Lấy loại thao tác
        const operation = this.getNodeParameter('operation', 0);
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                if (operation === 'crawlPage') {
                    // Thực hiện cào dữ liệu trang web như trước đây
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
                else if (operation === 'randomArticle') {
                    // Lấy các tham số
                    const url = this.getNodeParameter('url', itemIndex);
                    const articleSelector = this.getNodeParameter('articleSelector', itemIndex);
                    const titleSelector = this.getNodeParameter('titleSelector', itemIndex);
                    const linkSelector = this.getNodeParameter('linkSelector', itemIndex);
                    const databaseType = this.getNodeParameter('databaseType', itemIndex);
                    const databaseConnection = this.getNodeParameter('databaseConnection', itemIndex);
                    const tableName = this.getNodeParameter('tableName', itemIndex);
                    const createTableIfNotExists = this.getNodeParameter('createTableIfNotExists', itemIndex);
                    // Gửi yêu cầu HTTP
                    const response = await axios_1.default.get(url);
                    const html = response.data;
                    // Load HTML vào Cheerio
                    const $ = cheerio.load(html);
                    // Tìm tất cả các bài viết
                    const articles = [];
                    $(articleSelector).each((_, articleElement) => {
                        // Trích xuất tiêu đề
                        const title = $(articleElement).find(titleSelector).first().text().trim();
                        // Trích xuất liên kết
                        let link = $(articleElement).find(linkSelector).first().attr('href') || '';
                        // Chuẩn hóa đường dẫn
                        if (link && link.startsWith('/')) {
                            const urlObj = new URL(url);
                            link = `${urlObj.origin}${link}`;
                        }
                        else if (link && !link.startsWith('http')) {
                            const urlObj = new URL(url);
                            link = `${urlObj.origin}/${link}`;
                        }
                        if (title && link) {
                            articles.push({ title, link });
                        }
                    });
                    // Kiểm tra có bài viết không
                    if (articles.length === 0) {
                        throw new Error(`Không tìm thấy bài viết nào với selector: ${articleSelector}`);
                    }
                    // Chọn ngẫu nhiên 1 bài viết
                    const randomIndex = Math.floor(Math.random() * articles.length);
                    const selectedArticle = articles[randomIndex];
                    // Tạo ID ngẫu nhiên cho bài viết
                    const articleId = `article_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                    // Kết nối và lưu vào cơ sở dữ liệu
                    let dbResult;
                    if (databaseType === 'mysql') {
                        const connection = await mysql.createConnection(databaseConnection);
                        try {
                            if (createTableIfNotExists) {
                                await WebCrawler.createMySQLTable(connection, tableName);
                            }
                            // Lấy nội dung bài viết nếu cần
                            let content = '';
                            try {
                                const articleResponse = await axios_1.default.get(selectedArticle.link);
                                const articleHtml = articleResponse.data;
                                const $article = cheerio.load(articleHtml);
                                content = $article('body').text().trim();
                                selectedArticle.content = content;
                            }
                            catch (error) {
                                // Bỏ qua lỗi khi lấy nội dung bài viết
                                console.error(`Không thể lấy nội dung từ ${selectedArticle.link}:`, error);
                            }
                            await WebCrawler.saveArticleToMySQL(connection, tableName, articleId, selectedArticle.title, selectedArticle.link, content);
                            dbResult = {
                                success: true,
                                id: articleId,
                                type: 'mysql',
                            };
                        }
                        finally {
                            await connection.end();
                        }
                    }
                    else if (databaseType === 'postgresql') {
                        const client = new pg.Client(databaseConnection);
                        await client.connect();
                        try {
                            if (createTableIfNotExists) {
                                await WebCrawler.createPostgresTable(client, tableName);
                            }
                            // Lấy nội dung bài viết nếu cần
                            let content = '';
                            try {
                                const articleResponse = await axios_1.default.get(selectedArticle.link);
                                const articleHtml = articleResponse.data;
                                const $article = cheerio.load(articleHtml);
                                content = $article('body').text().trim();
                                selectedArticle.content = content;
                            }
                            catch (error) {
                                // Bỏ qua lỗi khi lấy nội dung bài viết
                                console.error(`Không thể lấy nội dung từ ${selectedArticle.link}:`, error);
                            }
                            await WebCrawler.saveArticleToPostgres(client, tableName, articleId, selectedArticle.title, selectedArticle.link, content);
                            dbResult = {
                                success: true,
                                id: articleId,
                                type: 'postgresql',
                            };
                        }
                        finally {
                            await client.end();
                        }
                    }
                    else {
                        throw new Error(`Loại cơ sở dữ liệu không được hỗ trợ: ${databaseType}`);
                    }
                    // Chuẩn bị dữ liệu đầu ra
                    const newItem = {
                        json: {
                            operation: 'randomArticle',
                            databaseType,
                            articleId,
                            tableName,
                            article: selectedArticle,
                            database: dbResult,
                            message: `Đã lưu bài viết "${selectedArticle.title}" vào cơ sở dữ liệu ${databaseType}`,
                        },
                    };
                    returnData.push(newItem);
                }
                else if (operation === 'getFromDatabase') {
                    // Lấy các tham số
                    const databaseType = this.getNodeParameter('databaseType', itemIndex);
                    const databaseConnection = this.getNodeParameter('databaseConnection', itemIndex);
                    const tableName = this.getNodeParameter('tableName', itemIndex);
                    const articleId = this.getNodeParameter('articleId', itemIndex);
                    // Lấy dữ liệu từ cơ sở dữ liệu
                    let article;
                    if (databaseType === 'mysql') {
                        const connection = await mysql.createConnection(databaseConnection);
                        try {
                            article = await WebCrawler.getArticleFromMySQL(connection, tableName, articleId);
                        }
                        finally {
                            await connection.end();
                        }
                    }
                    else if (databaseType === 'postgresql') {
                        const client = new pg.Client(databaseConnection);
                        await client.connect();
                        try {
                            article = await WebCrawler.getArticleFromPostgres(client, tableName, articleId);
                        }
                        finally {
                            await client.end();
                        }
                    }
                    else {
                        throw new Error(`Loại cơ sở dữ liệu không được hỗ trợ: ${databaseType}`);
                    }
                    // Nếu có link bài viết, cập nhật lại nội dung mới nhất
                    if (article && article.link) {
                        try {
                            const articleResponse = await axios_1.default.get(article.link);
                            const articleHtml = articleResponse.data;
                            const $article = cheerio.load(articleHtml);
                            const freshContent = $article('body').text().trim();
                            article.fresh_content = freshContent;
                        }
                        catch (error) {
                            // Bỏ qua lỗi khi lấy nội dung mới
                            console.error(`Không thể lấy nội dung mới từ ${article.link}:`, error);
                        }
                    }
                    // Chuẩn bị dữ liệu đầu ra
                    const newItem = {
                        json: {
                            operation: 'getFromDatabase',
                            databaseType,
                            tableName,
                            article,
                            message: `Đã lấy bài viết từ cơ sở dữ liệu ${databaseType}`,
                        },
                    };
                    returnData.push(newItem);
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