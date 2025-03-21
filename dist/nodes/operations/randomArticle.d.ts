import { INodeExecutionData } from 'n8n-workflow';
export declare function getRandomArticle(url: string, articleSelector: string, titleSelector: string, linkSelector: string, contentSelector: string, fetchFullContent: boolean): Promise<INodeExecutionData>;
