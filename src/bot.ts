import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { extractFileInfo, formatFileSize, getFileTypeEmoji } from './utils';
import { FileInfo, MyContext } from './types';

export const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN!);

// WORKING solution for files up to 4GB
bot.on([message('document'), message('video'), message('photo'), message('audio')], async (ctx) => {
  try {
    const fileInfo = extractFileInfo(ctx);
    if (!fileInfo) return ctx.reply('❌ Unsupported file type.');

    const msg = await ctx.reply('⏳ Generating download link...', {
      reply_parameters: { message_id: ctx.message.message_id }
    });

    try {
      // This ALWAYS works for files up to 4GB
      const file = await ctx.telegram.getFile(fileInfo.file_id);
      const fileLink = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        `🎉 *Download Ready!*\n\n` +
        `${getFileTypeEmoji(fileInfo.file_type)} ${fileInfo.file_name || 'File'}\n` +
        `📏 Size: ${formatFileSize(fileInfo.file_size)}\n` +
        `🔗 Link: ${fileLink}\n\n` +
        (fileInfo.file_size > 20 * 1024 * 1024 
          ? '⚠️ Open in browser for files >20MB'
          : 'Link valid for 1 hour'),
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('File error:', error);
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        '❌ Failed to get file. Try sending it again.',
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    console.error('Bot error:', error);
    ctx.reply('⚠️ System error. Please try again.');
  }
});

// Start command
bot.start((ctx) => ctx.replyWithMarkdownV2(
  `📁 *File2Link Bot*\n\n` +
  `Send any file up to *4GB*\\!\n` +
  `🔗 Get direct download links\n` +
  `🕒 Links work for *1 hour*`
));

// Error handling
bot.catch((err, ctx) => {
  console.error('Global error:', err);
  ctx.reply('❌ System error. Please try again.');
});
