import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { extractFileInfo, formatFileSize, getFileTypeEmoji } from './utils';
import { FileInfo, MyContext } from './types';

export const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN!);

bot.on([message('document'), message('video'), message('photo'), message('audio')], async (ctx) => {
  try {
    const fileInfo = extractFileInfo(ctx);
    if (!fileInfo) {
      return ctx.reply('❌ Unsupported file type.');
    }

    const msg = await ctx.reply('⏳ Generating download link...', {
      reply_parameters: { message_id: ctx.message.message_id }
    });

    try {
      const file = await ctx.telegram.getFile(fileInfo.file_id);
      const fileLink = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

      const fileSizeText = fileInfo.file_size ? formatFileSize(fileInfo.file_size) : 'Unknown size';
      const largeFileNotice = fileInfo.file_size && fileInfo.file_size > 20 * 1024 * 1024 
        ? '\n⚠️ Open in browser for files >20MB' 
        : '\n🕒 Link valid for 1 hour';

      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        `🎉 *Download Ready!*\n\n` +
        `${getFileTypeEmoji(fileInfo.file_type)} ${fileInfo.file_name || 'File'}\n` +
        `📏 Size: ${fileSizeText}\n` +
        `🔗 Link: ${fileLink}` +
        largeFileNotice,
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

bot.start((ctx) => ctx.replyWithMarkdownV2(
  `📁 *File2Link Bot*\n\n` +
  `Send any file up to *4GB*\\!\n` +
  `🔗 Get direct download links\n` +
  `🕒 Links work for *1 hour*`
));

bot.catch((err, ctx) => {
  console.error('Global error:', err);
  ctx.reply('❌ System error. Please try again.');
});
