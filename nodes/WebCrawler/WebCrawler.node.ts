import { IExecuteFunctions } from 'n8n-workflow';
import { INodeExecutionData, INodeType } from 'n8n-workflow';
import { nodeDescription } from './nodeDescription';
import { crawlPage } from './operations/crawlPage';
import { getRandomArticle } from './operations/randomArticle';
import { googleImageSearch } from './operations/googleImageSearch';

export class WebCrawler implements INodeType {
	description = nodeDescription;

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

					const result = await crawlPage(
						url,
						textSelector,
						imageSelector,
						filterImagesBySize,
						minImageSize,
						checkActualImageSize
					);

					returnData.push(result);
				} else if (operation === 'randomArticle') {
					// Lấy các tham số
					const url = this.getNodeParameter('url', itemIndex) as string;
					const articleSelector = this.getNodeParameter('articleSelector', itemIndex) as string;
					const titleSelector = this.getNodeParameter('titleSelector', itemIndex) as string;
					const linkSelector = this.getNodeParameter('linkSelector', itemIndex) as string;
					const contentSelector = this.getNodeParameter('contentSelector', itemIndex) as string;
					const fetchFullContent = this.getNodeParameter('fetchFullContent', itemIndex) as boolean;

					const result = await getRandomArticle(
						url,
						articleSelector,
						titleSelector,
						linkSelector,
						contentSelector,
						fetchFullContent
					);

					returnData.push(result);
				} else if (operation === 'googleImageSearch') {
					// Thực hiện tìm kiếm ảnh Google
					const keyword = this.getNodeParameter('keyword', itemIndex) as string;
					const maxImages = this.getNodeParameter('maxImages', itemIndex, 5) as number;
					const filterBySize = this.getNodeParameter('filterBySize', itemIndex, true) as boolean;
					let minImageSize = 500;
					
					if (filterBySize) {
						minImageSize = this.getNodeParameter('minImageSize', itemIndex, 500) as number;
					}

					const result = await googleImageSearch(
						keyword,
						maxImages,
						minImageSize,
						filterBySize
					);

					returnData.push(result);
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