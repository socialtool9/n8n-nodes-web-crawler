import { INodeExecutionData } from 'n8n-workflow';
export declare function execute(url: string, textSelector: string, imageSelector: string, filterBySize?: boolean, minImageSize?: number, checkActualSize?: boolean): Promise<INodeExecutionData>;
