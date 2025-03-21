"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeDescription = void 0;
exports.nodeDescription = {
    displayName: 'Web Crawler',
    name: 'webCrawler',
    icon: 'file:icon.png',
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
                    description: 'Lấy ngẫu nhiên một bài viết từ trang web',
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
        {
            displayName: 'Lọc hình ảnh theo kích thước',
            name: 'filterImagesBySize',
            type: 'boolean',
            default: false,
            description: 'Chỉ lấy hình ảnh có kích thước lớn hơn giá trị đã chỉ định',
            displayOptions: {
                show: {
                    operation: ['crawlPage'],
                },
            },
        },
        {
            displayName: 'Kích thước tối thiểu (px)',
            name: 'minImageSize',
            type: 'number',
            default: 300,
            description: 'Chỉ lấy hình ảnh có kích thước (chiều rộng hoặc chiều cao) lớn hơn giá trị này',
            displayOptions: {
                show: {
                    operation: ['crawlPage'],
                    filterImagesBySize: [true],
                },
            },
        },
        {
            displayName: 'Kiểm tra kích thước thực tế của hình ảnh',
            name: 'checkActualImageSize',
            type: 'boolean',
            default: true,
            description: 'Tải hình ảnh để kiểm tra kích thước thực (chậm hơn nhưng chính xác hơn)',
            displayOptions: {
                show: {
                    operation: ['crawlPage'],
                    filterImagesBySize: [true],
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
            displayName: 'Selector cho nội dung bài viết',
            name: 'contentSelector',
            type: 'string',
            default: '.content, .entry, .post-content',
            description: 'CSS selector để lấy nội dung bài viết',
            displayOptions: {
                show: {
                    operation: ['randomArticle'],
                },
            },
        },
        {
            displayName: 'Lấy nội dung đầy đủ của bài viết',
            name: 'fetchFullContent',
            type: 'boolean',
            default: true,
            description: 'Tự động truy cập vào liên kết bài viết để lấy nội dung đầy đủ',
            displayOptions: {
                show: {
                    operation: ['randomArticle'],
                },
            },
        },
    ],
};
//# sourceMappingURL=nodeDescription.js.map