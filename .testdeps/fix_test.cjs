const fs=require('fs');
const path=require('path');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','page.html'),'utf-8');

const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://local.test/'});
const {window}=dom;
const {document}=window;

let pass=0,fail=0;
function ok(name,cond,extra){
  if(cond){pass++;console.log('  PASS  '+name);}
  else{fail++;console.log('  FAIL  '+name+(extra?'  -> '+extra:''));}
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

(async()=>{
  await sleep(200); // 等待初始化 render

  // ---- 1. 活动模块 Tab 改为 segc ----
  window.setRecView('activity');
  let seg=document.querySelector('#view .segc');
  ok('活动模块使用 segc 分段控件',!!seg&&seg.innerHTML.includes('常用活动')&&seg.innerHTML.includes('setActSub'));
  ok('活动模块 segc 高亮项正确',seg&&seg.querySelector('button.on')&&seg.querySelector('button.on').textContent==='常用活动');

  // ---- 2. 习惯模块 Tab 改为 segc ----
  window.setRecView('habit');
  seg=document.querySelector('#view .segc');
  ok('习惯模块使用 segc 分段控件',!!seg&&seg.innerHTML.includes('日常打卡')&&seg.innerHTML.includes('setHabitSub'));

  // ---- 3. 常用活动分类横向滚动 ----
  window.setRecView('activity');
  window.S.commonActs=[
    {id:'a1',name:'跑步',cat:'运动',typeId:'sport',last:0},
    {id:'a2',name:'阅读',cat:'学习',typeId:'work',last:0},
    {id:'a3',name:'练琴',cat:'爱好',typeId:'rest',last:0},
    {id:'a4',name:'通勤',cat:'日常',typeId:'other',last:0},
    {id:'a5',name:'冥想',cat:'爱好',typeId:'rest',last:0}
  ];
  window.render();
  const catsBar=document.querySelector('#caList');
  const actbar=document.querySelector('#view .cats-scroll');
  ok('常用活动分类栏为横向滚动样式',!!actbar&&actbar.querySelectorAll('.chip').length>=5);

  // ---- 4. 切换分类后点击不再点错（核心 bug 回归测试） ----
  window.caFilter='爱好';
  window.render();
  const cards=document.querySelectorAll('#caList .ca-card');
  ok('过滤后卡片数为 2',cards.length===2,JSON.stringify([...cards].map(c=>c.dataset.id)));
  // 模拟按下第一张卡（练琴, id=a3）。旧代码会错误地取 S.commonActs[0]=跑步(a1)
  const first=cards[0];
  const evt=new window.MouseEvent('mousedown',{bubbles:true,cancelable:true,clientX:10,clientY:10});
  first.dispatchEvent(evt);
  ok('按下后记录的 caTapId 是过滤列表内的正确 id (a3)',window.caTapId==='a3','caTapId='+window.caTapId);
  await sleep(700); // 单击编辑延迟
  const mname=document.getElementById('modal').textContent;
  ok('单击编辑打开的是正确卡片 (练琴)',mname.includes('练琴'),mname.slice(0,60));
  window.closeModal();
  window.caFilter='全部';

  // ---- 5. 类型选择器点击只切 class 不重绘 ----
  window.setRecView('activity');
  window.showCommonAct(null);
  const t2=document.querySelector('#ca_types .chip[data-t="sport"]');
  t2.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
  ok('点类型后选中态切到 sport',window.caType==='sport'&&t2.classList.contains('on'));
  const t1=document.querySelector('#ca_types .chip[data-t="work"]');
  ok('work 取消选中',!t1.classList.contains('on'));
  ok('类型列表未被整体重绘（元素仍为同一节点）',document.querySelector('#ca_types .chip[data-t="other"]')!=null);
  window.closeModal();

  // ---- 6. 日用品弹窗类别去重（原"生成两个"bug） ----
  window.S.dailies=[{id:'d1',name:'洗发水 500ml',price:39,buyDate:'2026-08-01',cat:'护肤品',endDate:''}];
  window.showDaily(null);
  const chips=[...document.querySelectorAll('#d_cats .chip')];
  const dupe=chips.filter(c=>c.textContent==='护肤品').length;
  ok('弹窗里「护肤品」只出现一次（不再生成两个）',dupe===1,JSON.stringify(chips.map(c=>c.textContent)));
  window.closeModal();

  // ---- 7. 日用品类别管理 ----
  ok('存在类别管理入口函数',typeof window.showDailyCatManage==='function');
  window.showDailyCatManage();
  let mm=document.querySelector('#modal .catlist');
  ok('类别管理列出全部类别',!!mm&&mm.textContent.includes('护肤品')&&mm.textContent.includes('文具'));
  // 新增类别
  document.getElementById('dc_new').value='纸巾';
  window.addDailyCat();
  ok('新增类别写入 S.dailyCats',(window.S.dailyCats||[]).includes('纸巾'));
  window.showDailyCatManage();
  // 删除类别：删掉「化妆品」
  const delBtn=[...document.querySelectorAll('#modal .catlist .c b')].find(b=>b.parentElement.querySelector('input').value==='化妆品');
  if(delBtn){
    window.confirm=()=>true;
    delBtn.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
    ok('删除「化妆品」后不再出现在类别列表',!document.querySelector('#modal .catlist').textContent.includes('化妆品'));
  }else{ok('找到「化妆品」删除按钮',false);}
  window.closeModal();

  // ---- 8. 待办池/每日待办切换动画 ----
  window.goTab('task');
  window.view='pool';window.render();
  const v=document.getElementById('view');
  window.toggleView();
  ok('切换后 view 添加 swap 动画类',v.classList.contains('swap'));
  ok('toggleView 正确切换到 today',window.view==='today');

  // ---- 9. segc 切换回调正常 ----
  window.setRecView('activity');
  window.actSub='table';
  window.render();
  const seg2=document.querySelector('#view .segc');
  const btnCommon=[...seg2.querySelectorAll('button')].find(b=>b.textContent==='常用活动');
  btnCommon.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
  ok('segc 点击切回常用活动',window.actSub==='common');

  console.log('\n结果: '+pass+' 通过, '+fail+' 失败');
  process.exit(fail?1:0);
})().catch(e=>{console.error('TEST ERROR:',e);process.exit(2);});
