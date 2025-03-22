import { INodeExecutionData } from 'n8n-workflow';
export declare function getRandomArticle(url: string, articleSelector: string, titleSelector: string, linkSelector: string, contentSelector: string, fetchFullContent: boolean, paginationSelector?: string, maxPages?: number, useProxies?: boolean, proxyList?: string, requestTimeout?: number): Promise<INodeExecutionData>;
