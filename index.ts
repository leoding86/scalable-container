/*
 * @Author: Leo Ding <leoding86@msn.com>
 * @Date: 2025-03-20 15:48:14
 * @LastEditors: Leo Ding <leoding86@msn.com>
 * @LastEditTime: 2025-03-20 15:49:46
 */
import { ScalableContainer } from './src/scalable-container';

new ScalableContainer({
  frame: '.view-container',
  content: '.view-container__box',
  initScale: .5,
  maxScale: 10
});

document.querySelectorAll('.node').forEach(node => {
  node.addEventListener('click', () => {
    console.log('click click');
  })
});