import { IExecuteFunctions } from 'n8n-workflow';
import { INodeExecutionData, INodeType } from 'n8n-workflow';
export declare class WebCrawler implements INodeType {
    description: import("n8n-workflow").INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
