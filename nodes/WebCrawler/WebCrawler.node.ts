import { IExecuteFunctions } from 'n8n-workflow';
import { INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import sizeOf from 'image-size';

export class WebCrawler implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Web Crawler',
		name: 'webCrawler',
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

	// Hàm kiểm tra kích thước thực tế của hình ảnh
	private static async getImageSize(imageUrl: string): Promise<{ width?: number; height?: number }> {
		try {
			const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
			const buffer = Buffer.from(response.data, 'binary');
			const dimensions = sizeOf(buffer);
			return {
				width: dimensions.width,
				height: dimensions.height,
			};
		} catch (error) {
			console.error(`Lỗi khi lấy kích thước hình ảnh ${imageUrl}:`, error);
			return { width: undefined, height: undefined };
		}
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		
		// Lấy loại thao tác
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				if (operation === 'crawlPage') {
					// Thực hiện cào dữ liệu trang web
					const url = this.getNodeParameter('url', itemIndex) as string;
					const textSelector = this.getNodeParameter('textSelector', itemIndex) as string;
					const imageSelector = this.getNodeParameter('imageSelector', itemIndex) as string;
					
					// Tham số lọc hình ảnh theo kích thước
					const filterImagesBySize = this.getNodeParameter('filterImagesBySize', itemIndex, false) as boolean;
					let minImageSize = 300;
					let checkActualImageSize = true;
					
					if (filterImagesBySize) {
						minImageSize = this.getNodeParameter('minImageSize', itemIndex, 300) as number;
						checkActualImageSize = this.getNodeParameter('checkActualImageSize', itemIndex, true) as boolean;
					}

					// Gửi yêu cầu HTTP
					const response = await axios.get(url);
					const html = response.data;

					// Load HTML vào Cheerio
					const $ = cheerio.load(html);

					// Trích xuất nội dung văn bản
					const textContent = $(textSelector).text().trim();

					// Trích xuất tất cả các liên kết hình ảnh
					const allImages: Array<{ src: string; width?: number; height?: number }> = [];
					$(imageSelector).each((_, element) => {
						const src = $(element).attr('src');
						if (src) {
							// Kiểm tra kích thước từ thuộc tính HTML
							const width = parseInt($(element).attr('width') || '0', 10);
							const height = parseInt($(element).attr('height') || '0', 10);
							
							// Chuẩn hóa đường dẫn
							let fullSrc: string;
							if (src.startsWith('//')) {
								fullSrc = `https:${src}`;
							} else if (src.startsWith('/')) {
								const urlObj = new URL(url);
								fullSrc = `${urlObj.origin}${src}`;
							} else if (!src.startsWith('http')) {
								const urlObj = new URL(url);
								fullSrc = `${urlObj.origin}/${src}`;
							} else {
								fullSrc = src;
							}
							
							allImages.push({ src: fullSrc, width, height });
						}
					});
					
					// Lọc hình ảnh theo kích thước
					let imageLinks: string[] = [];
					
					if (filterImagesBySize) {
						const filteredImages = [];
						
						for (const image of allImages) {
							// Nếu kích thước từ HTML đã đáp ứng yêu cầu, không cần kiểm tra thêm
							if (
								(image.width && image.width >= minImageSize) || 
								(image.height && image.height >= minImageSize)
							) {
								filteredImages.push(image.src);
								continue;
							}
							
							// Nếu cần kiểm tra kích thước thực tế và chưa biết kích thước chính xác từ HTML
							if (checkActualImageSize && (!image.width || !image.height)) {
								try {
									const dimensions = await WebCrawler.getImageSize(image.src);
									
									if (
										(dimensions.width && dimensions.width >= minImageSize) || 
										(dimensions.height && dimensions.height >= minImageSize)
									) {
										filteredImages.push(image.src);
									}
								} catch (error) {
									console.error(`Lỗi khi kiểm tra kích thước hình ảnh ${image.src}:`, error);
								}
							}
						}
						
						imageLinks = filteredImages;
					} else {
						// Nếu không lọc theo kích thước, lấy tất cả đường dẫn hình ảnh
						imageLinks = allImages.map(img => img.src);
					}

					// Chuẩn bị dữ liệu đầu ra
					const newItem: INodeExecutionData = {
						json: {
							url,
							textContent,
							imageLinks,
							imageCount: imageLinks.length,
							filterDetails: filterImagesBySize ? {
								filtered: true,
								minImageSize,
								originalCount: allImages.length,
								filteredCount: imageLinks.length
							} : {
								filtered: false
							}
						},
					};

					returnData.push(newItem);
				} else if (operation === 'randomArticle') {
					// Lấy các tham số
					const url = this.getNodeParameter('url', itemIndex) as string;
					const articleSelector = this.getNodeParameter('articleSelector', itemIndex) as string;
					const titleSelector = this.getNodeParameter('titleSelector', itemIndex) as string;
					const linkSelector = this.getNodeParameter('linkSelector', itemIndex) as string;
					const contentSelector = this.getNodeParameter('contentSelector', itemIndex) as string;
					const fetchFullContent = this.getNodeParameter('fetchFullContent', itemIndex) as boolean;

					// Gửi yêu cầu HTTP
					const response = await axios.get(url);
					const html = response.data;

					// Load HTML vào Cheerio
					const $ = cheerio.load(html);

					// Tìm tất cả các bài viết
					const articles: Array<{ title: string; link: string; content?: string; images?: string[] }> = [];
					$(articleSelector).each((_, articleElement) => {
						// Trích xuất tiêu đề
						const title = $(articleElement).find(titleSelector).first().text().trim();
						
						// Trích xuất liên kết
						let link = $(articleElement).find(linkSelector).first().attr('href') || '';
						
						// Chuẩn hóa đường dẫn
						if (link && link.startsWith('/')) {
							const urlObj = new URL(url);
							link = `${urlObj.origin}${link}`;
						} else if (link && !link.startsWith('http')) {
							const urlObj = new URL(url);
							link = `${urlObj.origin}/${link}`;
						}
						
						// Trích xuất nội dung tóm tắt nếu có
						let content = '';
						if ($(articleElement).find(contentSelector).length > 0) {
							content = $(articleElement).find(contentSelector).first().text().trim();
						}
						
						// Trích xuất hình ảnh trong bài viết
						const images: string[] = [];
						$(articleElement).find('img').each((_, img) => {
							const src = $(img).attr('src');
							if (src) {
								// Chuẩn hóa đường dẫn
								let fullSrc: string;
								if (src.startsWith('//')) {
									fullSrc = `https:${src}`;
								} else if (src.startsWith('/')) {
									const urlObj = new URL(url);
									fullSrc = `${urlObj.origin}${src}`;
								} else if (!src.startsWith('http')) {
									const urlObj = new URL(url);
									fullSrc = `${urlObj.origin}/${src}`;
								} else {
									fullSrc = src;
								}
								
								images.push(fullSrc);
							}
						});
						
						if (title && link) {
							articles.push({ title, link, content, images });
						}
					});

					// Kiểm tra có bài viết không
					if (articles.length === 0) {
						throw new Error(`Không tìm thấy bài viết nào với selector: ${articleSelector}`);
					}

					// Chọn ngẫu nhiên 1 bài viết
					const randomIndex = Math.floor(Math.random() * articles.length);
					const selectedArticle = articles[randomIndex];

					// Lấy nội dung đầy đủ nếu cần
					if (fetchFullContent && selectedArticle.link) {
						try {
							const articleResponse = await axios.get(selectedArticle.link);
							const articleHtml = articleResponse.data;
							const $article = cheerio.load(articleHtml);
							
							// Cập nhật nội dung
							selectedArticle.content = $article(contentSelector).text().trim() || $article('body').text().trim();
							
							// Cập nhật hình ảnh
							$article('img').each((_, img) => {
								const src = $article(img).attr('src');
								if (src) {
									// Chuẩn hóa đường dẫn
									let fullSrc: string;
									if (src.startsWith('//')) {
										fullSrc = `https:${src}`;
									} else if (src.startsWith('/')) {
										const urlObj = new URL(selectedArticle.link);
										fullSrc = `${urlObj.origin}${src}`;
									} else if (!src.startsWith('http')) {
										const urlObj = new URL(selectedArticle.link);
										fullSrc = `${urlObj.origin}/${src}`;
									} else {
										fullSrc = src;
									}
									
									// Thêm vào danh sách nếu chưa có
									if (!selectedArticle.images?.includes(fullSrc)) {
										if (!selectedArticle.images) selectedArticle.images = [];
										selectedArticle.images.push(fullSrc);
									}
								}
							});
						} catch (error) {
							console.error(`Không thể lấy nội dung từ ${selectedArticle.link}:`, error);
						}
					}
					
					// Tạo ID ngẫu nhiên cho bài viết
					const articleId = `article_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
					
					// Chuẩn bị dữ liệu đầu ra
					const newItem: INodeExecutionData = {
						json: {
							operation: 'randomArticle',
							articleId,
							article: selectedArticle,
							message: `Đã lấy bài viết "${selectedArticle.title}" từ trang web`,
						},
					};

					returnData.push(newItem);
				}
			} catch (error: any) {
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