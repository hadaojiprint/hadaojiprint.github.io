// Track tool navigation and actions without image content, filenames or entered text.
(()=>{
 const page=location.pathname.includes('/tools/print-data')?'HCG':location.pathname.includes('/tools/tshirt-simulator')?'HPS':'QUEST';
 const send=(name,params)=>{if(typeof window.gtag==='function')window.gtag('event',name,{source_tool:page,...params});};
 const actions=page==='HCG'?{auto:'background_remove',undo:'undo',reset:'reset',make:'png_generate',download:'png_download',share:'png_share',demo:'sample'}:page==='HPS'?{save:'preview_generate',shareImage:'preview_share',saveDownload:'preview_download',addImage:'image_add',addText:'text_add',removeImage:'layer_delete'}:{};
 document.addEventListener('click',e=>{
  const target=e.target.closest('a,button');if(!target)return;
  if(actions[target.id]&&!target.disabled)send('tool_action',{action:actions[target.id]});
  if(target.tagName==='A'){let url;try{url=new URL(target.href,location.href);}catch{return;}
   if(url.origin===location.origin){const tool=url.pathname.startsWith('/tools/print-data/')?'HCG':url.pathname.startsWith('/tools/tshirt-simulator/')?'HPS':null;if(tool)send('tool_navigation',{destination_tool:tool});}
  }
 });
 document.addEventListener('change',e=>{if(e.target.matches('input[type=file]')&&e.target.files.length)send('tool_action',{action:'image_upload'});});
})();
