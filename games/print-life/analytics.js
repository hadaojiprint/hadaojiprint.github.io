// Aggregate gameplay only: no save data, customer names, money, or typed text.
(()=>{
 'use strict';
 let started=false,activeMs=0,lastInput=-Infinity,lastTick=performance.now();
 const milestones=new Set(),allowed=new Set(['game_order_accepted','game_delivery','game_next_day']);
 const send=(name,params={})=>{try{if(typeof window.gtag==='function')window.gtag('event',name,{game_name:'print_life',...params});}catch{}};
 const ready=()=>{const loading=document.getElementById('loadingScreen');return !loading||loading.hidden;};
 function tick(){const now=performance.now(),elapsed=Math.min(1000,Math.max(0,now-lastTick));lastTick=now;
  if(!started||document.visibilityState!=='visible')return;
  // Count only foreground time within 30 seconds of a game input.
  const end=Math.min(now,lastInput+30000),begin=now-elapsed;
  activeMs+=Math.max(0,end-begin);
  for(const seconds of [60,180,300])if(activeMs>=seconds*1000&&!milestones.has(seconds)){milestones.add(seconds);send(seconds===60?'game_engaged':'game_play_time',{active_seconds:seconds});}
 }
 function input(e){if(!e.isTrusted||document.visibilityState!=='visible'||!ready())return;
  tick();lastInput=performance.now();
  if(!started){started=true;send('game_start');}
 }
 document.addEventListener('pointerdown',e=>{if(e.target.closest?.('#world,.dpad,#dash,#interact,#panel,#visitorActions'))input(e);},{capture:true,passive:true});
 document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,textarea,select'))return;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D','Enter',' '].includes(e.key))input(e);
 });
 // Covers keyboard activation of game controls without counting help/save clicks.
 document.addEventListener('click',e=>{if(e.target.closest?.('#interact,#panel button,#visitorActions button'))input(e);},{capture:true,passive:true});
 document.addEventListener('visibilitychange',()=>{tick();lastTick=performance.now();lastInput=-Infinity;});
 window.addEventListener('pagehide',tick);
 setInterval(tick,1000);
 window.hadaojiGameAnalytics={track:name=>{if(started&&allowed.has(name))send(name);}};
 send('game_view');
})();
