import { INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';

export const nodeDescription: INodeTypeDescription = {
    displayName: 'Web Crawler',
    name: 'webCrawler',
    icon: 'file:icon.png',
    group: ['transform'],
    version: 1,
    description: 'Truy cập URL và lấy nội dung văn bản cùng đường dẫn hình ảnh',
    defaults: {
        name: 'Web Crawler',
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
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
                {
                    name: 'Tìm Kiếm Ảnh Google',
                    value: 'googleImageSearch',
                    description: 'Tìm kiếm ảnh từ Google theo từ khóa',
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

        // Trường cho việc tìm kiếm ảnh Google
        {
            displayName: 'Từ khóa tìm kiếm',
            name: 'keyword',
            type: 'string',
            default: '',
            placeholder: 'nature landscape',
            description: 'Từ khóa để tìm kiếm ảnh trên Google',
            required: true,
            displayOptions: {
                show: {
                    operation: ['googleImageSearch'],
                },
            },
        },
        {
            displayName: 'Số lượng ảnh tối đa',
            name: 'maxImages',
            type: 'number',
            default: 5,
            description: 'Số lượng ảnh tối đa sẽ được lấy về',
            displayOptions: {
                show: {
                    operation: ['googleImageSearch'],
                },
            },
        },
        {
            displayName: 'Lọc ảnh theo kích thước',
            name: 'filterBySize',
            type: 'boolean',
            default: true,
            description: 'Chỉ lấy ảnh có kích thước lớn hơn giá trị đã chỉ định',
            displayOptions: {
                show: {
                    operation: ['googleImageSearch'],
                },
            },
        },
        {
            displayName: 'Kích thước tối thiểu (px)',
            name: 'minImageSize',
            type: 'number',
            default: 500,
            description: 'Chỉ lấy ảnh có kích thước (chiều rộng hoặc chiều cao) lớn hơn giá trị này',
            displayOptions: {
                show: {
                    operation: ['googleImageSearch'],
                    filterBySize: [true],
                },
            },
        },
        {
            displayName: 'Sử dụng Proxy',
            name: 'useProxy',
            type: 'boolean',
            default: false,
            description: 'Sử dụng proxy để kết nối đến Google Images, giúp tránh bị chặn',
            displayOptions: {
                show: {
                    operation: ['googleImageSearch'],
                },
            },
        },
        {
            displayName: 'URL Proxy',
            name: 'proxyUrl',
            type: 'string',
            default: '',
            placeholder: 'http://user:password@proxy.example.com:8080',
            description: 'URL của proxy theo định dạng: http(s)://[user:password@]proxy.example.com:port',
            displayOptions: {
                show: {
                    operation: ['googleImageSearch'],
                    useProxy: [true],
                },
            },
        },
        {
            displayName: 'Thời gian chờ tối đa (ms)',
            name: 'requestTimeout',
            type: 'number',
            default: 30000,
            description: 'Thời gian tối đa chờ phản hồi từ server (milliseconds), nếu quá thời gian sẽ trả về kết quả rỗng',
            displayOptions: {
                show: {
                    operation: ['googleImageSearch'],
                },
            },
        },
        {
            displayName: 'Sử dụng danh sách Proxy',
            name: 'useProxies',
            type: 'boolean',
            default: false,
            description: 'Sử dụng nhiều proxy thay thế để tránh bị chặn',
            displayOptions: {
                show: {
                    operation: ['googleImageSearch', 'randomArticle'],
                },
            },
        },
        {
            displayName: 'Danh sách Proxy',
            name: 'proxyList',
            type: 'string',
            default: '',
            placeholder: 'http://proxy1.com:8080,http://proxy2.com:8080',
            description: 'Danh sách các proxy cách nhau bởi dấu phẩy, một proxy sẽ được chọn ngẫu nhiên cho mỗi request',
            displayOptions: {
                show: {
                    operation: ['googleImageSearch', 'randomArticle'],
                    useProxies: [true],
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
        {
            displayName: 'Truy cập nhiều trang',
            name: 'accessMultiplePages',
            type: 'boolean',
            default: false,
            description: 'Duyệt qua nhiều trang để tìm bài viết ngẫu nhiên',
            displayOptions: {
                show: {
                    operation: ['randomArticle'],
                },
            },
        },
        {
            displayName: 'Selector cho phân trang',
            name: 'paginationSelector',
            type: 'string',
            default: '.pagination a, .nav-links a, .page-numbers',
            description: 'CSS selector để tìm các liên kết phân trang',
            displayOptions: {
                show: {
                    operation: ['randomArticle'],
                    accessMultiplePages: [true],
                },
            },
        },
        {
            displayName: 'Số trang tối đa',
            name: 'maxPages',
            type: 'number',
            default: 3,
            description: 'Số trang tối đa sẽ được duyệt qua để tìm bài viết',
            displayOptions: {
                show: {
                    operation: ['randomArticle'],
                    accessMultiplePages: [true],
                },
            },
        },
        {
            displayName: 'Thời gian chờ tối đa (ms)',
            name: 'requestTimeout',
            type: 'number',
            default: 30000,
            description: 'Thời gian tối đa chờ phản hồi từ server (milliseconds)',
            displayOptions: {
                show: {
                    operation: ['randomArticle'],
                },
            },
        },
    ],
}; 