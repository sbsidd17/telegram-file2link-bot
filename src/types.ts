import { Context } from 'telegraf';

export interface FileInfo {
  file_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  file_type: 'document' | 'video' | 'photo' | 'audio';
}

export type MyContext = Context & {
  fileInfo?: FileInfo;
};
