import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { extractFileInfo, formatFileSize, getFileTypeEmoji, isFileTooLarge } from './utils';
import { FileInfo, MyContext } from './types';

export const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN!);

// Start command handler
bot.start((ctx) => {
  ctx.replyWithMarkdownV2(
    `📁 *Welcome to File2Link Bot\\!*\n\n` +
    `Send me any file \\(up to 4GB\\) and I'll provide a direct download link\\.\n\n` +
    `⚠️ *Note:* Links are valid for 1 hour\n` +
    `🔧 *Supported types:* Documents, Videos, Photos, Audio\n` +
    `💡 *Tip:* For files >20MB, use the generated link directly in your browser`
  );
});

// Help command handler
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

// File message handler
bot.on([message('document'), message('video'), message('photo'), message('audio')], async (ctx) => {
  try {
    const fileInfo = extractFileInfo(ctx);
    if (!fileInfo) {
      return ctx.reply('❌ Unsupported file type. Please send a document, video, photo, or audio file.');
    }

    // Send processing message
    const processingMsg = await ctx.reply('⏳ Processing your file...', {
      reply_parameters: {
        message_id: ctx.message.message_id
      }
    });

    // Handle large files differently
    if (isFileTooLarge(fileInfo.file_size)) {
      // Construct direct download URL using file_id
      const fileLink = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_id}`;
      
      // Prepare response for large files
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
    } else {
      // Handle small files normally
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
    }
  } catch (error) {
    console.error('Error processing file:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('file is too big')) {
        ctx.reply('❌ Telegram API limitation: Files over 20MB require special handling. Please try again.');
      } else if (error.message.includes('not found')) {
        ctx.reply('❌ File not found. It may have been deleted from Telegram servers.');
      } else {
        ctx.reply('❌ Error processing file. Please try again.');
      }
    } else {
      ctx.reply('❌ Unknown error occurred. Please try again.');
    }
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ An error occurred. Please try again.');
});
