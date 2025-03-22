import { INodeExecutionData } from 'n8n-workflow';
/**
 * Lấy bài viết ngẫu nhiên từ trang web
 */
export declare function execute(url: string, articleSelector: string, titleSelector: string, linkSelector: string, contentSelector: string, fetchFullContent?: boolean, paginationSelector?: string, maxPages?: number, useProxies?: boolean, proxyList?: string, requestTimeout?: number): Promise<INodeExecutionData>;
