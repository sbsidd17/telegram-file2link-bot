import { FileInfo } from './types';

export const extractFileInfo = (ctx: any): FileInfo | null => {
  // Document handling
  if (ctx.message?.document) {
    return {
      file_id: ctx.message.document.file_id,
      file_name: ctx.message.document.file_name,
      mime_type: ctx.message.document.mime_type,
      file_size: ctx.message.document.file_size,
      file_type: 'document'
    };
  }

  // Video handling
  if (ctx.message?.video) {
    return {
      file_id: ctx.message.video.file_id,
      file_name: ctx.message.video.file_name,
      mime_type: ctx.message.video.mime_type,
      file_size: ctx.message.video.file_size,
      file_type: 'video'
    };
  }

  // Photo handling (largest version)
  if (ctx.message?.photo && ctx.message.photo.length > 0) {
    const largestPhoto = ctx.message.photo.reduce((prev, current) => 
      (prev.file_size > current.file_size) ? prev : current
    );
    return {
      file_id: largestPhoto.file_id,
      mime_type: 'image/jpeg',
      file_size: largestPhoto.file_size,
      file_type: 'photo'
    };
  }

  // Audio handling
  if (ctx.message?.audio) {
    return {
      file_id: ctx.message.audio.file_id,
      file_name: ctx.message.audio.file_name,
      mime_type: ctx.message.audio.mime_type,
      file_size: ctx.message.audio.file_size,
      file_type: 'audio'
    };
  }

  return null;
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown size';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

export const getFileTypeEmoji = (type: string): string => {
  switch (type) {
    case 'document': return '📄';
    case 'video': return '🎬';
    case 'photo': return '🖼️';
    case 'audio': return '🎵';
    default: return '📁';
  }
};
