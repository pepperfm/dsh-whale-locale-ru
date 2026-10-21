import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {translateWhaleUiText} from '../whale-text.js';
const dictionary=JSON.parse(fs.readFileSync(new URL('../locales/whale.json',import.meta.url),'utf8'));
const speech=JSON.parse(fs.readFileSync(new URL('../locales/whale-speech.json',import.meta.url),'utf8'));
test('dynamic UI grammar preserves amounts, currency, names and provider details',()=>{
 const cases=[
  ['$ 0.00 · 今日 $ 0.00','$ 0.00 · сегодня $ 0.00'],
  ['¥ 4.17 · 今日 ¥ 1.23','¥ 4.17 · сегодня ¥ 1.23'],
  ['余额 —（无接口·按事件）· 今日 $ 0.00','Баланс — (нет API) · сегодня $ 0.00'],
  ['余额 $ 10.00 · 今日已用 $ 0.12','Баланс $ 10.00 · сегодня $ 0.12'],
  ['模型设置 · 我的模型','Настройки модели · 我的模型'],
  ['额度 · 私人模型','Лимит · 私人模型'],
  ['余额 ≤ 50 时提醒','Уведомлять при балансе ≤ 50'],
  ['今日已用 ≥ 20 时提醒','Уведомлять при расходах за день ≥ 20'],
  ['角色 3 · 泡泡图 2','Персонажи: 3 · изображения: 2'],
  ['音效组 2 · 片段 9','Наборы звуков: 2 · фрагменты: 9'],
  ['跟随保底（经典（内置））','По умолчанию (классическая рамка)'],
  ['泡泡框：我的框','Рамка: 我的框'],
  ['文本: 我的文字','Текст: 我的文字'],
  ['文本: 上一轮对话消耗:','Текст: '+speech['上一轮对话消耗:']],
  ['确定删除音效组「私有声音」吗？','Удалить набор звуков «私有声音»?'],
  ['从模块库删除「Мой модуль」?','Удалить из библиотеки модуль «Мой модуль»?'],
  ['保存失败: HTTP 503','Не удалось сохранить: HTTP 503'],
  ['本地估算：4.17000000 CNY','Локальная оценка: 4.17000000 CNY'],
 ];
 for(const[from,to]of cases)assert.equal(translateWhaleUiText(from,dictionary,speech),to,from);
 for(const text of ['我的文字','Меню','gpt-6.1-sol','$ 0.00','123.45','Произвольный текст 今日','https://example.com/余额'])assert.equal(translateWhaleUiText(text,dictionary,speech),text);
});
test('every shipped speech source has an exact translation; captured placeholders are kept',()=>{
 const keys=JSON.parse(fs.readFileSync(new URL('./fixtures/default-speech-keys.json',import.meta.url),'utf8'));
 for(const key of keys)if(/[\u3400-\u9fff]/.test(key))assert.equal(typeof speech[key.trim()],'string',key);
 assert.equal(speech['上班让我意识到时间是可以被浪费的...'],'Работа научила меня, что время можно тратить впустую...');
});
