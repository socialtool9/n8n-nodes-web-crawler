import { INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';

export const webCrawlerDescription: INodeTypeDescription = {
	displayName: 'Web Crawler',
	name: 'webCrawler',
	icon: 'file:icon.png',
	group: ['transform'],
	version: 1,
	subtitle: '={{$parameter["operation"]}}',
	description: 'Cào dữ liệu từ trang web, trích xuất nội dung và hình ảnh',
	defaults: {
		name: 'Web Crawler',
	},
	inputs: [
		{
			type: NodeConnectionType.Main,
			displayName: 'Input',
		}
	],
	outputs: [
		{
			type: NodeConnectionType.Main,
			displayName: 'Output',
		}
	],
	properties: [
		{
			displayName: 'Thao Tác',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			options: [
				{
					name: 'Cào Dữ Liệu Trang Web',
					value: 'crawlPage',
					description: 'Cào và trích xuất dữ liệu từ trang web',
					action: 'Crawl page',
				},
				{
					name: 'Lấy Bài Viết Ngẫu Nhiên',
					value: 'randomArticle',
					description: 'Lấy bài viết ngẫu nhiên từ trang web và lưu vào cơ sở dữ liệu',
					action: 'Get random article',
				},
				{
					name: 'Tìm Kiếm Ảnh Google',
					value: 'googleImageSearch',
					description: 'Tìm kiếm ảnh từ Google theo từ khóa',
					action: 'Google image search',
				},
			],
			default: 'crawlPage',
		},
		
		// ----------------------------------
		//        crawlPage operation
		// ----------------------------------
		{
			displayName: 'URL',
			name: 'url',
			type: 'string',
			default: '',
			required: true,
			description: 'URL của trang web cần cào dữ liệu',
			displayOptions: {
				show: {
					operation: [
						'crawlPage',
					],
				},
			},
		},
		{
			displayName: 'Selector cho nội dung văn bản',
			name: 'textSelector',
			type: 'string',
			default: 'body',
			description: 'CSS selector cho phần tử chứa nội dung văn bản',
			displayOptions: {
				show: {
					operation: [
						'crawlPage',
					],
				},
			},
		},
		{
			displayName: 'Selector cho hình ảnh',
			name: 'imageSelector',
			type: 'string',
			default: 'img',
			description: 'CSS selector cho các phần tử hình ảnh',
			displayOptions: {
				show: {
					operation: [
						'crawlPage',
					],
				},
			},
		},
		{
			displayName: 'Lọc hình ảnh theo kích thước',
			name: 'filterImagesBySize',
			type: 'boolean',
			default: false,
			description: 'Bật/tắt tính năng lọc hình ảnh theo kích thước',
			displayOptions: {
				show: {
					operation: [
						'crawlPage',
					],
				},
			},
		},
		{
			displayName: 'Kích thước tối thiểu (px)',
			name: 'minImageSize',
			type: 'number',
			default: 300,
			description: 'Chỉ lấy hình ảnh có chiều rộng hoặc chiều cao lớn hơn giá trị này',
			displayOptions: {
				show: {
					operation: [
						'crawlPage',
					],
					filterImagesBySize: [
						true,
					],
				},
			},
		},
		{
			displayName: 'Kiểm tra kích thước thực tế',
			name: 'checkActualImageSize',
			type: 'boolean',
			default: true,
			description: 'Tải hình ảnh để kiểm tra kích thước thực (chậm hơn nhưng chính xác hơn)',
			displayOptions: {
				show: {
					operation: [
						'crawlPage',
					],
					filterImagesBySize: [
						true,
					],
				},
			},
		},

		// ----------------------------------
		//        randomArticle operation
		// ----------------------------------
		{
			displayName: 'URL',
			name: 'url',
			type: 'string',
			default: '',
			required: true,
			description: 'URL của trang web cần lấy bài viết',
			displayOptions: {
				show: {
					operation: [
						'randomArticle',
					],
				},
			},
		},
		{
			displayName: 'Selector cho bài viết',
			name: 'articleSelector',
			type: 'string',
			default: 'article',
			description: 'CSS selector cho các phần tử bài viết',
			displayOptions: {
				show: {
					operation: [
						'randomArticle',
					],
				},
			},
		},
		{
			displayName: 'Selector cho tiêu đề',
			name: 'titleSelector',
			type: 'string',
			default: 'h2',
			description: 'CSS selector cho tiêu đề bài viết',
			displayOptions: {
				show: {
					operation: [
						'randomArticle',
					],
				},
			},
		},
		{
			displayName: 'Selector cho liên kết',
			name: 'linkSelector',
			type: 'string',
			default: 'a',
			description: 'CSS selector cho liên kết bài viết',
			displayOptions: {
				show: {
					operation: [
						'randomArticle',
					],
				},
			},
		},
		{
			displayName: 'Selector cho nội dung',
			name: 'contentSelector',
			type: 'string',
			default: '.content',
			description: 'CSS selector cho nội dung bài viết',
			displayOptions: {
				show: {
					operation: [
						'randomArticle',
					],
				},
			},
		},
		{
			displayName: 'Lấy nội dung đầy đủ',
			name: 'fetchFullContent',
			type: 'boolean',
			default: true,
			description: 'Tự động truy cập vào liên kết bài viết để lấy nội dung đầy đủ',
			displayOptions: {
				show: {
					operation: [
						'randomArticle',
					],
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
					operation: [
						'randomArticle',
					],
				},
			},
		},
		{
			displayName: 'Selector cho phân trang',
			name: 'paginationSelector',
			type: 'string',
			default: '.pagination a',
			description: 'CSS selector để tìm các liên kết phân trang',
			displayOptions: {
				show: {
					operation: [
						'randomArticle',
					],
					accessMultiplePages: [
						true,
					],
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
					operation: [
						'randomArticle',
					],
					accessMultiplePages: [
						true,
					],
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
					operation: [
						'randomArticle',
					],
				},
			},
		},
		{
			displayName: 'Danh sách Proxy',
			name: 'proxyList',
			type: 'string',
			default: 'http://user:pass@proxy1.example.com:8080,http://user:pass@proxy2.example.com:8080',
			description: 'Danh sách các proxy cách nhau bởi dấu phẩy',
			displayOptions: {
				show: {
					operation: [
						'randomArticle',
					],
					useProxies: [
						true,
					],
				},
			},
		},
		{
			displayName: 'Thời gian chờ tối đa',
			name: 'requestTimeout',
			type: 'number',
			default: 30000,
			description: 'Thời gian tối đa chờ phản hồi từ server (milliseconds)',
			displayOptions: {
				show: {
					operation: [
						'randomArticle',
					],
				},
			},
		},

		// ----------------------------------
		//        googleImageSearch operation
		// ----------------------------------
		{
			displayName: 'Từ khóa tìm kiếm',
			name: 'keyword',
			type: 'string',
			default: '',
			required: true,
			description: 'Từ khóa để tìm kiếm ảnh trên Google',
			displayOptions: {
				show: {
					operation: [
						'googleImageSearch',
					],
				},
			},
		},
		{
			displayName: 'Số lượng ảnh tối đa',
			name: 'maxImages',
			type: 'number',
			default: 5,
			description: 'Số lượng ảnh muốn lấy về',
			displayOptions: {
				show: {
					operation: [
						'googleImageSearch',
					],
				},
			},
		},
		{
			displayName: 'Lọc ảnh theo kích thước',
			name: 'filterBySize',
			type: 'boolean',
			default: true,
			description: 'Bật/tắt tính năng lọc ảnh theo kích thước',
			displayOptions: {
				show: {
					operation: [
						'googleImageSearch',
					],
				},
			},
		},
		{
			displayName: 'Kích thước tối thiểu (px)',
			name: 'minImageSize',
			type: 'number',
			default: 500,
			description: 'Chỉ lấy ảnh có chiều rộng hoặc chiều cao lớn hơn giá trị này',
			displayOptions: {
				show: {
					operation: [
						'googleImageSearch',
					],
					filterBySize: [
						true,
					],
				},
			},
		},
		{
			displayName: 'Sử dụng danh sách Proxy',
			name: 'useProxies',
			type: 'boolean',
			default: false,
			description: 'Bật/tắt tính năng sử dụng nhiều proxy khi kết nối đến Google Images',
			displayOptions: {
				show: {
					operation: [
						'googleImageSearch',
					],
				},
			},
		},
		{
			displayName: 'Danh sách Proxy',
			name: 'proxyList',
			type: 'string',
			default: 'http://user:pass@proxy1.example.com:8080,http://user:pass@proxy2.example.com:8080',
			description: 'Danh sách các proxy cách nhau bởi dấu phẩy',
			displayOptions: {
				show: {
					operation: [
						'googleImageSearch',
					],
					useProxies: [
						true,
					],
				},
			},
		},
		{
			displayName: 'Thời gian chờ tối đa',
			name: 'requestTimeout',
			type: 'number',
			default: 30000,
			description: 'Thời gian tối đa chờ phản hồi (nếu quá thời gian sẽ trả về kết quả rỗng)',
			displayOptions: {
				show: {
					operation: [
						'googleImageSearch',
					],
				},
			},
		},
	],
}; 