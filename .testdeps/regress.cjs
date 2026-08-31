const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('../page.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://local.test/' });
const w = dom.window, d = w.document;
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name); } };

function done() {
  console.log('--- ' + pass + ' passed, ' + fail + ' failed ---');
  try { dom.window.close(); } catch (e) {}
  process.exit(fail ? 1 : 0);
}

setTimeout(() => {
  try {
    const $ = (id) => d.getElementById(id);
    const ev = (fn) => w.eval(fn);
    // 记录中心必须先设 tab='record' 才会渲染模块页
    ev('tab="record"');
    ev('alert=function(){};confirm=function(){return true;}');

    // 1. 活动模块：segc 分段控件 + 常用活动
    ev('setRecView("activity")');
    let v = $('view');
    ok(v.innerHTML.includes('segc') && v.innerHTML.includes('常用活动') && v.innerHTML.includes('活动表'), '活动模块使用 segc 分段控件');
    ok(v.querySelector('.segc') !== null, '活动模块存在 .segc');

    // 2. 活动模块切换子页
    ev('setActSub("table")');
    ok($('view').innerHTML.includes('活动表'), '活动模块切到活动表');
    ev('setActSub("common")');

    // 3. 习惯模块：segc + 子页切换
    ev('setRecView("habit")');
    v = $('view');
    ok(v.innerHTML.includes('segc') && v.innerHTML.includes('日常打卡') && v.innerHTML.includes('年视图'), '习惯模块使用 segc');
    ev('setHabitSub("year")');
    ok($('view').innerHTML.includes('年视图'), '习惯模块切到年视图');
    ev('setHabitSub("daily")');
    ok($('view').innerHTML.includes('日常打卡'), '习惯模块切回日常打卡');

    // 4. 常用活动：添加两条不同类别，验证分类筛选 + data-id 点击
    ev('S.commonActs=[{id:"a1",name:"跑步",cat:"运动",typeId:"other"},{id:"a2",name:"读书",cat:"学习",typeId:"other"}]');
    ev('save()');
    ev('setRecView("activity")');
    ev('setCaFilter("运动")');
    let cards = d.querySelectorAll('#caList .ca-card');
    ok(cards.length === 1 && cards[0].dataset.id === 'a1', '分类筛选后只显示对应类别卡片');
    // 模拟 caDown：索引 0 应命中 a1（data-id 正确）
    ev('window.__caDownLast=0;caTapT=0;caTapId=""');
    cards[0].dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    // 直接验证 caTapId 记录的是 a1 的 id
    ok(w.eval('caTapId') === 'a1', '按下后记录正确 data-id（不再索引错位）');
    ev('clearTimeout(caTapTimer);caTapT=0;caTapId="";cad=null');

    // 5. 类型选择器：setCaType 只切换 class 不重建 innerHTML
    ev('showCommonAct(null)');
    ev('setCaType("work")');
    const typesEl = $('ca_types');
    ok(typesEl !== null && typesEl.querySelectorAll('.chip.on').length === 1, 'setCaType 切换后恰好一个高亮');

    // 6. 日用品：类别去重（系统类别 + 数据类别），管理函数存在（日用品在 money 模块 daily 子页）
    ev('S.dailies=[{id:"d1",name:"洗发水",cat:"护肤品",price:30,buyDate:"2026-08-01",endDate:"2026-08-30",avgOnly:false}]');
    ev('S.dailyCats=[]');
    ev('save()');
    ev('setRecView("money");moneySub="daily";render()');
    v = $('view');
    ok(v.innerHTML.includes('类别管理'), '日用品顶部有类别管理入口');
    // 管理弹窗列出类别且不重复
    ev('showDailyCatManage()');
    const manageHtml = d.querySelector('#modal .box') ? d.querySelector('#modal .box').innerHTML : '';
    ok(manageHtml.includes('护肤品'), '类别管理包含系统类别');
    // 新增类别
    ev('S.dailyCats=[];addDailyCat()'); // 空输入会 alert，忽略；直接测 rename/del
    ev('S.dailyCats=["护肤品","文具"];save()');
    const cats = w.eval('getDailyCats()');
    ok(Array.isArray(cats) && cats.includes('护肤品') && cats.includes('文具'), 'getDailyCats 返回自建类别');
    ev('delDailyCat("文具")');
    ok(!w.eval('getDailyCats()').includes('文具'), 'delDailyCat 删除类别');

    // 7. 待办切换动画：toggleView 存在且不抛错
    ev('view="pool";toggleView()');
    ok(w.eval('view') === 'today', 'toggleView 从待办池切到每日待办');
    ev('toggleView()');
    ok(w.eval('view') === 'pool', 'toggleView 切回待办池');

    // 8. 日用品弹窗类别不重复（原有 bug：出现两个同名 chip）
    ev('S.dailyCats=[];S.dailies=[{id:"d1",name:"x",cat:"护肤品"}]');
    ev('showDaily(null)');
    const dcats = d.querySelectorAll('#d_cats .chip');
    const names = Array.from(dcats).map(c => c.textContent.trim());
    const dup = names.filter((n, i) => names.indexOf(n) !== i);
    ok(dup.length === 0, '日用品弹窗类别无重复: ' + names.join(','));

    done();
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error(e.stack.split('\n').slice(0, 3).join('\n'));
    fail++;
    done();
  }
}, 600);
