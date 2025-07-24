import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import dotenv from 'dotenv';
import { extractFileInfo, formatFileSize, getFileTypeEmoji } from './utils';
import { FileInfo, MyContext } from './types';

dotenv.config();

const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN!);

// Start command handler
bot.start((ctx) => {
  ctx.replyWithMarkdownV2(
    `📁 *Welcome to File2Link Bot\\!*\n\n` +
    `Send me any file \\(up to 4GB\\) and I'll provide a direct download link\\.\n\n` +
    `⚠️ *Note:* Links are valid for 1 hour\n` +
    `🔧 *Supported types:* Documents, Videos, Photos, Audio`
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
    `\\- Audio files \\(MP3, WAV, etc\\.\\)`
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
      reply_parameters: { message_id: ctx.message.message_id }
    });

    // Get file link (valid for 1 hour)
    const fileLink = await ctx.telegram.getFileLink(fileInfo.file_id);
    
    // Prepare response
    const emoji = getFileTypeEmoji(fileInfo.file_type);
    let response = `${emoji} *${fileInfo.file_name || 'File'}*\n\n`;
    
    if (fileInfo.file_name) {
      response += `📝 *Name:* ${fileInfo.file_name}\n`;
    }
    
    response += `📦 *Size:* ${formatFileSize(fileInfo.file_size)}\n`;
    response += `🔗 *Download Link:*\n\`${fileLink}\`\n\n`;
    response += '_⚠️ Link valid for 1 hour_';

    // Edit processing message with result
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      processingMsg.message_id,
      undefined,
      response,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error processing file:', error);
    
    // Handle file size errors specifically
    if (error instanceof Error && error.message.includes('file is too big')) {
      ctx.reply('❌ File size exceeds Telegram bot limits (max 4GB).');
    } else {
      ctx.reply('❌ Error processing file. Please try again.');
    }
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ An error occurred. Please try again.');
});

// Start the bot
bot.launch().then(() => {
  console.log('🚀 Bot started successfully');
});

// Enable graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
