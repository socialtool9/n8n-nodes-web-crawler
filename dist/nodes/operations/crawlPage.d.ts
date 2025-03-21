import { INodeExecutionData } from 'n8n-workflow';
export declare function crawlPage(url: string, textSelector: string, imageSelector: string, filterImagesBySize: boolean, minImageSize: number, checkActualImageSize: boolean): Promise<INodeExecutionData>;
