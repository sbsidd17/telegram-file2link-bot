import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { extractFileInfo, formatFileSize, getFileTypeEmoji, isFileTooLarge } from './utils';
import { FileInfo, MyContext } from './types';

export const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN!);

bot.start((ctx) => {
  ctx.replyWithMarkdownV2(
    `📁 *Welcome to File2Link Bot\\!*\n\n` +
    `Send me any file \\(up to 4GB\\) and I'll provide a direct download link\\.\n\n` +
    `⚠️ *Note:* Links are valid for 1 hour\n` +
    `🔧 *Supported types:* Documents, Videos, Photos, Audio\n` +
    `💡 *Tip:* For files >20MB, use the generated link directly in your browser`
  );
});

bot.help((ctx) => {
  ctx.replyWithMarkdownV2(
    `ℹ️ *How to use:*\n\n` +
    `1\\. Send any file \\(document, video, photo, audio\\)\n` +
    `2\\. I'll respond with a direct download link\n\n` +
    `📦 *Max file size:* 4GB\n` +
    `⏱️ *Link validity:* 1 hour\n\n` +
    `🔧 *Supported content:*\n` +
    `\\- Documents \\(ZIP, PDF, etc\\.\\)\n` +
    `\\- Videos \\(MP4, MOV, etc\\.\\)\n` +
    `\\- Photos \\(JPG, PNG, etc\\.\\)\n` +
    `\\- Audio files \\(MP3, WAV, etc\\.\\)\n\n` +
    `💡 *Important for large files:*\n` +
    `Files over 20MB cannot be downloaded via bot API,\\n` +
    `but the generated link will work in web browsers\\!`
  );
});

bot.on([message('document'), message('video'), message('photo'), message('audio')], async (ctx) => {
  try {
    const fileInfo = extractFileInfo(ctx);
    if (!fileInfo) {
      return ctx.reply('❌ Unsupported file type. Please send a document, video, photo, or audio file.');
    }

    const processingMsg = await ctx.reply('⏳ Processing your file...', {
      reply_parameters: { message_id: ctx.message.message_id }
    });

    if (isFileTooLarge(fileInfo.file_size)) {
      try {
        const file = await ctx.telegram.getFile(fileInfo.file_id);
        const fileLink = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
        
        const emoji = getFileTypeEmoji(fileInfo.file_type);
        let response = `${emoji} *${fileInfo.file_name || 'Large File'}*\n\n`;
        response += `📦 *Size:* ${formatFileSize(fileInfo.file_size)} (over 20MB)\n`;
        response += `🔗 *Download Link:*\n${fileLink}\n\n`;
        response += '💡 *Important:* This link will only work in web browsers!';
        
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          processingMsg.message_id,
          undefined,
          response,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Large file processing error:', error);
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          processingMsg.message_id,
          undefined,
          '❌ Failed to process large file. Please try again or send a smaller file.',
          { parse_mode: 'Markdown' }
        );
      }
    } else {
      try {
        const fileLink = await ctx.telegram.getFileLink(fileInfo.file_id);
        const emoji = getFileTypeEmoji(fileInfo.file_type);
        let response = `${emoji} *${fileInfo.file_name || 'File'}*\n\n`;
        if (fileInfo.file_name) response += `📝 *Name:* ${fileInfo.file_name}\n`;
        response += `📦 *Size:* ${formatFileSize(fileInfo.file_size)}\n`;
        response += `🔗 *Download Link:*\n${fileLink}\n\n`;
        response += '_⚠️ Link valid for 1 hour_';

        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          processingMsg.message_id,
          undefined,
          response,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Small file processing error:', error);
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          processingMsg.message_id,
          undefined,
          '❌ Failed to process file. Please try again.',
          { parse_mode: 'Markdown' }
        );
      }
    }
  } catch (error) {
    console.error('General error:', error);
    ctx.reply('❌ An unexpected error occurred. Please try again later.');
  }
});

bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ An error occurred. Please try again.');
});
