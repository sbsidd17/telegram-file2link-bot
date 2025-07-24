import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { extractFileInfo, formatFileSize, getFileTypeEmoji } from './utils';
import { FileInfo, MyContext } from './types';

export const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN!);

// Helper function to get file link
const getTelegramFileLink = async (fileId: string, token: string) => {
  try {
    // First get file path from Telegram
    const file = await bot.telegram.getFile(fileId);
    
    // Construct direct CDN URL
    return `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  } catch (error) {
    console.error('Error getting file link:', error);
    throw new Error('Failed to get file link');
  }
};

bot.start((ctx) => {
  ctx.replyWithMarkdownV2(
    `📁 *File to Link Bot*\n\n` +
    `I can generate download links for files up to *4GB*\\.\n` +
    `🔗 Links work in browsers, valid for *1 hour*\\.\n\n` +
    `Just send me any file!`
  );
});

bot.on([message('document'), message('video'), message('photo'), message('audio')], async (ctx) => {
  try {
    const fileInfo = extractFileInfo(ctx);
    if (!fileInfo) return ctx.reply('❌ Unsupported file type.');

    const processingMsg = await ctx.reply('🔄 Processing your file...', {
      reply_parameters: { message_id: ctx.message.message_id }
    });

    try {
      const fileLink = await getTelegramFileLink(fileInfo.file_id, process.env.BOT_TOKEN!);
      
      const response = [
        `${getFileTypeEmoji(fileInfo.file_type)} *${fileInfo.file_name || 'File'}*`,
        `📦 Size: ${formatFileSize(fileInfo.file_size)}`,
        `🔗 Download: ${fileLink}`,
        '',
        fileInfo.file_size && fileInfo.file_size > 20 * 1024 * 1024 
          ? '💡 Open in browser for large files'
          : '⚠️ Link expires in 1 hour'
      ].join('\n');

      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        processingMsg.message_id,
        undefined,
        response,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('File processing error:', error);
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        processingMsg.message_id,
        undefined,
        '❌ Failed to generate link. Telegram may have deleted the file.',
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    console.error('General error:', error);
    ctx.reply('⚠️ An error occurred. Please try again.');
  }
});

bot.catch((err, ctx) => {
  console.error(`Bot error:`, err);
  ctx.reply('❌ An error occurred. Please try again.');
});
