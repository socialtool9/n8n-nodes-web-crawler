import { IExecuteFunctions } from 'n8n-workflow';
import { INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Lấy các tham số
				const url = this.getNodeParameter('url', itemIndex) as string;
				const textSelector = this.getNodeParameter('textSelector', itemIndex) as string;
				const imageSelector = this.getNodeParameter('imageSelector', itemIndex) as string;

				// Gửi yêu cầu HTTP
				const response = await axios.get(url);
				const html = response.data;

				// Load HTML vào Cheerio
				const $ = cheerio.load(html);

				// Trích xuất nội dung văn bản
				const textContent = $(textSelector).text().trim();

				// Trích xuất tất cả các liên kết hình ảnh
				const imageLinks: string[] = [];
				$(imageSelector).each((_, element) => {
					const src = $(element).attr('src');
					if (src) {
						// Chuyển đổi đường dẫn tương đối thành tuyệt đối nếu cần
						if (src.startsWith('//')) {
							imageLinks.push(`https:${src}`);
						} else if (src.startsWith('/')) {
							const urlObj = new URL(url);
							imageLinks.push(`${urlObj.origin}${src}`);
						} else if (!src.startsWith('http')) {
							const urlObj = new URL(url);
							imageLinks.push(`${urlObj.origin}/${src}`);
						} else {
							imageLinks.push(src);
						}
					}
				});

				// Chuẩn bị dữ liệu đầu ra
				const newItem: INodeExecutionData = {
					json: {
						url,
						textContent,
						imageLinks,
						imageCount: imageLinks.length,
					},
				};

				returnData.push(newItem);
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