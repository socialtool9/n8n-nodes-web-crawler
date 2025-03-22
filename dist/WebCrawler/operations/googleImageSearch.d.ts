import { INodeExecutionData } from 'n8n-workflow';
export declare function googleImageSearch(keyword: string, maxImages: number, minImageSize?: number, filterBySize?: boolean, useProxies?: boolean, proxyList?: string, requestTimeout?: number): Promise<INodeExecutionData>;
