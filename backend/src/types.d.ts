declare module 'formidable' {
  export interface Fields {
    [key: string]: any;
  }
  
  export interface Files {
    [key: string]: any;
  }
  
  export interface File {
    filepath: string;
    [key: string]: any;
  }
  
  export class IncomingForm {
    constructor(options?: any);
    parse(req: any, callback: (err: any, fields: Fields, files: Files) => void): void;
  }
}

declare module '@miniflare/storage-memory';

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

interface KVNamespace {
  get(key: string, options?: any): Promise<any>;
  put(key: string, value: any, options?: any): Promise<void>;
  delete(key: string): Promise<void>;
} 