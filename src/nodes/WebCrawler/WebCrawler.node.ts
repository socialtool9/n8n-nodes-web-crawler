import { IExecuteFunctions } from 'n8n-workflow';
import {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

import { webCrawlerDescription } from './descriptions/WebCrawlerDescription';
import * as crawlPageMethod from './methods/crawlPage';
import * as googleImageSearchMethod from './methods/googleImageSearch';
import * as randomArticleMethod from './methods/randomArticle';

export class WebCrawler implements INodeType {
  description: INodeTypeDescription = webCrawlerDescription;

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

          const result = await crawlPageMethod.execute(
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
          
          // Tham số mới cho phân trang
          const accessMultiplePages = this.getNodeParameter('accessMultiplePages', itemIndex, false) as boolean;
          let paginationSelector = '';
          let maxPages = 1;
          
          if (accessMultiplePages) {
            paginationSelector = this.getNodeParameter('paginationSelector', itemIndex, '') as string;
            maxPages = this.getNodeParameter('maxPages', itemIndex, 3) as number;
          }
          
          // Tham số cho proxy và timeout
          const useProxies = this.getNodeParameter('useProxies', itemIndex, false) as boolean;
          let proxyList = '';
          if (useProxies) {
            proxyList = this.getNodeParameter('proxyList', itemIndex, '') as string;
          }
          const requestTimeout = this.getNodeParameter('requestTimeout', itemIndex, 30000) as number;

          const result = await randomArticleMethod.execute(
            url,
            articleSelector,
            titleSelector,
            linkSelector,
            contentSelector,
            fetchFullContent,
            paginationSelector,
            maxPages,
            useProxies,
            proxyList,
            requestTimeout
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
                    
          // Lấy thông tin proxy
          const useProxies = this.getNodeParameter('useProxies', itemIndex, false) as boolean;
          let proxyList = '';
          
          if (useProxies) {
            proxyList = this.getNodeParameter('proxyList', itemIndex, '') as string;
          }
          
          // Lấy thông tin timeout
          const requestTimeout = this.getNodeParameter('requestTimeout', itemIndex, 30000) as number;

          const result = await googleImageSearchMethod.execute(
            keyword,
            maxImages,
            minImageSize,
            filterBySize,
            useProxies,
            proxyList,
            requestTimeout
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