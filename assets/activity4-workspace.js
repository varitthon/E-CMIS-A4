(() => {
  const STORAGE_KEY = 'ecmis-a4-workspace-v3';
  const BACKUP_STORAGE_KEY = 'ecmis-a4-officer-backups-v1';
  const SUGGESTION_STORAGE_KEY = 'ecmis-a4-suggestions-v1';
  const THAI_LOCATION_URL = 'https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json';
  const STAFF_LOCATION_FALLBACK = [
    {name_th:'กรุงเทพมหานคร',districts:[{name_th:'เขตพระนคร',sub_districts:[{name_th:'พระบรมมหาราชวัง',zip_code:10200},{name_th:'วังบูรพาภิรมย์',zip_code:10200}]},{name_th:'เขตดุสิต',sub_districts:[{name_th:'ดุสิต',zip_code:10300},{name_th:'วชิรพยาบาล',zip_code:10300}]}]},
    {name_th:'นนทบุรี',districts:[{name_th:'เมืองนนทบุรี',sub_districts:[{name_th:'สวนใหญ่',zip_code:11000},{name_th:'ตลาดขวัญ',zip_code:11000},{name_th:'ท่าทราย',zip_code:11000}]},{name_th:'ปากเกร็ด',sub_districts:[{name_th:'ปากเกร็ด',zip_code:11120},{name_th:'บางตลาด',zip_code:11120}]}]},
    {name_th:'ชลบุรี',districts:[{name_th:'เมืองชลบุรี',sub_districts:[{name_th:'บางปลาสร้อย',zip_code:20000},{name_th:'มะขามหย่ง',zip_code:20000}]},{name_th:'ศรีราชา',sub_districts:[{name_th:'ศรีราชา',zip_code:20110},{name_th:'สุรศักดิ์',zip_code:20110}]}]}
  ];
  const ROLE_LABELS = { admin:'ธุรการ ศรร.', officer:'เจ้าหน้าที่รับเรื่อง', center:'ผอ.ศรร.', division:'ผอ.กบค.', acting:'ผู้รักษาราชการแทนตามคำสั่ง', anonymous:'กล่องบัตรสนเท่ห์', activity7:'กิจกรรมที่ 7' };
  const ANONYMOUS_CHAIN_STEPS = ['หัวหน้าพนักงานผู้ตรวจเสนอ','หัวหน้าพนักงานผู้ให้ความเห็น','หัวหน้าพนักงานผู้อนุมัติส่งต่อ'];
  const ACTIVITY7_STORAGE_KEY = 'ecmis-a4-a7-handoffs-v1';
  const OFFICERS = ['คุณสุพจน์ (พี่ฮอต)','คุณนครินทร์','คุณวารี','คุณอาภรณ์','คุณสุธาทิพย์','คุณรัชพล'];
  const REGIONS = ['ส่วนกลาง','เขต 1','เขต 2','เขต 3','เขต 4','เขต 5','เขต 6','เขต 7','เขต 8','เขต 9'];
  const NACC_TRANSFER_REASONS = [
    'เจ้าหน้าที่ของรัฐอยู่ในอำนาจหน้าที่ของคณะกรรมการ ป.ป.ช.',
    'ร้องเรียนความผิดตาม พ.ร.บ. ว่าด้วยความผิดเกี่ยวกับการเสนอราคาต่อหน่วยงานของรัฐ',
    'ร้องเรียนพฤติการณ์ร่ำรวยผิดปกติ',
    'เรื่องทรัพยากรธรรมชาติ',
    'เรื่องความมั่นคงชาติ',
    'กรณีที่ไม่ใช่ความผิดข้ามชาติ',
    'จัดซื้อจัดจ้างไม่เกิน 2 ล้านบาท',
    'กรณีไม่เกี่ยวกับสัมปทานโดยรัฐ'
  ];
  const DUPLICATE_NOTE = 'ระบบตรวจพบเรื่องที่อาจซ้ำกับ ECMIS-2569-000127 ความใกล้เคียง 92% โปรดให้เจ้าหน้าที่ผู้รับผิดชอบตรวจสอบและเปรียบเทียบข้อเท็จจริงก่อนดำเนินการต่อ';
  const DEFAULT_SUGGESTIONS = {
    keywords:['โปรดตรวจสอบข้อเท็จจริงเพิ่มเติม','พบข้อมูลที่ควรตรวจสอบความเชื่อมโยง','เอกสารประกอบยังไม่ครบถ้วน','เสนอให้ตรวจสอบอำนาจหน้าที่ของหน่วยงาน'],
    notAcceptReasons:['ข้อเท็จจริงไม่เพียงพอต่อการดำเนินการ','ไม่อยู่ในอำนาจหน้าที่ของสำนักงาน ป.ป.ท.','ไม่ปรากฏพฤติการณ์หรือบุคคลที่เกี่ยวข้องชัดเจน','เรื่องอยู่ระหว่างการพิจารณาของหน่วยงานอื่น','ผู้ร้องถอนเรื่องหรือไม่ประสงค์ดำเนินการต่อ'],
    contexts:{
      adminNote:['ตรวจพบประเด็นที่ต้องให้ผู้รับผิดชอบตรวจสอบเพิ่มเติม','โปรดตรวจสอบเอกสารแนบและความครบถ้วนของข้อมูล','มอบหมายตามพื้นที่เกิดเหตุและลักษณะเรื่องร้องเรียน'],
      officerOpinion:['เห็นควรรับไว้ตรวจสอบข้อเท็จจริงเพิ่มเติม','เสนอให้รวบรวมเอกสารและข้อมูลจากหน่วยงานที่เกี่ยวข้อง','ข้อเท็จจริงเบื้องต้นมีประเด็นที่อยู่ในอำนาจดำเนินการ'],
      absenceNote:['ผอ.ศรร. ไม่อยู่ระหว่างวันที่กำหนด จึงเสนอผู้รักษาการพิจารณา','ดำเนินการตามคำสั่งมอบหมายผู้รักษาราชการแทน'],
      centerOpinion:['เห็นชอบตามความเห็นและข้อเสนอของเจ้าหน้าที่รับเรื่อง','ส่งกลับให้ตรวจสอบข้อเท็จจริงและเอกสารเพิ่มเติม','เห็นควรเสนอ ผอ.กบค. พิจารณาต่อไป'],
      centerAdditionalDetail:['เพิ่มเติมข้อเท็จจริงเพื่อใช้ประกอบการพิจารณา โดยไม่แก้ไขข้อมูลคำร้องเดิม','โปรดตรวจสอบข้อมูลเพิ่มเติมนี้ร่วมกับความเห็นของเจ้าหน้าที่รับเรื่อง'],
      divisionOpinion:['อนุมัติตามความเห็นและข้อเสนอ','ให้ตรวจสอบข้อเท็จจริงเพิ่มเติมก่อนเสนอใหม่','ขอความเห็น ผอ.ศรร. เพิ่มเติมประกอบการพิจารณา'],
      divisionAdditionalDetail:['เพิ่มเติมประเด็นประกอบคำสั่ง โดยไม่แก้ไขข้อมูลคำร้องเดิม','ให้ใช้ข้อมูลเพิ่มเติมนี้ประกอบการดำเนินการในขั้นตอนถัดไป'],
      actingOrder:['คำสั่งแต่งตั้งผู้รักษาราชการแทน เลขที่','ปฏิบัติราชการแทนตามคำสั่งที่'],
      naccBoardNote:['สำนักงานได้ส่งเรื่องของท่านไปยังสำนักงาน ป.ป.ช. เพื่อดำเนินการตามอำนาจหน้าที่แล้ว','ผู้ร้องสามารถใช้เลขหนังสือและเลข EMS เพื่อตรวจสอบการจัดส่งได้'],
      wiSubject:['ร้องเรียนการใช้อำนาจโดยมิชอบของเจ้าหน้าที่','ขอให้ตรวจสอบการจัดซื้อจัดจ้างไม่เป็นไปตามระเบียบ'],
      wiDetail:['ระบุพฤติการณ์ บุคคลที่เกี่ยวข้อง วันเวลา และสถานที่เกิดเหตุ','โปรดอธิบายลำดับเหตุการณ์และหลักฐานที่เกี่ยวข้อง'],
      wiDamage:['เกิดความเสียหายต่องบประมาณหรือประโยชน์ของทางราชการ','ประชาชนได้รับความเดือดร้อนจากการปฏิบัติหน้าที่'],
      wiRequest:['ขอให้ตรวจสอบข้อเท็จจริงและดำเนินการตามอำนาจหน้าที่','ขอให้แจ้งผลการดำเนินการตามช่องทางที่ให้ไว้']
    },
    usage:{}
  };
  const CASES = [
    {id:'ECMIS-2569-000184',trackingYear:'690001',trackingCode:'5FT4',complainant:'นายสมชาย ใจดี',id4:'1234',subject:'ร้องเรียนการจัดซื้อวัสดุสำนักงานไม่เป็นไปตามระเบียบ',agency:'สำนักงานจัดการทรัพย์สินภาครัฐ',channel:'Website',province:'กรุงเทพมหานคร',region:'ส่วนกลาง',received:'3 สิงหาคม 2569 09:10 น.',type:'การจัดซื้อจัดจ้าง',place:'สำนักงานจัดการทรัพย์สินภาครัฐ กรุงเทพมหานคร',detail:'ผู้ถูกร้องมีพฤติการณ์จัดซื้อวัสดุสำนักงานโดยไม่ปฏิบัติตามระเบียบและอาจเอื้อประโยชน์แก่ผู้เสนอราคารายหนึ่ง',damage:'เกิดความเสียหายต่องบประมาณของหน่วยงาน',request:'ขอให้ตรวจสอบกระบวนการจัดซื้อและผู้เกี่ยวข้อง',attachments:['ใบเสนอราคา.pdf','สำเนาประกาศจัดซื้อ.pdf','ภาพถ่ายเอกสาร.jpg']},
    {id:'ECMIS-2569-000183',trackingYear:'690002',trackingCode:'K9P2',complainant:'นางสาวรัตนา แสงทอง',id4:'7812',subject:'ร้องเรียนการใช้อำนาจโดยมิชอบของเจ้าหน้าที่',agency:'องค์การบริหารส่วนตำบลตัวอย่าง',channel:'สายด่วน 1206',province:'ชลบุรี',region:'เขต 2',received:'3 สิงหาคม 2569 08:45 น.',type:'ใช้อำนาจโดยมิชอบ',place:'จังหวัดชลบุรี',detail:'เจ้าหน้าที่เรียกรับผลประโยชน์จากประชาชน',damage:'ประชาชนได้รับความเดือดร้อน',request:'ขอให้ตรวจสอบข้อเท็จจริง',attachments:[]},
    {id:'ECMIS-2569-000182',trackingYear:'690003',trackingCode:'8DMR',complainant:'ขอปกปิดข้อมูล',id4:'4456',subject:'ขอให้ตรวจสอบการเบิกจ่ายงบประมาณโครงการ',agency:'สำนักงานจังหวัดตัวอย่าง',channel:'หนังสือราชการ',province:'นครราชสีมา',region:'เขต 3',received:'2 สิงหาคม 2569 15:20 น.',type:'เบิกจ่ายงบประมาณ',place:'จังหวัดนครราชสีมา',detail:'พบความผิดปกติในการเบิกจ่าย',damage:'งบประมาณอาจเสียหาย',request:'ขอให้ตรวจสอบ',attachments:['เอกสารประกอบ.pdf']},
    {id:'ECMIS-2569-000181',trackingYear:'690004',trackingCode:'H7QW',complainant:'นายวิชัย กล้าหาญ',id4:'9090',subject:'ร้องเรียนการเรียกรับผลประโยชน์',agency:'เทศบาลเมืองตัวอย่าง',channel:'Walk-in',province:'ขอนแก่น',region:'เขต 4',received:'2 สิงหาคม 2569 13:05 น.',type:'เรียกรับผลประโยชน์',place:'จังหวัดขอนแก่น',detail:'เจ้าหน้าที่เรียกรับเงินเพื่อแลกกับการอนุมัติ',damage:'ผู้ร้องเสียประโยชน์',request:'ขอให้ดำเนินการตามกฎหมาย',attachments:[]}
  ];
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const escapeHtml = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const now = () => new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short'}).format(new Date());
  function readStore(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
  function writeStore(store){localStorage.setItem(STORAGE_KEY,JSON.stringify(store))}
  function readBackupSettings(){try{return JSON.parse(localStorage.getItem(BACKUP_STORAGE_KEY)||'{"assignments":{},"history":[]}')}catch{return {assignments:{},history:[]}}}
  function writeBackupSettings(settings){localStorage.setItem(BACKUP_STORAGE_KEY,JSON.stringify(settings))}
  function readSuggestionSettings(){
    try{
      const stored=JSON.parse(localStorage.getItem(SUGGESTION_STORAGE_KEY)||'null');
      if(!stored)return structuredClone(DEFAULT_SUGGESTIONS);
      return {...structuredClone(DEFAULT_SUGGESTIONS),...stored,contexts:{...structuredClone(DEFAULT_SUGGESTIONS.contexts),...(stored.contexts||{})},usage:stored.usage||{}};
    }catch{return structuredClone(DEFAULT_SUGGESTIONS)}
  }
  function writeSuggestionSettings(settings){localStorage.setItem(SUGGESTION_STORAGE_KEY,JSON.stringify(settings))}
  function learnContextSuggestion(context,value){
    const text=value.trim().replace(/\s+/g,' ');
    if(text.length<8||text.length>160)return;
    const settings=readSuggestionSettings();
    const usageKey=`${context}:${text}`;
    settings.usage[usageKey]=(settings.usage[usageKey]||0)+1;
    settings.contexts[context]=settings.contexts[context]||[];
    if(settings.usage[usageKey]>=2&&!settings.contexts[context].includes(text))settings.contexts[context].unshift(text);
    writeSuggestionSettings(settings);
  }
  function correctThaiWriting(value){
    const replacements=[
      [/\s{2,}/g,' '],[/เจา้หน้าที่/g,'เจ้าหน้าที่'],[/จังหวะด/g,'จังหวัด'],[/อัติโนมัติ/g,'อัตโนมัติ'],
      [/ผอ\.?\s*ศรร\.?/g,'ผอ.ศรร.'],[/ผอ\.?\s*กบค\.?/g,'ผอ.กบค.'],[/ป\.?ป\.?ช\.?/g,'ป.ป.ช.'],[/ป\.?ป\.?ท\.?/g,'ป.ป.ท.'],
      [/ส่งกลับไปแก้/g,'ส่งกลับเพื่อแก้ไข'],[/เช็ค/g,'ตรวจสอบ']
    ];
    return replacements.reduce((text,[pattern,replacement])=>text.replace(pattern,replacement),value).trim();
  }
  function formalizeWriting(value){
    return correctThaiWriting(value)
      .replace(/อยากให้/g,'เห็นควรให้')
      .replace(/โอเค/g,'เห็นชอบ')
      .replace(/ทำต่อ/g,'ดำเนินการต่อ')
      .replace(/ส่งต่อไป/g,'ส่งต่อเพื่อดำเนินการ');
  }
  function contextualSuggestions(context,value){
    const settings=readSuggestionSettings();
    const unique=[...(settings.contexts[context]||[]),...settings.keywords].filter((text,index,array)=>array.indexOf(text)===index&&!value.includes(text));
    const terms=value.toLowerCase().split(/\s+/).filter(term=>term.length>1);
    return unique.map((text,index)=>({text,index,score:terms.reduce((score,term)=>score+(text.toLowerCase().includes(term)?2:0),0)+(settings.usage[`${context}:${text}`]||0)})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,3).map(item=>item.text);
  }
  function attachIntelligentSuggestion(id,label,context=id){
    const input=$(`#${id}`);if(!input||input.parentElement.querySelector(`.smart-inline[data-context="${context}"]`))return;
    input.closest('.ws-field')?.classList.add('smart-field');
    const panel=document.createElement('div');panel.className='smart-inline';panel.dataset.context=context;
    const popoverId=`smart-inline-${id}`;
    panel.innerHTML=`<button type="button" class="smart-inline-trigger" aria-expanded="false" aria-controls="${popoverId}"><span class="smart-inline-dot"></span><span>คำแนะนำการเขียน</span><small>พร้อมตรวจ</small></button><div class="smart-inline-popover ws-hidden" id="${popoverId}" role="listbox"></div>`;
    input.insertAdjacentElement('afterend',panel);
    input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',popoverId);input.setAttribute('aria-expanded','false');
    const trigger=$('.smart-inline-trigger',panel),popover=$('.smart-inline-popover',panel);
    let closeTimer=0,renderTimer=0,activeIndex=-1;
    const open=()=>{clearTimeout(closeTimer);panel.classList.add('open');popover.classList.remove('ws-hidden');trigger.setAttribute('aria-expanded','true');input.setAttribute('aria-expanded','true')};
    const close=()=>{panel.classList.remove('open');popover.classList.add('ws-hidden');trigger.setAttribute('aria-expanded','false');input.setAttribute('aria-expanded','false');activeIndex=-1};
    const applyValue=value=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();panel.classList.add('suggestion-selected');setTimeout(()=>panel.classList.remove('suggestion-selected'),420)};
    const render=()=>{
      const value=input.value.trim(),corrected=correctThaiWriting(value),formal=formalizeWriting(value),suggestions=contextualSuggestions(context,value);
      const actions=[];
      if(value&&corrected!==value)actions.push(`<button type="button" role="option" class="smart-inline-action" data-smart-value="${escapeHtml(corrected)}"><span>แก้คำและช่องว่าง</span><small>${escapeHtml(corrected)}</small></button>`);
      if(value&&formal!==value&&formal!==corrected)actions.push(`<button type="button" role="option" class="smart-inline-action" data-smart-value="${escapeHtml(formal)}"><span>ปรับเป็นภาษาราชการ</span><small>${escapeHtml(formal)}</small></button>`);
      const suggestionHtml=suggestions.map(text=>`<button type="button" role="option" class="smart-inline-suggestion" data-smart-suggestion="${escapeHtml(text)}">${escapeHtml(text)}</button>`).join('');
      popover.innerHTML=`${actions.join('')}${suggestionHtml?`<div class="smart-inline-suggestions"><span>${value?'ข้อความที่เกี่ยวข้อง':'เริ่มต้นด้วยข้อความแนะนำ'}</span>${suggestionHtml}</div>`:''}${!actions.length&&!suggestions.length?'<p class="smart-inline-clear">ข้อความชัดเจนแล้ว</p>':''}`;
      $('small',trigger).textContent=actions.length?`พบ ${actions.length} จุดที่ปรับได้`:suggestions.length?`${suggestions.length} ข้อเสนอ`:'ตรวจแล้ว';
      $$('[data-smart-value]',popover).forEach(button=>button.onclick=()=>applyValue(button.dataset.smartValue));
      $$('[data-smart-suggestion]',popover).forEach(button=>button.onclick=()=>{const text=button.dataset.smartSuggestion;if(input.tagName==='INPUT')applyValue(text);else if(!input.value.includes(text))applyValue([input.value.trim(),text].filter(Boolean).join('\n'))});
      activeIndex=-1;
    };
    trigger.onclick=()=>{render();panel.classList.contains('open')?close():open()};
    input.addEventListener('focus',()=>{render();open()});
    input.addEventListener('input',()=>{clearTimeout(renderTimer);renderTimer=setTimeout(()=>{render();open()},180)});
    input.addEventListener('keydown',event=>{
      if(event.key==='Escape'||event.key==='Tab'){close();return}
      if(event.ctrlKey&&event.code==='Space'){event.preventDefault();render();open();return}
      if(!['ArrowDown','ArrowUp','Enter'].includes(event.key))return;
      const options=$$('[role="option"]',popover);if(!options.length)return;
      if(event.key==='Enter'){if(activeIndex<0)return;event.preventDefault();options[activeIndex].click();return}
      event.preventDefault();open();activeIndex=event.key==='ArrowDown'?(activeIndex+1)%options.length:(activeIndex-1+options.length)%options.length;
      options.forEach((option,index)=>option.classList.toggle('is-active',index===activeIndex));options[activeIndex].scrollIntoView({block:'nearest'});
    });
    input.addEventListener('blur',()=>{closeTimer=setTimeout(close,180)});
    panel.addEventListener('mousedown',event=>event.preventDefault());
    input.addEventListener('change',()=>learnContextSuggestion(context,input.value));
    render();
  }
  function initialState(item){return {caseData:{...item},documentData:{decision:'18/1ก',reasons:[],anonymous:Boolean(item.anonymous),officerOpinion:'',proposedRegion:item.region||'',reviewRoute:'center',centerDecision:'',centerOpinion:'',centerAdditionalDetail:'',divisionOpinion:'',divisionAdditionalDetail:'',internalLetterNo:'',internalLetterDate:'',caseNumber:'',publicStatus:'',approvedAt:'',approvedBy:'',actingOfficer:'',actingOrder:'',assignedOfficer:'',backupOfficer:'',previousOfficer:'',previousBackupOfficer:'',adminNote:'',absenceReasonType:'',absenceNote:'',notAcceptReason:'',naccLetterNo:'',naccLetterDate:'',naccSendMethod:'EMS',naccEms:'',naccSentDate:'',naccBoardNo:'',naccBoardDate:'',naccBoardNote:'',naccProofName:'',naccNotified:true},workflow:{owner:'admin',stage:'admin',status:'รอลงรับและมอบหมาย',complete:false},assignmentHistory:[],decisionHistory:[],anonymousHistory:[],documentVersions:[]}}
  function issueCaseNumber(state){
    if(state.documentData.caseNumber)return state.documentData.caseNumber;
    const buddhistYear=new Date().getFullYear()+543;
    const key=`ecmis-a4-case-sequence-${buddhistYear}`;
    const next=Math.max(1,Number(localStorage.getItem(key)||0)+1);
    localStorage.setItem(key,String(next));
    state.documentData.caseNumber=`${String(next).padStart(4,'0')}/${buddhistYear}`;
    return state.documentData.caseNumber;
  }
  function getState(id){
    const store=readStore();
    const state=store[id]||initialState(CASES.find(c=>c.id===id)||CASES[0]);
    state.assignmentHistory=(state.assignmentHistory||[]).map(entry=>{
      if(/^\[(มอบหมาย|ดึงกลับ|มอบหมายใหม่)\]/.test(entry.text||''))return entry;
      const action=entry.action==='recall'||entry.text?.includes('ดึงงานกลับ')?'ดึงกลับ':entry.action==='reassign'||entry.text?.includes('เปลี่ยนผู้รับผิดชอบ')?'มอบหมายใหม่':'มอบหมาย';
      return {...entry,text:`[${action}] ${entry.text||''}`};
    });
    state.anonymousHistory=state.anonymousHistory||[];
    const legacyCaseNumber=String(state.documentData.caseNumber||'').match(/^สส\s*(\d{4})\/(\d{4})$/);
    if(legacyCaseNumber)state.documentData.caseNumber=`${legacyCaseNumber[2]}/${legacyCaseNumber[1]}`;
    return state;
  }
  function saveState(id,state){const intakeChannel=document.getElementById('wiChannel');const intakeRegion=document.getElementById('wiIntakeRegion');const anonymous=document.getElementById('wiAnonymous');if(intakeChannel){state.caseData.channel=intakeChannel.value;const usesIntakeRegion=['Walk-In','จดหมาย'].includes(intakeChannel.value);state.caseData.intakeRegion=usesIntakeRegion?(intakeRegion?.value||''):'';if(usesIntakeRegion&&intakeRegion?.value)state.caseData.region=intakeRegion.value}if(anonymous){state.caseData.anonymous=anonymous.checked;state.documentData.anonymous=anonymous.checked}const store=readStore();store[id]=state;writeStore(store)}
  function activity5Handoff(state){return window.ECMISActivity5Handoff?.read(localStorage).records[state.caseData.id]||null}
  function activity5Link(state){const handoff=activity5Handoff(state);return handoff?`<a class="ws-button primary" href="activity5/index.html#/cases/${encodeURIComponent(handoff.activity5CaseId)}">เปิด Activity 5</a>`:''}
  function notify(icon,title,text){if(window.Swal)return Swal.fire({icon,title,text,confirmButtonText:'ปิด',confirmButtonColor:'#082b50'});alert(`${title}\n${text}`)}
  function confirmDo(title,text,confirmButtonText='ยืนยัน'){if(!window.Swal)return Promise.resolve({isConfirmed:confirm(`${title}\n${text}`)});return Swal.fire({icon:'question',title,text,showCancelButton:true,confirmButtonText,cancelButtonText:'ยกเลิก',confirmButtonColor:'#082b50',cancelButtonColor:'#687789'})}
  function header(roleSelect=true){return `<header class="ws-topbar"><div class="ws-topbar-inner"><a class="ws-brand" href="index.html"><span class="ws-brand-mark">ศร</span><span><strong>E-CMIS</strong><small>ระบบบริหารจัดการเรื่องร้องเรียน</small></span></a>${roleSelect?`<div class="ws-profile"><button type="button" class="ws-admin-tool ws-button secondary" id="manageSuggestions">จัดการคำแนะนำ</button><button type="button" class="ws-admin-tool ws-button secondary" id="manageBackups">จัดการผู้ปฏิบัติงานแทน</button><span>สิทธิ์การทำงาน</span><select class="ws-role-select" id="wsRole"><option value="admin">ธุรการ ศรร.</option><option value="officer">เจ้าหน้าที่รับเรื่อง</option><option value="center">ผอ.ศรร.</option><option value="division">ผอ.กบค.</option><option value="acting">ผู้รักษาราชการแทนตามคำสั่ง</option></select></div>`:`<a class="ws-button secondary" href="staff-workflow.html">กลับรายการเจ้าหน้าที่</a>`}</div></header>`}
  function attachmentList(c){return `<div class="ws-attachment-list"><h3>เอกสารแนบ ${c.attachments.length} รายการ</h3>${c.attachments.length?`<ol>${c.attachments.map(name=>`<li><button type="button" class="ws-attachment-open" data-attachment="${escapeHtml(name)}">${escapeHtml(name)}</button></li>`).join('')}</ol>`:'<p class="ws-empty">ไม่มีเอกสารแนบ</p>'}</div>`}
  function caseReadonly(c){return `<div class="ws-readonly"><dl><div><dt>ผู้ร้องเรียน</dt><dd>${escapeHtml(c.complainant)}</dd></div><div><dt>หน่วยงานที่ถูกร้อง</dt><dd>${escapeHtml(c.agency)}</dd></div><div><dt>ชื่อเรื่องร้องเรียน</dt><dd>${escapeHtml(c.subject)}</dd></div><div><dt>สถานที่เกิดเหตุ</dt><dd>${escapeHtml(c.place)}</dd></div><div><dt>เลขติดตาม</dt><dd>${c.trackingYear} / ${c.trackingCode}</dd></div><div><dt>เอกสารแนบ</dt><dd>${c.attachments.length} รายการ</dd></div></dl></div>${attachmentList(c)}`}
  function adminCaseSummary(c){return `<div class="ws-readonly ws-admin-summary"><dl><div><dt>ผู้ร้องเรียน</dt><dd>${escapeHtml(c.complainant)}</dd></div><div><dt>เลขบัตรประชาชน 4 หลักท้าย</dt><dd>${escapeHtml(c.id4)}</dd></div><div class="ws-field-full"><dt>ชื่อเรื่องร้องเรียน</dt><dd>${escapeHtml(c.subject)}</dd></div><div><dt>ผู้ถูกร้อง/หน่วยงาน</dt><dd>${escapeHtml(c.agency)}</dd></div><div><dt>ประเภทเรื่อง</dt><dd>${escapeHtml(c.type)}</dd></div><div class="ws-field-full"><dt>รายละเอียดพฤติการณ์</dt><dd>${escapeHtml(c.detail)}</dd></div><div><dt>สถานที่เกิดเหตุ</dt><dd>${escapeHtml(c.place)}</dd></div><div><dt>จังหวัด/เขตพื้นที่</dt><dd>${escapeHtml(c.province)} · ${escapeHtml(c.region)}</dd></div><div class="ws-field-full"><dt>ความเสียหายหรือความเดือดร้อน</dt><dd>${escapeHtml(c.damage)}</dd></div><div class="ws-field-full"><dt>ความประสงค์ของผู้ร้อง</dt><dd>${escapeHtml(c.request)}</dd></div></dl></div>${attachmentList(c)}`}
  const PACC_LOGO = 'https://www.pacc.go.th/images/pacc_logo.png';
  const GARUDA_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADKBAMAAAAFnIJvAAAABGdBTUEAALGIlZj0pgAAADBQTFRFAAAAgAAAAIAAgIAAAACAgACAAICAgICAwMDA/wAAAP8A//8AAAD//wD/AP//////ex+xxAAAAAlwSFlzAAAOQAAADkUBMpLx3wAADBBJREFUeJzVnAuC5LYKRdkB+98lO+CVBZePLNmuT78klWSmuyzrCIEQYDmkf/2h/yZBiFcE+h1Mal/xI/2Q0IaLn15YXjf+6FPm6f9H+O0kVU1QfPNjAkOIJPxyklQ4Rux/068JJJ1QvvjRh0S4EfjnBKa/JsSiG38J/dJnoN8/J2Ca/ozAWgnHrw8JT42aWFy1RpCnBHljJH9NIMhL47a/kEGkEPggPJrgp4TXDIl2gnxFOI1Phh4mAk1Nln29hnYeydF2vp2PPoPwmjOeCHbTmbEieFu2nkMoKrN0ELT7c6I1YkUYzXyE4e4omjrhtcgFNzA2pDNBNjKwqwLalCFBkYEOGVLAaH4S4SAs1BNCUBDYZiYJ1Ahityx0yusoUax97MWvKWmzNHY4yQ2VDbDq6RBt8b2hCcN+dfiiuWM6E9g0vLT7PcHmqRG0EPiQkEEYsi7MXq339RVTtuN9gU0Edb6a4a6dw54whGDv7lgMQy2dQK6nMf51N07YauK42ayKc1czwhCQQdCtFsj+2QlhNx/qsDUXhPELmyROWM/1bqWnEOjO1FAJY5rsXtb9XN8Sjgn2SVoQzJ2OSV7O9OEHxmfDh/CvBjZVE4EqYa1nwlh2l9VcY/aXBLfQw2AvCAyvsZ4mC4xsb5sI4oT0f7tpGIRh9YsWNr9Dzz7o4pegCDjsxf3kywamsiEoCJGSgGDThG9XhOOi7xpre4IMqYZcWkYYElwQ+ueSYJPUCKYb3LoyRynrYa8HcXOWmSDkg5QtgaoYw4GcCDaFYjMhneAG5mIsdjexFZSERQQ3tq7Xf9Y3UdM0ljQ+SwKNXWvrOsRW/EFwaZotFSNZE9gn8Ypgl4790xXSCB6Q7AmxSfr1k+vCzezGj0EEgaqtnFQ9NmgSiBohY1NDnYJOiF/30xR6jnjz3KTeLCtC18Tp9jbGMMUipbfg7KllivM0zffbsAnjWRAgHdbziuBWblY96+HYs2yVYRhTAw/JzCVZMF8IYAr+QGiVHdjWhXmIyGjWwrgbZqWdwNTnes44dMQYIfK0C9XlSl3KJMg1QbLTh4ReOUn14OqEYOXWSycIdQqXJC0CbrcFieHPhD6CvslBqclfERBsRJbR+3C/E1tVtQTJXjgAC4IbfKqodhJwiT9OIoRBbQmYaenX/GcKQZm0WTN+Dg3LmRDOpllBXxNS97gWlUVfYwBmdhsCuY/n6VbrXy0YEcsNkkApwrgCB3KapQxEqN6j9UdWSwFbkxTB8pDhW3MIFA0x/CqE1J6ijFBcawGYgpxOmcYEIbxvncOU4jUoQep3DDVXQIzVfhxuSUoak7M1+pZJiOhiBK0wlgMGCVpLsoXT1kvIOOJu8si83Wc++wgGop5irpWmCXW/T9MY8QNDFX2aSp/Fo6Xd1klCGOUamQm5VqqCI4iLMCRXVF87pdbSt5eqU3TukXiRIRDsmatJ1kXAypDueQsBu6fklmzbp93POWILHZEUxvgI+xPvCAIhi/gWI6Fm4P2M4o6t8UpQT0J7AlM0MuJBSA+EJ9niK9o+jFo/ZOh+TYXXhMNeJPaAWLWWJ1dvPUI+nxEvIfg6gaktZ8mWSrgs/M1OYM7GrCh1OmEYeYaS4M4E0cgibPVbDcIInn/CWrNrheakBNhaP4XgtfCUt+hyqKOmTnZVpOdGUBktCUiDYbjm3fyJkYXjGQ564UVIM1a25eAiLwm5NZXN7vByuJoWAGsck0VBgC9u8WAjsMVlUgyWQCBB6MypylGnLSucLE3lDcEliMWJ5M0usuS1cAtSAhfQ5+RlJjSVkRnJuD8yLNvtO8H9gRB8yYYQ/rF/cE3TvVrLogJJdzxX6SZCrLbIlDAgWwU+YFNmy0TSjes1Ab4ChLJViIdMKFaO5cEhIzqcH0/OIXT41JQCvljMdXESfFfX9Ftedt0S0qLDm5dAVsh9h2QYN6IcLERzXnPpqf+KsjULKiCNoF4dKwSq1tEUsibgXp5MNm6qQXdJSWERfBZhSWCEwcgvGyHbcvGSsYmcU/HpV/fcfHg8igjjHAZDBnO35DqaE4sFAUsiqoLScrK5KWeE0W6/ILTsBZHwnmB/l5tXj7pO9xXjKZHXmUCRmo/tUWllqguCCsGUYIK5cCcRQhCJWOqkhQWhVGvICy2qZ/1B0OoZT8v5HyPkdumbTcsT0m/5phffo/E9oberyo462SLlO914RdDuJY5Yq3DyxxYaLpfCloBJGYVTBNnnT3ru+OIpoW5dWkus5icaxtvwFNreEco8RYRh0Ax0ULymiKfWgA2hevzpB4w8484qzRuE8GuZHvYJr6rZWNE1QcVTGevymiAfEWBRpdPiFOewag+4IaRaI+c8pcHt8luEMkI+dyEUsYJcC7E3AUL4ZEvgTIgzHjuPdE1wRctwGfN5EbUIIbze3mXsCfBxYiWjUw82Sa3tThUbAgXBApQgYGKIOCNJOg/hjoBq4CudIU/Qsfo0CiyUjfnivN7yazu8Mh7SGsEzPN/W2EXohO10rEWwO8yQvD+sLEy7zaIRWXPSHsoQ7oa84j2nRpyrIN37Y0LdOb3c0J4oTv3h940iloSsGvrpjIigUhT7Psazn6a1DKYGIS8rZZnSFziJEcb+wHZ2aBmObQhWwrBnTjrqGpCBfRdF7G/llvH0/y0ZUNIzixyZp3km7KIczlBaFPqcEHOtFCd2zNWZeVWzkaqbx4R6W4kUzYDGejaopp5xZugpQSmUW+ogueWU7whl+shRnxLGFFF5WD894XAhxomeUS/YHUnaEaxeJGVc4gE2vKpYue/4HinjG7aEXNr9GWbdCOMkndqKCEsq9d4nBE/zwzkwzk1Z6ujpVJTvzSDeIdjjjoiHIZj1J173zIoWix/aeYMQmhOcr4H/lPEQOcjmLoygvbx3S/Bd5aiqeWCN+GkUsjzmZ/Gzh8Po3iCU2lorIpuO4zEB9Q8vJ2mfP1RlI1C1+loU2ymefoxDju/tcdhCzW1ADBslSQByF9H39ulRDBtLjiV6UZU8iRfDxylQ2R0N2xHYqrvFFR2lc4UMdZ+Fs13reRsvoVe4v+qOwkGx5CVaO9YtoUYXReHSCf2zAVzErapRIo4x60SwXXV1BOWWYAHqcQZkHADEUQ4jxLMDcgNeVMYeEFqO6+7Zs2cUuYvFbnu5ImhRqFaC+qxkLn+RY10TomjrNFh8nuy7np8nBOz+7iJQJJE4WXoPeELwNZy9SRTcf0TQXIG+sWaC8j1Bqgjtw/6M6wcEPe8ENmMU178h+NawyB58/X1kS12nVkVdCEGTEETrlXf+roY+VYQTJR7lALCuYp0IsYFxDBC73ayIKIsr8uwV4lSvwH4eKwDr+ixCebrR6ro3hFK79dGxZ6VnQl92kqQrQhmQOSI7jn98OdvT9HygRYjXMrTTR0J4EaBvzgTHlEPjVPsNQdXPUOBGjC9PbzYL0ibHLWFOZEolvZ+FwNTLqvW1DPFOTdSMQaBqPG04IfAjwly6q4R0Ut661BWr1d4RyngxzLmugVJ0HfIbhP5sgKynZqxsWYNGfhHt72dJM5NJUcSPPcVGJHYcNW2Ud739k4R0sObhuATEGudyCDkYFuIT3xqnZzL1MUz6b7bXNKrSJvO4kQG9DJwBSPM4nqc8EUbNvvjJLOV3yKQUbxr6G0dUJG11mqezVAAIIOONBp5EoPoS1TNCZkuCp1W+AHgcyKYQwdrcRlyX18TjU3+5xQmea/t6pN37QfeEEsOgwON1y3hZ2T3IxwR/jOKCeELrsV6+VETbLPQBoYQo5NUkZSovsHqd6fJzTSiPbk3vXhEoRirfyBC1QX9RmZwAV+7b3OeaRvVxJAviZSfliBUow6lPCXYziqz+mmyN/5Ru8tA7gh2QHv+KouzMEZ3Zq27f5nHWvQUZY8rtoYeks/g2fxD2U5SjcOuhsPqbk97gO4Kn/bYn4JVr9lNSi1d2PiB49OonAyNeUt6/tvouQW2DswDZt1V/LPFLgtlPvK3qvvt3BIsr4B4kCU8AzwjxOjI1wrPPo4bYqo2Aze8+WX9OiMcL42yls54K8bSd1eqD8EzJbxE8AmYk0Y8Bzwlo/sboPyK8NfoPCe+K8O8jPP5/tXxBeBfwwR3vfv4HpAT+CEwM+dUAAAAASUVORK5CYII=';
  const checkMark = checked => `<span class="doc-checkbox" aria-hidden="true">${checked?'✓':''}</span>`;
  function form3Paper(state){
    const c=state.caseData,d=state.documentData;
    const selected = value => d.decision===value;
    const naccReasons = NACC_TRANSFER_REASONS.map(reason=>[reason,reason]);
    const reasonChecked = key => d.reasons.some(reason=>reason.includes(key));
    const assignment = escapeHtml(d.assignedOfficer||'................................................................................');
    const line = value => escapeHtml(value||'................................................................................');
    return `<article class="a4-paper template-form3" id="activePaper">
      <p class="document-confidential confidential-top">ลับ</p>
      <header class="form3-header">
        <img src="${PACC_LOGO}" alt="ตราสำนักงาน ป.ป.ท.">
        <div class="form3-title">ระบบบริหารจัดการเรื่องร้องเรียน สำนักงาน ป.ป.ท.</div>
        <div class="form3-number"><strong>เลขรับเรื่องที่</strong> ${escapeHtml(c.id)}<br><strong>วันที่</strong> ${escapeHtml(c.received)}</div>
      </header>
      <div class="official-subject"><strong>เรื่อง</strong><span>การพิจารณารับและกลั่นกรองเรื่องร้องเรียน/เบาะแส กรณี ${escapeHtml(c.subject)}</span><strong>เรียน</strong><span>เลขาธิการคณะกรรมการ ป.ป.ท.</span></div>
      <p class="form3-intro">ได้พิจารณาแล้ว จึงขอเสนอเพื่ออนุมัติ ดำเนินการตาม พ.ร.บ. ป.ป.ท. ดังนี้</p>
      <div class="form3-decision-grid">
        <section class="form3-decision-column">
          <h3>${checkMark(selected('send-nacc'))} ไม่รับไว้ดำเนินการ ส่งสำนักงาน ป.ป.ช.</h3>
          <p class="form3-section-label">เหตุที่ไม่สามารถรับไว้ดำเนินการ</p>
          ${naccReasons.map(([key,label])=>`<p>${checkMark(selected('send-nacc')&&reasonChecked(key))} ${label}</p>`).join('')}
          <p>${checkMark(selected('send-nacc')&&d.reasons.some(reason=>!naccReasons.some(([key])=>reason.includes(key))))} อื่น ๆ ${line(d.reasons.find(reason=>!naccReasons.some(([key])=>reason.includes(key))))}</p>
          <div class="form3-writing-lines"></div>
          <h3>${checkMark(selected('not-accept'))} ไม่รับไว้ดำเนินการ</h3>
          <p class="form3-free-text">${line(d.notAcceptReason)}</p>
          <div class="form3-writing-lines compact"></div>
        </section>
        <section class="form3-decision-column form3-accept-column">
          <h3>${checkMark(selected('18/1ก'))} รับไว้ตรวจสอบ กรณี มาตรา 18/1 (ก)</h3>
          <p>${checkMark(selected('18/1ก'))} มอบหมาย สำนัก/กอง (สำหรับ ศรร. กบค.)</p><p class="form3-line">${selected('18/1ก')?'กองบริหารคดี':'................................................................................'}</p>
          <p>${checkMark(selected('18/1ก'))} มอบหมาย ผู้รับผิดชอบ (สำหรับ สำนัก/กอง)</p><p class="form3-line">${selected('18/1ก')?assignment:'................................................................................'}</p>
          <h3>${checkMark(selected('18/1ข'))} รับไว้ตรวจสอบ กรณี มาตรา 18/1 (ข)</h3>
          <p>${checkMark(selected('18/1ข'))} มอบหมาย สำนัก/กอง (สำหรับ ศรร. กบค.)</p><p class="form3-line">${selected('18/1ข')?'กองบริหารคดี':'................................................................................'}</p>
          <p>${checkMark(selected('18/1ข'))} มอบหมาย ผู้รับผิดชอบ (สำหรับ สำนัก/กอง)</p><p class="form3-line">${selected('18/1ข')?assignment:'................................................................................'}</p>
          <h3>${checkMark(selected('18/4'))} รับไว้ตรวจสอบ กรณี มาตรา 18/4</h3>
          <p>${checkMark(selected('18/4'))} มอบหมาย สำนัก/กอง (สำหรับ ศรร. กบค.)</p><p class="form3-line">${selected('18/4')?'กองบริหารคดี':'................................................................................'}</p>
          <p>${checkMark(selected('18/4'))} มอบหมาย ผู้รับผิดชอบ (สำหรับ สำนัก/กอง)</p><p class="form3-line">${selected('18/4')?assignment:'................................................................................'}</p>
          <h3>${checkMark(selected('58/2'))} รับไว้ตรวจสอบ กรณี มาตรา 58/2</h3>
          <p>${checkMark(selected('58/2'))} มอบหมาย สำนัก/กอง (สำหรับ ศรร. กบค.)</p><p class="form3-line">${selected('58/2')?'กองบริหารคดี':'................................................................................'}</p>
          <p>${checkMark(selected('58/2'))} มอบหมาย ผู้รับผิดชอบ (สำหรับ สำนัก/กอง)</p><p class="form3-line">${selected('58/2')?assignment:'................................................................................'}</p>
        </section>
      </div>
      <div class="form3-footer-block">
        <p><strong><em>หมายเหตุ</em></strong> ให้สแกนเอกสารที่สำคัญและจำเป็นลงในระบบฯ<br><span>ทั้งนี้ กรณีส่งเรื่องไปยังระบบไต่สวนให้นำเข้าเอกสารที่สแกนลงในระบบไต่สวนด้วย</span></p>
        <p class="form3-submit">จึงเรียนมาเพื่อโปรดพิจารณา</p>
        <div class="form3-operator"><p>.....................................................................</p><p>ชื่อผู้ดำเนินการ</p><p>ตำแหน่งผู้ดำเนินการ</p></div>
      </div>
      <div class="form3-opinion-grid">
        <section><h3>ความเห็น ผู้บังคับบัญชาชั้นต้น</h3><p>${line(d.centerOpinion)}</p>${d.centerAdditionalDetail?`<p><strong>รายละเอียดเพิ่มเติมประกอบการพิจารณา:</strong> ${escapeHtml(d.centerAdditionalDetail)}</p>`:''}<p>.....................................................................</p><p>(...................................................................)</p><p>ตำแหน่ง ................................................................</p></section>
        <section><h3>ความเห็น ผู้อำนวยการสำนัก/กอง</h3><p>${line(d.divisionOpinion)}</p>${d.divisionAdditionalDetail?`<p><strong>รายละเอียดเพิ่มเติมประกอบการพิจารณา:</strong> ${escapeHtml(d.divisionAdditionalDetail)}</p>`:''}<p>.....................................................................</p><p>(...................................................................)</p><p>ตำแหน่ง ................................................................</p></section>
      </div>
      <p class="document-confidential confidential-bottom">ลับ</p>
    </article>`;
  }
  function receiptPaper(c,qr=''){
    const officeRows = [
      ['กองปราบปรามการทุจริตในภาครัฐ 1','025026670-80 ต่อ 2109',''],['กองปราบปรามการทุจริตในภาครัฐ 2','025026670-80 ต่อ 2206',''],['กองปราบปรามการทุจริตในภาครัฐ 3','025026670-80 ต่อ 2301, 2308',''],['กองปราบปรามการทุจริตในภาครัฐ 4','025026670-80 ต่อ 2407',''],['กองปราบปรามการทุจริตในภาครัฐ 5','025026670-80 ต่อ 2502',''],['กองอำนวยการต่อต้านการทุจริต','025026670-80 ต่อ 4222',''],
      ['สำนักงาน ป.ป.ท. เขต 1','035323365-8','22/25 ถนนนเรศวร ตำบลประตูชัย อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา 13000'],['สำนักงาน ป.ป.ท. เขต 2','033004537','388 หมู่ 1 ตำบลหนองไม้แดง อำเภอเมือง จังหวัดชลบุรี 20000'],['สำนักงาน ป.ป.ท. เขต 3','044465054','118 หมู่ 10 ถนนมิตรภาพ ตำบลโคกกรวด อำเภอเมือง จังหวัดนครราชสีมา 30280'],['สำนักงาน ป.ป.ท. เขต 4','043239092-3','4/33 ถนนหน้าเมือง ตำบลในเมือง อำเภอเมือง จังหวัดขอนแก่น 40000'],['สำนักงาน ป.ป.ท. เขต 5','053112802','ศูนย์ราชการจังหวัดเชียงใหม่ ถนนโชตนา อำเภอเมือง จังหวัดเชียงใหม่ 50300'],['สำนักงาน ป.ป.ท. เขต 6','055304117','723/13-17 ถนนพิชัยสงคราม ตำบลในเมือง อำเภอเมือง จังหวัดพิษณุโลก 65000'],['สำนักงาน ป.ป.ท. เขต 7','034272338-41','445/2 ถนนเทศา ตำบลพระประโทน อำเภอเมือง จังหวัดนครปฐม 73000'],['สำนักงาน ป.ป.ท. เขต 8','077206185','91/1 หมู่ 1 ถนนกาญจนวิถี ตำบลบางกุ้ง อำเภอเมือง จังหวัดสุราษฎร์ธานี 84000'],['สำนักงาน ป.ป.ท. เขต 9','074552027-8','116 หมู่ 2 ถนนเพชรเกษม ตำบลควนลัง อำเภอหาดใหญ่ จังหวัดสงขลา 90110']
    ];
    const directoryPage = (rows,page)=>`<article class="a4-paper receipt-directory-page"><h2>เบอร์โทรศัพท์ สำนัก / กอง / ศูนย์</h2>${page===2?'<p class="directory-head"><strong>สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ (สำนักงาน ป.ป.ท.)</strong><br>99 หมู่ 4 อาคารซอฟต์แวร์ปาร์ค ถนนแจ้งวัฒนะ ตำบลคลองเกลือ อำเภอปากเกร็ด จังหวัดนนทบุรี 11120</p>':''}<div class="receipt-directory">${rows.map(([name,phone,address])=>`<section><div><strong>${name}</strong><strong>โทร: ${phone}</strong></div>${address?`<p>${address}</p>`:''}</section>`).join('')}</div><p class="document-page-number">หน้า ${page} จาก 3</p></article>`;
    return `<div class="document-page-set" id="activePaper">
      <article class="a4-paper template-receipt">
        <header class="receipt-header"><img src="${PACC_LOGO}" alt="ตราสำนักงาน ป.ป.ท."><div class="receipt-code-box"><strong>58/2-02</strong><span>แบบแจ้งเลขเรื่องร้องเรียน/เลขติดตาม PCMS</span></div></header>
        <div class="doc-heading"><h2>แบบแจ้งเลขเรื่องร้องเรียนและเลขติดตามเรื่องร้องเรียน</h2><p>ระบบการตรวจสอบข้อเท็จจริง สำนักงาน ป.ป.ท.</p><p>ศูนย์รับเรื่องร้องเรียน/สำนักงาน ป.ป.ท. เขต ${escapeHtml(c.region||'ส่วนกลาง')}</p></div>
        <div class="receipt-fields"><p>วันที่ <strong>${escapeHtml(c.received)}</strong></p><p>เรื่องที่ <strong>${escapeHtml(c.id)}</strong></p><p>เลขรับบริการ <strong>${escapeHtml(c.trackingYear)}</strong></p><p>รหัสติดตาม 4 ตัว <strong>${escapeHtml(c.trackingCode)}</strong></p><p>หน่วยงานที่รับเรื่องร้องเรียน <strong>ศูนย์รับเรื่องร้องเรียน สำนักงาน ป.ป.ท.</strong></p><p>โทร: <strong>สายด่วน 1206</strong></p><p>ที่อยู่ <strong>99 หมู่ 4 อาคารซอฟต์แวร์ปาร์ค ถนนแจ้งวัฒนะ ตำบลคลองเกลือ อำเภอปากเกร็ด จังหวัดนนทบุรี 11120</strong></p></div>
        <p class="receipt-instruction">ท่านสามารถติดตามเรื่องร้องเรียนของท่านได้ที่หน่วยงานข้างต้น<br>หรือติดตามสถานะเรื่องร้องเรียนตาม QR CODE ด้านท้ายหนังสือฉบับนี้<br>โดยให้ท่านใส่เลขเรื่องร้องเรียน และเลขติดตามตามที่กำหนด</p>
        <p class="receipt-officer">เจ้าหน้าที่ผู้รับเรื่อง <strong>${escapeHtml(c.receivingOfficer||'........................................................')}</strong> ตำแหน่ง <strong>เจ้าหน้าที่รับเรื่องร้องเรียน</strong></p>
        <div class="receipt-signature-row">${qr?`<figure><img class="doc-qr" src="${qr}" alt="QR Code ติดตามเรื่อง"><figcaption>ระบบติดตามสถานะเรื่องร้องเรียน</figcaption></figure>`:'<div class="doc-qr"></div>'}<div><p>ศูนย์รับเรื่องร้องเรียน/สำนักงาน ป.ป.ท.</p><p>สำนักงาน ป.ป.ท.</p></div></div>
        <p class="receipt-red-note"><strong>หมายเหตุ</strong> เอกสารฉบับนี้ถือเป็นเอกสารแจ้งให้ทราบว่า สำนักงาน ป.ป.ท. ได้รับเรื่องร้องเรียนของท่านไว้ดำเนินการแล้ว ขอให้เก็บรักษาเอกสารไว้เพื่อยืนยันตัวบุคคล หรือเพื่อติดตามเรื่องร้องเรียนของท่าน ทั้งจากหน่วยงานที่รับเรื่อง และระบบการติดตามเรื่องร้องเรียน สำนักงาน ป.ป.ท.</p>
        <p class="document-page-number">หน้า 1 จาก 3</p>
      </article>
      ${directoryPage(officeRows.slice(0,13),2)}${directoryPage(officeRows.slice(13),3)}
    </div>`;
  }
  function docTabs(state,role){
    if(role==='admin')return '';
    const docs=[['form3','แบบฟอร์ม 3']];
    if(state.workflow.complete&&state.documentData.decision==='18/4')docs.push(['1-04','ปปท. 1-04']);
    if((state.workflow.complete||state.workflow.stage==='nacc-dispatch')&&state.documentData.decision==='send-nacc')docs.push(['1-11','ปปท. 1-11']);
    return docs.map(([id,name],i)=>`<button class="ws-doc-tab ${i?'':'active'}" data-doc="${id}" aria-selected="${i?'false':'true'}">${name}</button>`).join('');
  }
  function documentPaper(state,id,role){if(role==='admin')return '';return id==='form3'?form3Paper(state):officialOutgoingDocument(state,id)}
  function stagebar(state,role){if(role==='admin'){const assigned=state.assignmentHistory.length>0||Boolean(state.documentData.assignedOfficer);return ['ลงรับเรื่อง','ตรวจคำแนะนำเรื่องซ้ำ','มอบหมายเจ้าหน้าที่'].map((label,index)=>`<span class="ws-stage ${assigned||index===0?'done':index===1?'active':''}">${label}</span>`).join('')}const isNacc=state.documentData.decision==='send-nacc';const stages=isNacc?['ธุรการลงรับ','เจ้าหน้าที่จัดทำ Form 3','ผอ.ศรร. ให้ความเห็น','ผอ.กบค. อนุมัติ','จัดส่ง ป.ป.ช.']:['ธุรการลงรับ','เจ้าหน้าที่จัดทำ Form 3','ผอ.ศรร. ให้ความเห็น','ผอ.กบค. มีคำสั่ง'];const stageIndex={admin:0,officer:1,center:2,division:3,'nacc-dispatch':4,complete:stages.length}[state.workflow.stage]??stages.length-1;return stages.map((label,index)=>`<span class="ws-stage ${state.workflow.complete||index<stageIndex?'done':index===stageIndex?'active':''}">${label}</span>`).join('')}
  function officialOutgoingDocument(state,id){
    const c=state.caseData,d=state.documentData;
    const signature=`<div class="official-signature"><p>(........................................................)</p><p>${id==='1-04'?'ผู้อำนวยการสำนัก/กอง':'เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ'}</p>${id==='1-11'?'<p>หรือผู้ที่ได้รับมอบหมาย</p>':''}</div>`;
    if(id==='1-04')return `<article class="a4-paper template-memo" id="activePaper">
      <div class="memo-heading"><img class="memo-garuda" src="${GARUDA_IMAGE}" alt="ตราครุฑ"><h2>บันทึกข้อความ</h2></div>
      <div class="memo-metadata"><p><strong>ส่วนราชการ</strong> สำนัก/กอง ........................................................ <strong>โทร.</strong> ........................</p><p><strong>ที่</strong> ปป ๐๐ ....../........ <strong>วันที่</strong> ........................................................</p><p><strong>เรื่อง</strong> ส่งสำนวนเรื่องกล่าวหาร้องเรียน กรณี ${escapeHtml(c.subject)}</p><p><strong>เรียน</strong> ผู้อำนวยการสำนัก/กอง</p></div>
      <div class="official-body"><p>ตามที่พระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริตในภาครัฐ พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม ตามมาตรา ๑๘/๔ (๒) กำหนดให้ ในกรณีที่เป็นเรื่องที่อยู่ในหน้าที่และอำนาจของคณะกรรมการ ป.ป.ท. ตามพระราชบัญญัตินี้และมิใช่เป็นกรณีที่ปรากฏว่าการกระทำของเจ้าหน้าที่ของรัฐมีลักษณะเป็นการทุจริตต่อหน้าที่รวมอยู่ด้วย และเรื่องนั้นมิได้รับมอบหมายจากคณะกรรมการ ป.ป.ช. ตามมาตรา ๑๘/๑ เมื่อเลขาธิการสั่งให้ดำเนินการต่อไปแล้ว ให้พนักงาน ป.ป.ท. มีอำนาจดำเนินการไต่สวนตามพระราชบัญญัตินี้ การไต่สวนดังกล่าวให้อยู่ภายใต้การกำกับดูแลของคณะกรรมการ ป.ป.ท. นั้น</p><p>ในการนี้ สำนัก/กอง ได้ตรวจสอบแล้ว พบว่าเป็นเรื่องร้องเรียนซึ่งอยู่ในอำนาจหน้าที่ จึงขอส่งเรื่องร้องเรียนกรณีประพฤติมิชอบให้ดำเนินการ คือ เรื่องที่ <strong>${escapeHtml(c.subject)}</strong> (เลขรับเรื่องที่ <strong>${escapeHtml(c.id)}</strong> ลงวันที่ <strong>${escapeHtml(c.received)}</strong>) จำนวน <strong>${c.attachments.length}</strong> รายการ ทั้งนี้ เมื่อได้รับเรื่องแล้ว ให้พิจารณามอบหมายผู้รับผิดชอบสำนวนดำเนินการตามอำนาจหน้าที่ พร้อมสรุปพฤติการณ์โดยย่อและระบุชื่อเจ้าของสำนวนลงในระบบไต่สวนด้วย รายละเอียดตามเอกสารที่แนบมาพร้อมนี้</p><p>จึงเรียนมาเพื่อโปรดพิจารณา</p></div>${signature}<p class="official-form-code">ปปท. 1-04</p>
    </article>`;
    if(id==='1-11')return `<article class="a4-paper template-official-letter" id="activePaper">
      <div class="official-letter-head"><p><strong>ที่</strong> ${escapeHtml(d.naccLetterNo||'ปป ๐๐.../.....')}</p><p>สำนักงาน ป.ป.ท.<br>อาคารซอฟต์แวร์ปาร์ค ถนนแจ้งวัฒนะ<br>อำเภอปากเกร็ด จังหวัดนนทบุรี ๑๑๑๒๐</p></div>
      <p class="official-date">${escapeHtml(d.naccLetterDate||'(วัน เดือน ปี)')}</p>
      <div class="official-subject"><strong>เรื่อง</strong><span>ส่งเรื่องร้องเรียนเจ้าหน้าที่ของรัฐ กรณี ${escapeHtml(c.subject)}</span><strong>เรียน</strong><span>เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ</span><strong>สิ่งที่ส่งมาด้วย</strong><span>๑. บัญชีเรื่องร้องเรียน จำนวน .......... แผ่น<br>๒. ต้นฉบับเอกสารเรื่องร้องเรียน จำนวน ๑ เรื่อง</span></div>
      <div class="official-body"><p>ตามที่รัฐธรรมนูญแห่งราชอาณาจักรไทย พุทธศักราช ๒๕๖๐ มาตรา ๒๓๔ (๒) ได้กำหนดให้คณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ มีหน้าที่และอำนาจในการไต่สวนและวินิจฉัยว่าเจ้าหน้าที่ของรัฐร่ำรวยผิดปกติ กระทำความผิดฐานทุจริตต่อหน้าที่ หรือกระทำความผิดต่อตำแหน่งหน้าที่ราชการ หรือความผิดต่อตำแหน่งหน้าที่ในการยุติธรรม ประกอบกับพระราชบัญญัติประกอบรัฐธรรมนูญว่าด้วยการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๖๑ มาตรา ๕๙ และมาตรา ๑๘/๔ (๑) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม กำหนดให้ส่งเรื่องร้องเรียนที่อยู่ในหน้าที่และอำนาจของคณะกรรมการ ป.ป.ช. ให้คณะกรรมการ ป.ป.ช. ดำเนินการตามอำนาจหน้าที่ต่อไป นั้น</p><p>สำนักงาน ป.ป.ท. ได้รับเรื่องร้องเรียนกรณี <strong>${escapeHtml(c.subject)}</strong> จากการตรวจสอบพบว่า ${escapeHtml(d.reasons.join(' และ ')||'เรื่องอยู่ในหน้าที่และอำนาจของคณะกรรมการ ป.ป.ช.')} จึงขอส่งเรื่องร้องเรียนเจ้าหน้าที่ของรัฐ จำนวน ๑ เรื่อง ให้สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติพิจารณาดำเนินการตามอำนาจหน้าที่ต่อไป รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย ๑ และ ๒ ตามลำดับ</p><p>จึงเรียนมาเพื่อโปรดพิจารณา</p></div>${signature}
      <div class="official-contact"><p>กอง/สำนัก ........................................</p><p>โทร. ........................................ โทรสาร ........................................</p><p>เจ้าของสำนวน ${escapeHtml(d.assignedOfficer||'........................................')}</p></div>
      <p class="official-form-code">ปปท. 1-11</p>
    </article>`;
    return '<div class="document-placeholder">ยังไม่มีเอกสารที่ยืนยันสำหรับขั้นตอนนี้</div>';
  }
  function renderWalkin(){
    document.body.classList.add('walkin-mode');
    const shell=document.createElement('div');shell.className='a4-walkin-shell';shell.innerHTML=`${header(false)}<main class="ws-container"><div class="ws-page-head"><div><p class="ws-kicker">Activity 4 · ช่องทาง Walk-in</p><h1>บันทึกข้อมูลเรื่องร้องเรียน</h1><p>กรอกข้อมูล ตรวจสอบเอกสาร และลงรับเรื่องเพื่อออกใบแจ้งเลขติดตาม</p></div></div><div class="document-workspace"><section class="ws-card ws-editor"><header class="ws-editor-head"><div><p class="ws-kicker">1-02 / แบบ Walk-in</p><h2>ข้อมูลเรื่องร้องเรียน</h2></div><span class="ws-status">กำลังจัดทำ</span></header><div class="ws-editor-body"><div class="ws-section"><h3>ข้อมูลผู้ร้อง</h3><div class="ws-grid-2"><div class="ws-field"><label>ชื่อ-นามสกุลผู้ร้อง</label><input id="wiComplainant" value="นายสมชาย ใจดี"></div><div class="ws-field"><label>เลขบัตรประชาชน</label><input id="wiCitizen" value="1-1001-00123-45-6"></div><div class="ws-field"><label>โทรศัพท์</label><input id="wiPhone" value="0812345678"></div><div class="ws-field"><label>อีเมล</label><input id="wiEmail" value="somchai@example.com"></div></div></div><div class="ws-section"><h3>รายละเอียดคำร้อง</h3><div class="ws-grid-2"><div class="ws-field ws-field-full"><label>ชื่อเรื่องร้องเรียน</label><input id="wiSubject" value="ร้องเรียนการจัดซื้อวัสดุสำนักงานไม่เป็นไปตามระเบียบ"></div><div class="ws-field"><label>ชื่อผู้ถูกร้อง/หน่วยงาน</label><input id="wiAccused" value="สำนักงานจัดการทรัพย์สินภาครัฐ"></div><div class="ws-field"><label>ตำแหน่ง/สังกัด</label><input id="wiPosition" value="เจ้าหน้าที่ผู้รับผิดชอบโครงการ"></div><div class="ws-field ws-field-full"><label>รายละเอียดพฤติการณ์</label><textarea id="wiDetail">ผู้ถูกร้องมีพฤติการณ์จัดซื้อวัสดุสำนักงานโดยไม่ปฏิบัติตามระเบียบและอาจเอื้อประโยชน์แก่ผู้เสนอราคารายหนึ่ง</textarea><small>ระบุบุคคล การกระทำ วันเวลา สถานที่ และความเกี่ยวข้องกับผู้ร้องให้ชัดเจน</small></div><div class="ws-field ws-field-full"><label>สถานที่เกิดเหตุ</label><input id="wiPlace" value="สำนักงานจัดการทรัพย์สินภาครัฐ"></div><div class="ws-field"><label>จังหวัด</label><input id="wiProvince" list="wiProvinceOptions" autocomplete="off" placeholder="ระบุจังหวัด"><datalist id="wiProvinceOptions"></datalist></div><div class="ws-field"><label>อำเภอ/เขต</label><input id="wiDistrict" list="wiDistrictOptions" autocomplete="off" placeholder="ระบุอำเภอ/เขต"><datalist id="wiDistrictOptions"></datalist></div><div class="ws-field"><label>ตำบล/แขวง</label><input id="wiSubdistrict" list="wiSubdistrictOptions" autocomplete="off" placeholder="ระบุตำบล/แขวง"><datalist id="wiSubdistrictOptions"></datalist></div><div class="ws-field"><label>รหัสไปรษณีย์</label><input id="wiPostcode" readonly placeholder="รหัสไปรษณีย์"></div><div class="ws-field"><label>ความเสียหาย/ความเดือดร้อน</label><textarea id="wiDamage">เกิดความเสียหายต่องบประมาณของหน่วยงาน</textarea></div><div class="ws-field"><label>ความประสงค์ของผู้ร้อง</label><textarea id="wiRequest">ขอให้ตรวจสอบกระบวนการจัดซื้อและผู้เกี่ยวข้อง</textarea></div></div></div><div class="ws-section"><h3>เอกสารและเจ้าหน้าที่ผู้รับเรื่อง</h3><div class="ws-grid-2"><div class="ws-field"><label>เอกสารแนบ</label><input id="wiFiles" type="file" multiple></div><div class="ws-field"><label>เจ้าหน้าที่ผู้รับเรื่อง</label><select id="wiOfficer">${OFFICERS.map(x=>`<option>${x}</option>`).join('')}</select></div></div></div></div></section><aside class="ws-doc-pane"><div class="ws-doc-toolbar"><div class="ws-doc-tabs"><button class="ws-doc-tab active" data-wi-tab="complaint">แบบคำร้อง Walk-in</button><button class="ws-doc-tab" data-wi-tab="receipt">58/2-02 ใบติดตาม</button></div><span class="ws-status" id="wiDocStatus">ยังไม่ลงรับ</span></div><div class="ws-paper-stage" id="wiPreview"></div></aside></div></main><div class="ws-actions"><button class="ws-button secondary" id="wiDraft">บันทึกร่าง</button><button class="ws-button secondary" id="wiPrint">พิมพ์เอกสาร</button><button class="ws-button primary" id="wiReceive">ลงรับและออกเอกสารติดตาม</button></div>`;document.body.appendChild(shell);
    [['wiSubject','ผู้ช่วยอัจฉริยะสำหรับหัวข้อเรื่อง'],['wiDetail','ผู้ช่วยอัจฉริยะสำหรับรายละเอียดพฤติการณ์'],['wiDamage','ผู้ช่วยอัจฉริยะสำหรับความเสียหาย'],['wiRequest','ผู้ช่วยอัจฉริยะสำหรับความประสงค์ของผู้ร้อง']].forEach(([id,label])=>attachIntelligentSuggestion(id,label));
    let tab='complaint',receipt=null;const val=id=>$(id.startsWith('#')?id:'#'+id)?.value||'';
    const intakeChannels=['Walk-In','สายด่วน 1206','เบอร์โทร ปปท. เขต 1-9','Email','Website','ทางรัฐ','สปน. 1111','Traffy Fondue','ศปท. ป.ป.ท.','การข่าวภายใน ป.ป.ท.','ศนธ. / กนป.','เครือข่ายภาคประชาชน','ข้อสั่งการ','หนังสือจากหน่วยงานอื่น','จดหมาย','ม.62 (ป.ป.ช.)'];
    const channelSection=document.createElement('div');channelSection.className='ws-section';channelSection.innerHTML=`<h3>ช่องทางรับเรื่อง</h3><div class="ws-grid-2"><div class="ws-field"><label for="wiChannel">ช่องทางที่ได้รับเรื่องร้องเรียน</label><select id="wiChannel">${intakeChannels.map(channel=>`<option>${channel}</option>`).join('')}</select></div><div class="ws-field" id="wiIntakeRegionField"><label for="wiIntakeRegion">เขตที่รับเรื่อง</label><select id="wiIntakeRegion"><option value="">โปรดระบุเขตที่รับเรื่อง</option>${['ส่วนกลาง','เขต 1','เขต 2','เขต 3','เขต 4','เขต 5','เขต 6','เขต 7','เขต 8','เขต 9'].map(region=>`<option>${region}</option>`).join('')}</select></div></div>`;$('.ws-editor-body',shell).prepend(channelSection);$('.ws-kicker',shell).textContent='Activity 4 · ช่องทางรับเรื่อง';
    const toggleIntakeRegion=()=>{const visible=['Walk-In','จดหมาย'].includes($('#wiChannel',shell).value);$('#wiIntakeRegionField',shell).classList.toggle('ws-hidden',!visible);$('#wiIntakeRegion',shell).disabled=!visible;if(!visible)$('#wiIntakeRegion',shell).value=''};$('#wiChannel',shell).addEventListener('change',toggleIntakeRegion);toggleIntakeRegion();
    const anonymousField=document.createElement('div');anonymousField.className='ws-field ws-field-full';anonymousField.innerHTML='<label class="ws-choice"><input type="checkbox" id="wiAnonymous"><span><strong>ยื่นเป็นบัตรสนเท่ห์</strong><small>ปกปิดข้อมูลผู้ร้อง</small></span></label>';$('#wiEmail',shell).closest('.ws-field').after(anonymousField);
    const receiptTab=$('[data-wi-tab="receipt"]',shell);receiptTab.disabled=true;receiptTab.textContent='58/2-02 ใบแจ้งเลขติดตาม';
    const provinceInput=$('#wiProvince',shell);
    const districtInput=$('#wiDistrict',shell);
    const subdistrictInput=$('#wiSubdistrict',shell);
    const provinceOptions=$('#wiProvinceOptions',shell);
    const districtOptions=$('#wiDistrictOptions',shell);
    const subdistrictOptions=$('#wiSubdistrictOptions',shell);
    let staffLocations=[];
    function flattenStaffLocations(provinces){
      return provinces.flatMap(province => (province.districts || []).flatMap(district =>
        (district.sub_districts || []).map(subdistrict => ({
          subdistrict:subdistrict.name_th,
          district:district.name_th,
          province:province.name_th,
          postcode:String(subdistrict.zip_code || '')
        }))
      ));
    }
    function populateStaffLocationOptions(province='',district=''){
      const provinces=[...new Set(staffLocations.map(item=>item.province))].sort((a,b)=>a.localeCompare(b,'th'));
      provinceOptions.replaceChildren(...provinces.map(name=>{
        const option=document.createElement('option');option.value=name;return option;
      }));
      const uniqueDistricts=new Map();
      staffLocations.filter(item=>!province||item.province===province).forEach(item=>uniqueDistricts.set(`${item.province}|${item.district}`,item));
      districtOptions.replaceChildren(...[...uniqueDistricts.values()].sort((a,b)=>a.district.localeCompare(b.district,'th')).map(item=>{
        const option=document.createElement('option');
        option.value=province?item.district:`${item.district} — ${item.province}`;
        return option;
      }));
      const subdistricts=staffLocations.filter(item=>(!province||item.province===province)&&(!district||item.district===district));
      subdistrictOptions.replaceChildren(...subdistricts.sort((a,b)=>a.subdistrict.localeCompare(b.subdistrict,'th')).map(item => {
        const option=document.createElement('option');
        option.value=province&&district?item.subdistrict:`${item.subdistrict} — ${item.district} — ${item.province}`;
        return option;
      }));
    }
    function findStaffLocation(type,entered){
      const province=provinceInput.value.trim();
      const district=districtInput.value.trim();
      if(type==='district'){
        let match=staffLocations.find(item=>`${item.district} — ${item.province}`===entered);
        if(match)return match;
        const matches=staffLocations.filter(item=>item.district===entered&&(!province||item.province===province));
        return matches.length?matches[0]:null;
      }
      let match=staffLocations.find(item=>`${item.subdistrict} — ${item.district} — ${item.province}`===entered);
      if(!match){
        const matches=staffLocations.filter(item=>item.subdistrict===entered&&(!province||item.province===province)&&(!district||item.district===district));
        if(matches.length)match=matches[0];
      }
      return match;
    }
    function applyStaffProvince(){
      const province=provinceInput.value.trim();
      if(!staffLocations.some(item=>item.province===province))return;
      const current=staffLocations.find(item=>item.province===province&&item.district===districtInput.value&&item.subdistrict===subdistrictInput.value);
      if(!current){districtInput.value='';subdistrictInput.value='';$('#wiPostcode',shell).value=''}
      populateStaffLocationOptions(province,districtInput.value);
      render();
    }
    function applyStaffDistrict(){
      const match=findStaffLocation('district',districtInput.value.trim());
      if(!match){
        subdistrictInput.value='';
        $('#wiPostcode',shell).value='';
        render();
        return;
      }
      provinceInput.value=match.province;
      districtInput.value=match.district;
      subdistrictInput.value='';
      $('#wiPostcode',shell).value='';
      populateStaffLocationOptions(match.province,match.district);
      render();
    }
    function applyStaffSubdistrict(){
      const match=findStaffLocation('subdistrict',subdistrictInput.value.trim());
      if(!match){$('#wiPostcode',shell).value='';render();return}
      provinceInput.value=match.province;
      districtInput.value=match.district;
      subdistrictInput.value=match.subdistrict;
      $('#wiPostcode',shell).value=match.postcode;
      populateStaffLocationOptions(match.province,match.district);
      render();
    }
    provinceInput.addEventListener('change',applyStaffProvince);
    districtInput.addEventListener('change',applyStaffDistrict);
    subdistrictInput.addEventListener('change',applyStaffSubdistrict);
    fetch(THAI_LOCATION_URL)
      .then(response=>{if(!response.ok)throw new Error('location data unavailable');return response.json()})
      .then(data=>{staffLocations=flattenStaffLocations(data);populateStaffLocationOptions()})
      .catch(()=>{staffLocations=flattenStaffLocations(STAFF_LOCATION_FALLBACK);populateStaffLocationOptions()});
    const complaintPaper=()=>`<article class="a4-paper template-petition" id="activePaper">
      <header class="petition-header"><p>แบบแจ้งการร้องเรียน/เบาะแส</p><img src="${PACC_LOGO}" alt="ตราสำนักงาน ป.ป.ท."><div><strong>เขียนที่</strong> ........................................................<br><strong>วันที่</strong> ........ เดือน .................... พ.ศ. ........</div></header>
      <div class="doc-heading"><h2>แจ้งการร้องเรียน/เบาะแส<br>สำนักงาน ป.ป.ท.</h2></div>
      <div class="official-subject"><strong>เรียน</strong><span>เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</span></div>
      <section class="petition-section"><h3>ข้อมูลผู้ร้องเรียน</h3><p>${checkMark($('#wiAnonymous',shell).checked)} ยื่นเป็นบัตรสนเท่ห์และขอปกปิดข้อมูลผู้ร้อง</p><p><strong>ชื่อ-นามสกุล</strong> ${escapeHtml(val('wiComplainant'))} <strong>หมายเลขบัตรประชาชน</strong> ${escapeHtml(val('wiCitizen'))}</p><p><strong>หมายเลขโทรศัพท์ที่ติดต่อได้</strong> ${escapeHtml(val('wiPhone'))} <strong>EMAIL</strong> ${escapeHtml(val('wiEmail'))}</p><p><strong>สถานะเครือข่ายของสำนักงาน ป.ป.ท.</strong> ${checkMark(true)} เป็นเครือข่าย ป.ป.ท.</p></section>
      <section class="petition-section"><h3>ข้อมูลบุคคล/หน่วยงานที่ร้องเรียน</h3><p>${checkMark(true)} ร้องเรียนเจ้าหน้าที่ของรัฐ/หน่วยงาน</p><p><strong>ชื่อหรือหน่วยงานที่ร้องเรียน</strong> ${escapeHtml(val('wiAccused'))}</p><p><strong>ตำแหน่ง/สังกัด</strong> ${escapeHtml(val('wiPosition'))}</p><p><strong>ชื่อเรื่องร้องเรียน</strong> ${escapeHtml(val('wiSubject'))}</p><h3>รายละเอียดการร้องเรียน/แจ้งเบาะแส</h3><div class="petition-detail">${escapeHtml(val('wiDetail'))}</div></section>
      <section class="petition-section"><p><strong>วันเวลาเกิดเหตุ</strong> ไม่ระบุ</p><p><strong>สถานที่เกิดเหตุ</strong> ${escapeHtml(val('wiPlace'))} ตำบล/แขวง ${escapeHtml(val('wiSubdistrict'))} อำเภอ/เขต ${escapeHtml(val('wiDistrict'))} จังหวัด ${escapeHtml(val('wiProvince'))} ${escapeHtml(val('wiPostcode'))}</p><p><strong>ความเดือดร้อนเสียหายที่ได้รับ</strong> ${escapeHtml(val('wiDamage'))}</p><p><strong>มีความประสงค์ให้สำนักงาน ป.ป.ท. ดำเนินการ</strong> ${escapeHtml(val('wiRequest'))}</p><p><strong>ได้มอบเอกสารประกอบเรื่องร้องเรียน</strong> ${val('wiFiles')?'ตามรายการเอกสารที่แนบ':'ไม่มีเอกสารแนบ'}</p></section>
      <p class="petition-certification">ทั้งนี้ ผู้ร้องเรียนได้อ่านข้อความแล้วและเจ้าหน้าที่ได้อ่านให้ผู้ร้องเรียนฟังแล้ว ขอรับรองว่าถูกต้องตามที่ให้ถ้อยคำไว้ จึงลงลายมือชื่อไว้เป็นหลักฐาน</p>
      <div class="petition-signatures"><div><p>ลงชื่อ ........................................................</p><p>(${escapeHtml(val('wiComplainant'))})</p><p>ผู้ร้องเรียน</p></div><div><p>เจ้าหน้าที่ผู้รับเรื่อง ........................................................</p><p>${escapeHtml(val('wiOfficer'))}</p><p>ตำแหน่ง เจ้าหน้าที่รับเรื่องร้องเรียน</p></div></div>
      <p class="official-form-code">แบบ ปปท. 1-02</p>
    </article>`;
    const render=()=>{$('#wiPreview').innerHTML=tab==='receipt'&&receipt?receiptPaper(receipt,receipt.qr):complaintPaper()};$$('input,textarea,select',shell).forEach(x=>x.addEventListener('input',render));$$('[data-wi-tab]',shell).forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.wiTab;$$('[data-wi-tab]',shell).forEach(x=>x.classList.toggle('active',x===b));render()}));
    $('#wiDraft').onclick=()=>{localStorage.setItem('ecmis-walkin-draft',JSON.stringify({subject:val('wiSubject'),complainant:val('wiComplainant'),detail:val('wiDetail')}));notify('success','บันทึกร่างแล้ว','ข้อมูลยังไม่ถูกลงรับและยังไม่ออกเลขติดตาม')};$('#wiPrint').onclick=()=>window.print();$('#wiReceive').onclick=async()=>{if(!val('wiSubject')||!val('wiDetail'))return notify('warning','ข้อมูลไม่ครบ','กรอกชื่อเรื่องร้องเรียนและรายละเอียดพฤติการณ์ก่อนลงรับ');const ok=await confirmDo('ยืนยันการลงรับเรื่อง','เมื่อกดลงรับ ระบบจะออกเลขติดตามและ QR Code โปรดพิมพ์หรือบันทึกเอกสารเพื่อมอบให้ผู้ร้อง','ลงรับเรื่อง');if(!ok.isConfirmed)return;const pair=window.ECMIS?.createTrackingNumber?.()||{yearSequence:'690001',verificationCode:'5FT4'};const url=new URL(`tracking.html?yearSequence=${encodeURIComponent(pair.yearSequence)}&source=walkin`,location.href).href;let qr='';try{const q=qrcode(0,'M');q.addData(url);q.make();qr=q.createDataURL(5,8)}catch{}receipt={id:`ECMIS-2569-${pair.yearSequence.replace(/\D/g,'').slice(-4).padStart(6,'0')}`,trackingYear:pair.yearSequence,trackingCode:pair.verificationCode,received:now(),receivingOfficer:val('wiOfficer'),subject:val('wiSubject'),complainant:val('wiComplainant'),agency:val('wiAccused'),channel:'Walk-in',province:val('wiProvince'),region:'ส่วนกลาง',place:val('wiPlace'),detail:val('wiDetail'),damage:val('wiDamage'),request:val('wiRequest'),attachments:[],qr};const state=initialState(receipt);saveState(receipt.id,state);$('#wiDocStatus').textContent='ลงรับแล้ว';$('#wiDocStatus').classList.add('success');receiptTab.disabled=false;tab='receipt';$$('[data-wi-tab]',shell).forEach(x=>x.classList.toggle('active',x.dataset.wiTab==='receipt'));render();notify('success','ลงรับเรื่องเรียบร้อยแล้ว',`เลขรับบริการ ${pair.yearSequence} / รหัสติดตาม ${pair.verificationCode} โปรดพิมพ์ใบแจ้งเลขติดตามและมอบให้ผู้ร้อง`) };render();
    const receiveComplaint=$('#wiReceive').onclick;
    $('#wiReceive').onclick=async()=>{
      await receiveComplaint();
      if(!receipt)return;
      const requiresTrackingDocument=['Walk-In','จดหมาย'].includes(val('wiChannel'));
      receiptTab.disabled=!requiresTrackingDocument;
      if(requiresTrackingDocument){receipt.region=val('wiIntakeRegion')||'ส่วนกลาง';render()}
      if(!requiresTrackingDocument){
        tab='complaint';
        $$('[data-wi-tab]',shell).forEach(item=>item.classList.toggle('active',item.dataset.wiTab==='complaint'));
        render();
      }
    };
  }
  function renderStaff(){
    const root=$('#staffApp');if(!root)return;const params=new URLSearchParams(location.search);let activeRole=params.get('role')||sessionStorage.getItem('ecmis-a4-role')||'admin';let selectedId=params.get('case')||null;let filters={};
    root.innerHTML=`${header(true)}<main class="ws-container"><section id="caseListView"><div class="ws-page-head"><div><p class="ws-kicker">Activity 4 · งานรับเรื่องร้องเรียน</p><h1>รายการเรื่องร้องเรียน</h1><p>ค้นหาจากทุกช่องทางและพื้นที่เกิดเหตุ ก่อนเปิดโต๊ะทำสำนวน</p></div><a class="ws-button primary" href="complaint-form.html?mode=walkin">เพิ่มเรื่อง Walk-in</a></div><section class="ws-dashboard" aria-label="ภาพรวมเรื่องร้องเรียน"><article class="ws-dashboard-card overview"><span>ภาพรวมทั้งหมด</span><strong id="dashboardTotal">0</strong><p>เรื่องทั้งหมด</p><small>รวมทุกช่องทางรับเรื่อง</small></article><article class="ws-dashboard-card pending"><span>รอดำเนินการ</span><strong id="dashboardPending">0</strong><p>รอลงรับและมอบหมาย</p><small>อยู่ในความรับผิดชอบของธุรการ</small></article><article class="ws-dashboard-card reviewing"><span>กำลังพิจารณา</span><strong id="dashboardReview">0</strong><p>อยู่ระหว่างพิจารณา</p><small>เจ้าหน้าที่หรือผู้มีอำนาจกำลังดำเนินการ</small></article><article class="ws-dashboard-card completed"><span>ผลดำเนินการ</span><strong id="dashboardDone">0</strong><p>ดำเนินการเสร็จสิ้น</p><small>มีผลการพิจารณาเรียบร้อยแล้ว</small></article></section><section class="ws-card ws-filters"><div class="ws-filter-grid"><div class="ws-field"><label>คำค้น</label><input id="filterSearch" placeholder="เลขเรื่อง ผู้ร้อง ชื่อเรื่อง หรือหน่วยงาน"></div><div class="ws-field"><label>ช่องทาง</label><select id="filterChannel"><option value="">ทุกช่องทาง</option>${['Website','Walk-in','สายด่วน 1206','หนังสือราชการ'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="ws-field"><label>เขตพื้นที่</label><select id="filterRegion"><option value="">ทุกเขต</option>${['ส่วนกลาง','เขต 1','เขต 2','เขต 3','เขต 4','เขต 5','เขต 6','เขต 7','เขต 8','เขต 9'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="ws-field"><label>จังหวัดเกิดเหตุ</label><select id="filterProvince"><option value="">ทุกจังหวัด</option>${['กรุงเทพมหานคร','ชลบุรี','นครราชสีมา','ขอนแก่น'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="ws-field"><label>ประเภทเรื่อง</label><select id="filterType"><option value="">ทุกประเภท</option>${['การจัดซื้อจัดจ้าง','ใช้อำนาจโดยมิชอบ','เบิกจ่ายงบประมาณ','เรียกรับผลประโยชน์'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="ws-field"><label>สถานะ</label><select id="filterStatus"><option value="">ทุกสถานะ</option><option>รอลงรับและมอบหมาย</option><option>รอเจ้าหน้าที่พิจารณา</option><option>รอ ผอ.ศรร.</option><option>รอ ผอ.กบค.</option><option>ดำเนินการเสร็จสิ้น</option></select></div><div class="ws-field"><label>ความเสี่ยงเรื่องซ้ำ</label><select id="filterDuplicate"><option value="">ทั้งหมด</option><option value="high">ควรตรวจสอบ</option><option value="low">ยังไม่พบสัญญาณ</option></select></div><div class="ws-field"><label>วันที่ลงรับ</label><input id="filterDate" type="date"></div></div></section><section class="ws-card"><div class="ws-table-wrap"><table class="ws-table"><thead><tr><th>เลขรับบริการ/วันที่</th><th>ผู้ร้องเรียน</th><th>ชื่อเรื่อง/หน่วยงาน</th><th>สถานที่เกิดเหตุ</th><th>ช่องทาง</th><th>สถานะ</th><th>เรื่องซ้ำ</th></tr></thead><tbody id="caseRows"></tbody></table></div></section></section><section id="caseDetailView" class="ws-hidden"></section></main>`;
    root.querySelector('a[href="complaint-form.html?mode=walkin"]')?.setAttribute('href','staff-intake.html');
    const roleSelect=$('#wsRole');
    if(roleSelect&&!roleSelect.querySelector('option[value="anonymous"]'))roleSelect.insertAdjacentHTML('beforeend','<option value="anonymous">กล่องบัตรสนเท่ห์</option>');
    const pagePrimary=root.querySelector('.ws-page-head .ws-button.primary');
    pagePrimary?.insertAdjacentHTML('beforebegin','<a class="ws-button secondary" href="staff-workflow.html?role=anonymous&box=anonymous">กล่องบัตรสนเท่ห์</a>');
    const updateAdminTools=()=>$$('.ws-admin-tool').forEach(button=>button.classList.toggle('ws-hidden',activeRole!=='admin'));
    $('#wsRole').value=activeRole;updateAdminTools();$('#wsRole').onchange=e=>{activeRole=e.target.value;sessionStorage.setItem('ecmis-a4-role',activeRole);updateAdminTools();delete $('#caseListView').dataset.anonymousReady;if(selectedId)renderDetail();renderList()};
    const duplicateObserver=new MutationObserver(()=>{
      enhanceNaccDispatch();
      enhanceNaccTransferReasons();
      enhanceSmartInputs();
      enhanceReviewRoute();
      enhanceActingIdentity();
      enhanceCaseIssuance();
      enhanceAnonymousSuboption();
      enhanceAnonymousList();
      enhanceAnonymousBox();
      const check=$('#dupCheck');
      if(!check||check.dataset.autoChecked||activeRole!=='admin'||!selectedId?.endsWith('184'))return;
      check.dataset.autoChecked='true';
      const warningKey=`ecmis-duplicate-warning-${selectedId}`;
      check.dataset.silent=sessionStorage.getItem(warningKey)==='shown'?'true':'false';
      sessionStorage.setItem(warningKey,'shown');
      setTimeout(()=>check.click(),0);
    });
    duplicateObserver.observe(root,{childList:true,subtree:true});
    ['Search','Channel','Region','Province','Type','Status','Duplicate','Date'].forEach(x=>{$(`#filter${x}`).addEventListener(x==='Search'?'input':'change',renderList)});
    function allCases(){const stored=readStore();const ids=new Set(CASES.map(c=>c.id));const extra=Object.values(stored).map(s=>s.caseData).filter(c=>!ids.has(c.id));return [...CASES,...extra]}
    function enhanceReviewRoute(){
      const planner=$('.route-planner');
      if(activeRole!=='officer'||!selectedId||!planner||planner.dataset.routeRestored)return;
      const d=getState(selectedId).documentData;
      const route=d.reviewRoute||'center';
      const panel=$('#absenceBox');
      const impact=$('.route-impact',planner);
      if(panel&&impact&&!$('#actingOfficer',panel))impact.insertAdjacentHTML('beforebegin',`<div class="ws-grid-2" style="margin-top:.7rem"><div class="ws-field"><label>ผู้พิจารณาแทน *</label><select id="actingOfficer"><option value="">เลือกผู้พิจารณาแทน</option><option value="ผอ.กบค." ${d.actingOfficer==='ผอ.กบค.'?'selected':''}>ผอ.กบค. — เสนอข้ามขั้นตอน</option><option value="ผอ.กลุ่มมติ" ${d.actingOfficer==='ผอ.กลุ่มมติ'?'selected':''}>ผอ.กลุ่มมติ — ผู้รักษาราชการแทน</option><option value="ผู้รักษาราชการแทนตามคำสั่ง" ${d.actingOfficer==='ผู้รักษาราชการแทนตามคำสั่ง'?'selected':''}>ผู้รักษาราชการแทนอื่นตามคำสั่ง</option></select></div><div class="ws-field"><label>เลขที่คำสั่งและวันที่ *</label><input id="actingOrder" value="${escapeHtml(d.actingOrder||'')}" placeholder="เช่น คำสั่งที่ 123/2569 ลงวันที่ 4 สิงหาคม 2569"></div></div>`);
      const exceptional=$('.route-option.exceptional',planner);
      if(exceptional){$('strong',exceptional).textContent='กำหนดผู้พิจารณาแทนเป็นกรณีพิเศษ';$('small',exceptional).textContent='ใช้เมื่อผู้มีอำนาจไม่สามารถปฏิบัติหน้าที่ โดยต้องระบุเหตุผลและคำสั่งอ้างอิง'}
      if(impact)$('span',impact).textContent='ระบบส่งเรื่องไปยังผู้พิจารณาแทนที่เลือก พร้อมเก็บเหตุผล ผู้รักษาการ และคำสั่งอ้างอิงใน Log';
      const input=$(`input[name="route"][value="${route}"]`,planner);
      if(input)input.checked=true;
      panel?.classList.toggle('ws-hidden',route!=='division');
      planner.dataset.routeRestored='true';
    }
    function enhanceActingIdentity(){
      if(activeRole!=='acting'||!selectedId)return;
      const order=$('#actingOrder');
      if(!order||order.dataset.identityReady)return;
      const d=getState(selectedId).documentData;
      order.value=d.actingOrder||order.value;
      order.placeholder='เลขที่คำสั่งและวันที่';
      order.closest('.ws-field')?.insertAdjacentHTML('beforebegin',`<div class="ws-callout"><strong>ผู้รักษาราชการแทน: ${escapeHtml(d.actingOfficer||'ยังไม่ระบุ')}</strong><br>เหตุที่ผู้มีอำนาจไม่อยู่: ${escapeHtml(d.absenceReasonType||'ยังไม่ระบุ')} ${escapeHtml(d.absenceNote||'')}</div>`);
      order.dataset.identityReady='true';
    }
    function enhanceCaseIssuance(){
      if(!['division','acting'].includes(activeRole)||!selectedId)return;
      const state=getState(selectedId),d=state.documentData;
      if(!['18/1ก','18/1ข','18/4'].includes(d.decision)||$('#caseIssuanceStatus'))return;
      const anchor=$('#internalLetterNo')?.closest('.ws-section')||$('.ws-editor-body');
      anchor?.insertAdjacentHTML('afterend',`<section class="case-issuance" id="caseIssuanceStatus"><span>การออกเลขสำนวน</span><strong>${escapeHtml(d.caseNumber||'ยังไม่ออกเลขสำนวน')}</strong><p>${d.caseNumber?escapeHtml(d.publicStatus):'ระบบจะออกเลขสำนวนหลัง ผอ.กบค. หรือผู้รักษาราชการแทนลงนามอนุมัติเท่านั้น'}</p></section>`);
    }
    function enhanceAnonymousSuboption(){
      if(activeRole!=='officer'||!selectedId)return;
      const checkbox=$('#anonymous');
      if(!checkbox||checkbox.dataset.suboptionReady)return;
      const choice=checkbox.closest('.ws-choice');
      const description=$('small',choice);
      if(description)description.textContent='ใช้เฉพาะเมื่อเลือกผล “ไม่รับไว้ดำเนินการ” เพื่อส่งเข้ากล่องบัตรสนเท่ห์';
      $$('input[name="decision"]').forEach(input=>input.addEventListener('change',()=>{if(input.checked&&input.value!=='not-accept')checkbox.checked=false}));
      checkbox.dataset.suboptionReady='true';
    }
    function enhanceAnonymousList(){
      const list=$('#caseListView');
      if(activeRole!=='anonymous'||selectedId||!list||list.dataset.anonymousReady)return;
      list.dataset.anonymousReady='true';
      $('.ws-page-head h1',list).textContent='กล่องบัตรสนเท่ห์';
      $('.ws-page-head p:not(.ws-kicker)',list).textContent='เรื่องไม่รับไว้ดำเนินการที่เป็นบัตรสนเท่ห์ และสถานะการส่งต่อกิจกรรมที่ 7';
      $$('[data-case]',list).forEach(row=>{
        const state=getState(row.dataset.case);
        row.classList.toggle('ws-hidden',!['anonymous-box','activity7'].includes(state.workflow.stage));
      });
    }
    function enhanceAnonymousBox(){
      if(activeRole!=='anonymous'||!selectedId)return;
      const body=$('.ws-editor-body'),actions=$('.ws-actions');
      if(!body||!actions||body.dataset.anonymousBox)return;
      body.dataset.anonymousBox='true';
      const state=getState(selectedId),d=state.documentData,history=state.anonymousHistory||[];
      if(d.decision!=='not-accept'||!d.anonymous){
        body.innerHTML='<div class="ws-section"><div class="ws-callout">เรื่องนี้ไม่อยู่ในเงื่อนไขกล่องบัตรสนเท่ห์</div></div>';
        actions.innerHTML='<button class="ws-button ghost" id="anonymousBack">กลับรายการ</button>';
        $('#anonymousBack').onclick=()=>$('#backList').click();
        return;
      }
      const step=Math.min(history.length,ANONYMOUS_CHAIN_STEPS.length-1);
      const completed=state.workflow.stage==='activity7';
      body.innerHTML=`<section class="anonymous-box-hero"><span>กล่องบัตรสนเท่ห์</span><h3>${completed?'ส่งต่อกิจกรรมที่ 7 แล้ว':escapeHtml(ANONYMOUS_CHAIN_STEPS[step])}</h3><p>เหตุผลไม่รับไว้ดำเนินการ: ${escapeHtml(d.notAcceptReason||'ไม่ระบุ')}</p></section><ol class="anonymous-chain">${ANONYMOUS_CHAIN_STEPS.map((label,index)=>`<li class="${completed||index<history.length?'done':index===step?'active':''}"><b>${index+1}</b><span><strong>${escapeHtml(label)}</strong><small>${history[index]?`${escapeHtml(history[index].name)} · ${escapeHtml(history[index].position)}`:index===step&&!completed?'รอดำเนินการ':'รอตามลำดับ'}</small></span></li>`).join('')}<li class="${completed?'done':''}"><b>4</b><span><strong>กิจกรรมที่ 7</strong><small>${completed?'รับข้อมูลจากกิจกรรมที่ 4 แล้ว':'รอผลพิจารณาครบตามลำดับ'}</small></span></li></ol>${completed?'':`<div class="ws-section"><h3>บันทึกความเห็นตามลำดับชั้น</h3><div class="ws-grid-2"><div class="ws-field"><label>ชื่อผู้พิจารณา *</label><input id="anonymousHeadName" placeholder="ระบุชื่อผู้พิจารณา"></div><div class="ws-field"><label>ตำแหน่ง *</label><input id="anonymousHeadPosition" value="${escapeHtml(ANONYMOUS_CHAIN_STEPS[step])}"></div><div class="ws-field ws-field-full"><label>ความเห็นหรือคำสั่ง *</label><textarea id="anonymousHeadOpinion" placeholder="บันทึกความเห็นก่อนส่งตามลำดับชั้น"></textarea></div></div></div>`}<div class="ws-section"><h3>ประวัติการพิจารณา</h3><ul class="ws-history">${history.length?history.map(entry=>`<li>${escapeHtml(entry.position)} · ${escapeHtml(entry.name)}: ${escapeHtml(entry.opinion)}<time>${entry.time}</time></li>`).join(''):'<li>ยังไม่มีประวัติการพิจารณา</li>'}</ul></div>`;
      actions.innerHTML=completed?'<button class="ws-button ghost" id="anonymousBack">กลับกล่องบัตรสนเท่ห์</button>':`<button class="ws-button ghost" id="anonymousBack">กลับกล่องบัตรสนเท่ห์</button><button class="ws-button primary" id="anonymousAdvance">${step===ANONYMOUS_CHAIN_STEPS.length-1?'อนุมัติและส่งกิจกรรมที่ 7':'รับรองและส่งลำดับถัดไป'}</button>`;
      $('#anonymousBack').onclick=()=>$('#backList').click();
      if($('#anonymousAdvance'))$('#anonymousAdvance').onclick=()=>advanceAnonymousFlow();
    }
    async function advanceAnonymousFlow(){
      const state=getState(selectedId),history=state.anonymousHistory||[],step=history.length;
      const name=$('#anonymousHeadName')?.value.trim()||'',position=$('#anonymousHeadPosition')?.value.trim()||'',opinion=$('#anonymousHeadOpinion')?.value.trim()||'';
      if(!name||!position||!opinion)return notify('warning','ข้อมูลการพิจารณายังไม่ครบ','กรอกชื่อ ตำแหน่ง และความเห็นก่อนส่งตามลำดับชั้น');
      const isFinal=step===ANONYMOUS_CHAIN_STEPS.length-1;
      const confirmed=await confirmDo(isFinal?'ยืนยันส่งกิจกรรมที่ 7':'ยืนยันส่งตามลำดับชั้น',isFinal?'ระบบจะสร้างข้อมูลส่งต่อกิจกรรมที่ 7':'ระบบจะส่งให้หัวหน้าพนักงานลำดับถัดไป',isFinal?'อนุมัติและส่งต่อ':'รับรองและส่งต่อ');
      if(!confirmed.isConfirmed)return;
      const entry={name,position,opinion,time:now()};
      history.push(entry);state.anonymousHistory=history;
      state.decisionHistory.push({text:`${position} ${name} บันทึกความเห็นบัตรสนเท่ห์: ${opinion}`,time:entry.time});
      if(isFinal){
        let queue={schemaVersion:1,records:{}};try{const parsed=JSON.parse(localStorage.getItem(ACTIVITY7_STORAGE_KEY)||'{}');if(parsed.schemaVersion===1&&parsed.records)queue=parsed}catch{}
        queue.records[state.caseData.id]={handoffId:`activity4:${state.caseData.id}:activity7`,sourceReference:state.caseData.id,title:state.caseData.subject,decision:state.documentData.decision,anonymous:true,notAcceptReason:state.documentData.notAcceptReason,chain:history,transferredAt:new Date().toISOString(),sourceSystem:'Activity4HTMLPrototype'};
        localStorage.setItem(ACTIVITY7_STORAGE_KEY,JSON.stringify(queue));
        state.workflow={owner:'activity7',stage:'activity7',status:'ส่งต่อกิจกรรมที่ 7 แล้ว',complete:true};
        state.decisionHistory.push({text:'ส่งข้อมูลบัตรสนเท่ห์จากกิจกรรมที่ 4 ไปยังกิจกรรมที่ 7 แล้ว',time:now()});
      }else{
        state.workflow.owner='anonymous';state.workflow.stage='anonymous-box';state.workflow.status=`รอ ${ANONYMOUS_CHAIN_STEPS[step+1]}`;
      }
      saveState(selectedId,state);notify('success',isFinal?'ส่งกิจกรรมที่ 7 แล้ว':'ส่งตามลำดับชั้นแล้ว',`สถานะปัจจุบัน: ${state.workflow.status}`);renderDetail();renderList();
    }
    function enhanceNaccDispatch(){
      if(activeRole!=='officer'||!selectedId)return;
      const state=getState(selectedId),d=state.documentData;
      if(state.workflow.stage!=='nacc-dispatch')return;
      const body=$('.ws-editor-body');if(!body||body.dataset.naccDispatch)return;
      body.dataset.naccDispatch='true';
      body.innerHTML=`<section class="nacc-dispatch-hero"><p>ขั้นตอนสุดท้าย · ส่งต่อสำนักงาน ป.ป.ช.</p><h2>บันทึกการจัดส่งและแจ้งผลผู้ร้อง</h2><span>ผอ.กบค. อนุมัติแล้ว เจ้าหน้าที่รับเรื่องเป็นผู้บันทึกหลักฐานการส่ง</span></section><section class="ws-section"><h3>ข้อมูลหนังสือนำส่ง</h3><div class="ws-grid-2"><div class="ws-field"><label>เลขหนังสือส่ง ป.ป.ช. *</label><input id="naccLetterNo" value="${escapeHtml(d.naccLetterNo||'')}" placeholder="เช่น ปป 0012/2569"></div><div class="ws-field"><label>วันที่ออกหนังสือ *</label><input id="naccLetterDate" type="date" value="${escapeHtml(d.naccLetterDate||'')}"></div><div class="ws-field"><label>วิธีจัดส่ง *</label><select id="naccSendMethod"><option ${d.naccSendMethod==='EMS'?'selected':''}>EMS</option><option ${d.naccSendMethod==='ระบบสารบรรณอิเล็กทรอนิกส์'?'selected':''}>ระบบสารบรรณอิเล็กทรอนิกส์</option><option ${d.naccSendMethod==='เจ้าหน้าที่นำส่ง'?'selected':''}>เจ้าหน้าที่นำส่ง</option></select></div><div class="ws-field"><label>วันที่จัดส่ง *</label><input id="naccSentDate" type="date" value="${escapeHtml(d.naccSentDate||'')}"></div><div class="ws-field"><label>เลข EMS / เลขติดตามการส่ง</label><input id="naccEms" value="${escapeHtml(d.naccEms||'')}" placeholder="เช่น ED123456789TH"></div><div class="ws-field"><label>หลักฐานการจัดส่ง</label><input id="naccProof" type="file" accept=".pdf,.jpg,.jpeg,.png"><small>${escapeHtml(d.naccProofName||'ยังไม่ได้แนบไฟล์')}</small></div></div></section><section class="ws-section"><h3>ข้อมูลมติบอร์ด</h3><div class="ws-grid-2"><div class="ws-field"><label>เลขที่มติ/ครั้งที่ประชุม *</label><input id="naccBoardNo" value="${escapeHtml(d.naccBoardNo||'')}" placeholder="เช่น มติครั้งที่ 18/2569"></div><div class="ws-field"><label>วันที่มีมติ *</label><input id="naccBoardDate" type="date" value="${escapeHtml(d.naccBoardDate||'')}"></div><div class="ws-field ws-field-full"><label>ข้อความแจ้งมติบอร์ดแก่ผู้ร้อง</label><textarea id="naccBoardNote">${escapeHtml(d.naccBoardNote||'สำนักงานได้ส่งเรื่องของท่านไปยังสำนักงาน ป.ป.ช. เพื่อดำเนินการตามอำนาจหน้าที่แล้ว')}</textarea></div></div><label class="ws-choice nacc-notify-choice"><input type="checkbox" id="naccNotifyComplainant" ${d.naccNotified===false?'':'checked'}><span><strong>แจ้งผู้ร้องหลังยืนยันการจัดส่ง</strong><small>ผู้ร้องจะเห็นเลขหนังสือ วันที่ส่ง และเลข EMS ในหน้าติดตาม</small></span></label></section><section class="public-result-preview"><span>ข้อมูลที่ผู้ร้องจะเห็น</span><div><p><small>สถานะ</small><strong>ส่งสำนักงาน ป.ป.ช. แล้ว</strong></p><p><small>เลขหนังสือ</small><strong>${escapeHtml(d.naccLetterNo||'รอบันทึก')}</strong></p><p><small>เลข EMS</small><strong>${escapeHtml(d.naccEms||'รอบันทึก')}</strong></p></div></section><section class="ws-section"><h3>ประวัติการดำเนินการ</h3><ul class="ws-history">${state.decisionHistory.length?state.decisionHistory.map(entry=>`<li>${escapeHtml(entry.text)}<time>${entry.time}</time></li>`).join(''):'<li>ยังไม่มีประวัติ</li>'}</ul></section>`;
      const refreshDispatchPreview=()=>{const working=captureNaccDispatch(getState(selectedId));const previewValues=$$('.public-result-preview strong');if(previewValues[1])previewValues[1].textContent=working.documentData.naccLetterNo||'รอบันทึก';if(previewValues[2])previewValues[2].textContent=working.documentData.naccEms||'รอบันทึก';if($('#paperStage'))$('#paperStage').innerHTML=documentPaper(working,'1-11',activeRole)};
      $$('input,select,textarea',body).forEach(field=>field.addEventListener('input',refreshDispatchPreview));
      if(state.workflow.complete)$$('input,select,textarea',body).forEach(field=>field.disabled=true);
      const actions=$('.ws-actions');if(actions)actions.innerHTML=state.workflow.complete?'<button class="ws-button secondary" data-action="print">พิมพ์หนังสือ ปปท. 1-11</button>':'<button class="ws-button ghost" data-action="reset">เริ่มข้อมูลเรื่องนี้ใหม่</button><button class="ws-button secondary" data-action="nacc-draft">บันทึกร่างการจัดส่ง</button><button class="ws-button secondary" data-action="print">พิมพ์หนังสือ ปปท. 1-11</button><button class="ws-button primary" data-action="nacc-dispatch-confirm">ยืนยันส่งและแจ้งผู้ร้อง</button>';
      const naccTab=$('[data-doc="1-11"]');if(naccTab){$$('[data-doc]').forEach(tab=>tab.classList.toggle('active',tab===naccTab));$('#paperStage').innerHTML=documentPaper(state,'1-11',activeRole)}
      attachIntelligentSuggestion('naccBoardNote','ผู้ช่วยอัจฉริยะสำหรับข้อความแจ้งมติบอร์ด');
    }
    function enhanceNaccTransferReasons(){
      const box=$('#naccReasonBox'),grid=$('.ws-choice-grid',box);if(!box||!grid||grid.dataset.exactNaccReasons)return;
      const state=getState(selectedId);grid.dataset.exactNaccReasons='true';
      grid.innerHTML=NACC_TRANSFER_REASONS.map(reason=>`<label class="ws-choice"><input type="checkbox" name="naccReason" value="${escapeHtml(reason)}" ${state.documentData.reasons.includes(reason)?'checked':''}><span><strong>${escapeHtml(reason)}</strong></span></label>`).join('');
      grid.addEventListener('change',()=>{const working=capture(getState(selectedId));if($('#paperStage'))$('#paperStage').innerHTML=documentPaper(working,$('[data-doc].active')?.dataset.doc||'form3',activeRole)});
    }
    async function manageBackupOfficers(){
      if(activeRole!=='admin')return;
      const settings=readBackupSettings();
      const optionHtml=OFFICERS.map(name=>`<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
      const currentHtml=OFFICERS.map(name=>`<li><strong>${escapeHtml(name)}</strong><span>${escapeHtml(settings.assignments[name]||'ไม่ได้กำหนด')}</span></li>`).join('');
      if(!window.Swal){
        notify('info','จัดการผู้ปฏิบัติงานแทน','กรุณาเปิดใช้งานหน้าต่างจัดการในเบราว์เซอร์ที่รองรับ');
        return;
      }
      const result=await Swal.fire({
        title:'จัดการผู้ปฏิบัติงานแทน',
        html:`<div class="backup-manager"><label>เจ้าหน้าที่หลัก<select id="backupPrimary"><option value="">เลือกเจ้าหน้าที่</option>${optionHtml}</select></label><label>ผู้ปฏิบัติงานแทน<select id="backupSubstitute"><option value="">ไม่กำหนด</option>${optionHtml}</select></label><h3>รายการที่กำหนดไว้</h3><ul>${currentHtml}</ul></div>`,
        width:720,
        showCancelButton:true,
        confirmButtonText:'บันทึก',
        cancelButtonText:'ยกเลิก',
        confirmButtonColor:'#082b50',
        preConfirm:()=>{
          const primary=$('#backupPrimary')?.value||'';
          const substitute=$('#backupSubstitute')?.value||'';
          if(!primary){window.Swal.showValidationMessage('เลือกเจ้าหน้าที่หลัก');return false}
          if(primary===substitute){window.Swal.showValidationMessage('เจ้าหน้าที่หลักและผู้ปฏิบัติงานแทนต้องเป็นคนละคน');return false}
          return {primary,substitute};
        }
      });
      if(!result.isConfirmed)return;
      const {primary,substitute}=result.value;
      const previous=settings.assignments[primary]||'';
      if(substitute)settings.assignments[primary]=substitute;else delete settings.assignments[primary];
      settings.history.push({primary,previousBackup:previous,newBackup:substitute,actor:'ธุรการ ศรร.',time:now()});
      writeBackupSettings(settings);
      notify('success','บันทึกผู้ปฏิบัติงานแทนแล้ว',`${primary}: ${substitute||'ไม่ได้กำหนด'}`);
    }
    async function manageSuggestions(){
      if(activeRole!=='admin'||!window.Swal)return;
      const settings=readSuggestionSettings();
      const listHtml=(items,type)=>items.map((text,index)=>`<li><span>${escapeHtml(text)}</span><button type="button" data-remove-suggestion="${type}:${index}">ลบ</button></li>`).join('');
      const result=await Swal.fire({
        title:'จัดการคำแนะนำและเหตุผล',
        html:`<div class="suggestion-manager"><section><h3>คำแนะนำที่ใช้บ่อย</h3><div class="suggestion-add"><input id="newKeyword" placeholder="เพิ่มข้อความแนะนำ"><button type="button" id="addKeyword">เพิ่ม</button></div><ul id="keywordManagerList">${listHtml(settings.keywords,'keyword')}</ul></section><section><h3>เหตุผลไม่รับไว้ดำเนินการ</h3><div class="suggestion-add"><input id="newReason" placeholder="เพิ่มเหตุผล"><button type="button" id="addReason">เพิ่ม</button></div><ul id="reasonManagerList">${listHtml(settings.notAcceptReasons,'reason')}</ul></section></div>`,
        width:820,
        showCancelButton:true,
        confirmButtonText:'บันทึกรายการ',
        cancelButtonText:'ยกเลิก',
        confirmButtonColor:'#082b50',
        didOpen:()=>{
          const render=()=>{
            $('#keywordManagerList').innerHTML=listHtml(settings.keywords,'keyword');
            $('#reasonManagerList').innerHTML=listHtml(settings.notAcceptReasons,'reason');
          };
          $('#addKeyword').onclick=()=>{const value=$('#newKeyword').value.trim();if(value&&!settings.keywords.includes(value)){settings.keywords.push(value);$('#newKeyword').value='';render()}};
          $('#addReason').onclick=()=>{const value=$('#newReason').value.trim();if(value&&!settings.notAcceptReasons.includes(value)){settings.notAcceptReasons.push(value);$('#newReason').value='';render()}};
          $('.suggestion-manager').onclick=event=>{
            const button=event.target.closest('[data-remove-suggestion]');if(!button)return;
            const [type,index]=button.dataset.removeSuggestion.split(':');
            if(type==='keyword')settings.keywords.splice(Number(index),1);else settings.notAcceptReasons.splice(Number(index),1);
            render();
          };
        }
      });
      if(!result.isConfirmed)return;
      writeSuggestionSettings(settings);
      notify('success','บันทึกรายการแล้ว','คำแนะนำและเหตุผลถูกอัปเดตสำหรับธุรการและเจ้าหน้าที่รับเรื่อง');
      if(selectedId)renderDetail();
    }
    function enhanceSmartInputs(){
      const settings=readSuggestionSettings();
      [
        ['adminNote','ผู้ช่วยอัจฉริยะสำหรับหมายเหตุธุรการ'],
        ['officerOpinion','ผู้ช่วยอัจฉริยะสำหรับความเห็นเจ้าหน้าที่'],
        ['absenceNote','ผู้ช่วยอัจฉริยะสำหรับเหตุผลการลาและผู้รักษาการ'],
        ['centerOpinion','ผู้ช่วยอัจฉริยะสำหรับความเห็น ผอ.ศรร.'],
        ['centerAdditionalDetail','ผู้ช่วยอัจฉริยะสำหรับรายละเอียดเพิ่มเติม ผอ.ศรร.'],
        ['divisionOpinion','ผู้ช่วยอัจฉริยะสำหรับคำสั่ง ผอ.กบค.'],
        ['divisionAdditionalDetail','ผู้ช่วยอัจฉริยะสำหรับรายละเอียดเพิ่มเติม ผอ.กบค.'],
        ['actingOrder','ผู้ช่วยอัจฉริยะสำหรับคำสั่งรักษาราชการแทน']
      ].forEach(([id,label])=>attachIntelligentSuggestion(id,label));
      const reasonInput=$('#notAcceptReason');
      if(reasonInput&&!reasonInput.parentElement.querySelector('.not-accept-multi')){
        const selected=new Set(reasonInput.value.split('\n').map(value=>value.trim()).filter(Boolean));
        const fieldLabel=reasonInput.parentElement.querySelector('label');
        const panel=document.createElement('div');panel.className='not-accept-multi';panel.innerHTML=`<div class="smart-suggestion-head"><strong>เหตุผลไม่รับไว้ดำเนินการ</strong><span>เลือกได้มากกว่าหนึ่งข้อ</span></div><div class="reason-option-grid">${settings.notAcceptReasons.map(reason=>`<label><input type="checkbox" value="${escapeHtml(reason)}" ${selected.has(reason)?'checked':''}><span>${escapeHtml(reason)}</span></label>`).join('')}</div>`;
        reasonInput.parentElement.insertBefore(panel,reasonInput);
        fieldLabel?.classList.add('ws-hidden');
        reasonInput.classList.add('ws-hidden');
        panel.addEventListener('change',()=>{
          reasonInput.value=$$('input:checked',panel).map(input=>input.value).join('\n');
          reasonInput.dispatchEvent(new Event('input',{bubbles:true}));
        });
      }
    }
    function captureNaccDispatch(state){
      const d=state.documentData,value=id=>$(`#${id}`)?.value?.trim()||'';
      d.naccLetterNo=value('naccLetterNo')||d.naccLetterNo;
      d.naccLetterDate=value('naccLetterDate')||d.naccLetterDate;
      d.naccSendMethod=value('naccSendMethod')||d.naccSendMethod||'EMS';
      d.naccEms=value('naccEms')||d.naccEms;
      d.naccSentDate=value('naccSentDate')||d.naccSentDate;
      d.naccBoardNo=value('naccBoardNo')||d.naccBoardNo;
      d.naccBoardDate=value('naccBoardDate')||d.naccBoardDate;
      d.naccBoardNote=value('naccBoardNote')||d.naccBoardNote;
      d.naccProofName=$('#naccProof')?.files?.[0]?.name||d.naccProofName;
      d.naccNotified=Boolean($('#naccNotifyComplainant')?.checked);
      return state;
    }
    function putDuplicateInNote(){
      const note=$('#adminNote');
      if(!note)return;
      if(!note.value.includes('ECMIS-2569-000127'))note.value=[note.value.trim(),DUPLICATE_NOTE].filter(Boolean).join('\n');
      note.dispatchEvent(new Event('input',{bubbles:true}));
      note.focus();
      note.scrollIntoView({behavior:'smooth',block:'center'});
      notify('success','ใส่ข้อมูลในหมายเหตุแล้ว','เจ้าหน้าที่ผู้รับผิดชอบจะเห็นคำเตือนเรื่องซ้ำนี้');
    }
    function renderList(){const q=$('#filterSearch').value.trim().toLowerCase(),channel=$('#filterChannel').value,region=$('#filterRegion').value,province=$('#filterProvince').value,type=$('#filterType').value,status=$('#filterStatus').value,dup=$('#filterDuplicate').value,date=$('#filterDate').value;const cases=allCases(),states=cases.map(c=>getState(c.id));$('#dashboardTotal').textContent=cases.length;$('#dashboardPending').textContent=states.filter(s=>s.workflow.stage==='admin'&&!s.workflow.complete).length;$('#dashboardReview').textContent=states.filter(s=>s.workflow.stage!=='admin'&&!s.workflow.complete).length;$('#dashboardDone').textContent=states.filter(s=>s.workflow.complete).length;const rows=cases.filter(c=>{const s=getState(c.id);const searchable=[c.id,c.complainant,c.subject,c.agency].join(' ').toLowerCase();const risk=c.id.endsWith('184')?'high':'low';return(!q||searchable.includes(q))&&(!channel||c.channel===channel)&&(!region||c.region===region)&&(!province||c.province===province)&&(!type||c.type===type)&&(!status||s.workflow.status===status)&&(!dup||risk===dup)&&(!date||c.received.includes(new Date(date).getDate().toString()))});$('#caseRows').innerHTML=rows.map(c=>{const s=getState(c.id),risk=c.id.endsWith('184');return `<tr data-case="${c.id}" tabindex="0"><td><strong>${c.id}</strong><small>${c.received}</small></td><td><strong>${escapeHtml(c.complainant)}</strong><small>เลขบัตร •••••••••${c.id4}</small></td><td><strong>${escapeHtml(c.subject)}</strong><small>${escapeHtml(c.agency)}</small></td><td><strong>${escapeHtml(c.province)}</strong><small>${escapeHtml(c.region)}</small></td><td>${c.channel}</td><td><span class="ws-status ${s.workflow.complete?'success':''}">${s.workflow.status}</span><small>ผู้รับผิดชอบ: ${ROLE_LABELS[s.workflow.owner]||s.workflow.owner}</small></td><td><span class="ws-status ${risk?'danger':'success'}">${risk?'ควรตรวจสอบ':'ยังไม่พบสัญญาณ'}</span></td></tr>`}).join('')||'<tr><td colspan="7" class="ws-empty">ไม่พบรายการตามเงื่อนไข</td></tr>';$$('[data-case]').forEach(r=>{const open=()=>{selectedId=r.dataset.case;renderDetail()};r.onclick=open;r.onkeydown=e=>{if(e.key==='Enter')open()}})}
    function editorFor(state){const d=state.documentData,c=state.caseData,w=state.workflow;if(activeRole==='admin')return `<div class="ws-section"><h3>1. ข้อมูลคำร้องเรียนเดิม</h3>${adminCaseSummary(c)}</div><div class="ws-section"><h3>2. ตรวจคำแนะนำเรื่องซ้ำ</h3><div class="ws-callout">ระบบพบเพียงสัญญาณว่าอาจเป็นเรื่องซ้ำ ธุรการบันทึกคำแนะนำและมอบหมายต่อได้ แต่ไม่มีสิทธิปฏิเสธหรือยุติเรื่อง</div><div class="ws-field" style="margin-top:.7rem"><label>ตรวจเลขบัตรประชาชน 4 หลักท้าย</label><div class="ws-inline-action"><input id="dupInput" maxlength="4" value="${c.id4}"><button class="ws-button secondary" id="dupCheck">ตรวจสอบ</button></div></div><div id="dupResult" class="ws-hidden ws-callout" style="margin-top:.7rem">พบเรื่องเดิม ECMIS-2569-000127 โอกาสซ้ำ 92% โปรดบันทึกข้อสังเกตไว้ในหมายเหตุเพื่อให้เจ้าหน้าที่ผู้รับผิดชอบตรวจสอบต่อ</div></div><div class="ws-section"><h3>3. ลงรับและมอบหมายเจ้าหน้าที่</h3><div class="ws-grid-2"><div class="ws-field"><label>เจ้าหน้าที่รับผิดชอบหลัก</label><select id="adminAssignee"><option value="">เลือกเจ้าหน้าที่</option>${OFFICERS.map(x=>`<option ${d.assignedOfficer===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="ws-field"><label>ผู้ปฏิบัติงานแทน</label><select id="adminBackup"><option value="">ไม่กำหนด</option>${OFFICERS.map(x=>`<option ${d.backupOfficer===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="ws-field ws-field-full"><label>หมายเหตุหรือรายละเอียดเพิ่มเติม</label><textarea id="adminNote" placeholder="บันทึกข้อสังเกตเรื่องซ้ำหรือข้อมูลที่ต้องแจ้งเจ้าหน้าที่ผู้รับผิดชอบ">${escapeHtml(d.adminNote)}</textarea></div></div><h3 style="margin-top:1rem">ประวัติการมอบหมาย</h3><ul class="ws-history">${state.assignmentHistory.length?state.assignmentHistory.map(x=>`<li>${escapeHtml(x.text)}<time>${x.time}</time></li>`).join(''):'<li>ยังไม่มีประวัติการมอบหมาย</li>'}</ul></div>`;
      if(activeRole==='officer')return `<div class="ws-section"><h3>ข้อมูลจากขั้นตอนก่อนหน้า</h3>${caseReadonly(c)}<div class="ws-callout" style="margin-top:.7rem">ผู้รับผิดชอบหลัก: ${escapeHtml(d.assignedOfficer||'ยังไม่ระบุ')}<br>ผู้ปฏิบัติงานแทน: ${escapeHtml(d.backupOfficer||'ไม่ได้กำหนด')}<br>หมายเหตุธุรการ: ${escapeHtml(d.adminNote||'ไม่มี')}${d.centerAdditionalDetail?`<br>รายละเอียดเพิ่มเติม ผอ.ศรร.: ${escapeHtml(d.centerAdditionalDetail)}`:''}${d.divisionAdditionalDetail?`<br>รายละเอียดเพิ่มเติม ผอ.กบค.: ${escapeHtml(d.divisionAdditionalDetail)}`:''}</div></div><div class="ws-section"><h3>พิจารณาตามแบบฟอร์ม 3</h3><div class="ws-choice-grid">${[['18/1ก','รับไว้ดำเนินการ 18/1 (ก)'],['18/1ข','รับไว้ดำเนินการ 18/1 (ข)'],['18/4','รับไว้ดำเนินการ 18/4'],['58/2','ดำเนินการตาม 58/2'],['send-nacc','ส่งสำนักงาน ป.ป.ช.'],['not-accept','ไม่รับไว้ดำเนินการ']].map(([v,l])=>`<label class="ws-choice"><input type="radio" name="decision" value="${v}" ${d.decision===v?'checked':''}><span><strong>${l}</strong></span></label>`).join('')}</div><div class="ws-field" style="margin-top:.8rem"><label>เขตที่เสนอให้มอบหมาย *</label><select id="proposedRegion"><option value="">เลือกเขตที่เสนอ</option>${REGIONS.map(region=>`<option value="${region}" ${(d.proposedRegion||c.region)===region?'selected':''}>${region}</option>`).join('')}</select><small>ผอ.ศรร. จะเห็นข้อมูลนี้เพื่อพิจารณาเห็นชอบหรือส่งกลับแก้ไข</small></div><div id="naccReasonBox" class="${d.decision==='send-nacc'?'':'ws-hidden'}" style="margin-top:.8rem"><h3>เหตุผลส่งต่อ เลือกได้หลายข้อ</h3><div class="ws-choice-grid">${NACC_TRANSFER_REASONS.map(x=>`<label class="ws-choice"><input type="checkbox" name="naccReason" value="${escapeHtml(x)}" ${d.reasons.includes(x)?'checked':''}><span><strong>${escapeHtml(x)}</strong></span></label>`).join('')}</div></div><div id="notAcceptBox" class="${d.decision==='not-accept'?'':'ws-hidden'}" style="margin-top:.8rem"><div class="ws-field"><label>เหตุผลที่ไม่รับไว้ดำเนินการ</label><textarea id="notAcceptReason">${escapeHtml(d.notAcceptReason)}</textarea></div><label class="ws-choice" style="margin-top:.6rem"><input type="checkbox" id="anonymous" ${d.anonymous?'checked':''}><span><strong>เป็นบัตรสนเท่ห์</strong><small>เมื่อได้รับอนุมัติ ส่งข้อมูลต่อกิจกรรมที่ 7</small></span></label></div><div class="ws-field" style="margin-top:.8rem"><label>ความเห็นเจ้าหน้าที่รับเรื่อง</label><textarea id="officerOpinion">${escapeHtml(d.officerOpinion)}</textarea></div><section class="route-planner"><header><div><span>เส้นทางการพิจารณา</span><h3>กำหนดผู้รับพิจารณาลำดับถัดไป</h3></div><small>ใช้ลำดับปกติเป็นค่าเริ่มต้น</small></header><div class="route-options"><label class="route-option standard"><input type="radio" name="route" value="center" checked><div class="route-flow"><span>เจ้าหน้าที่รับเรื่อง</span><i>→</i><span>ผอ.ศรร.</span><i>→</i><span>ผอ.กบค.</span></div><strong>ดำเนินการตามลำดับปกติ</strong><small>ส่งให้ ผอ.ศรร. พิจารณาก่อนเสนอ ผอ.กบค.</small></label><label class="route-option exceptional"><input type="radio" name="route" value="division"><div class="route-flow"><span>เจ้าหน้าที่รับเรื่อง</span><i>→</i><span class="route-skipped">ผอ.ศรร.</span><i>→</i><span>ผอ.กบค.</span></div><strong>เสนอข้ามขั้นตอนเป็นกรณีพิเศษ</strong><small>ใช้เมื่อ ผอ.ศรร. ไม่สามารถปฏิบัติหน้าที่ และต้องบันทึกเหตุผล</small></label></div><div class="route-exception-panel ws-hidden" id="absenceBox"><div class="route-exception-head"><span>กรณีพิเศษ</span><strong>บันทึกเหตุผลประกอบการส่งตรงถึง ผอ.กบค.</strong></div><div class="ws-grid-2"><div class="ws-field"><label>ประเภทเหตุผล *</label><select id="absenceReasonType"><option value="">เลือกประเภทเหตุผล</option>${['ลาราชการ','ติดภารกิจราชการ','ไม่สามารถปฏิบัติหน้าที่','มีคำสั่งให้เสนอโดยตรง','อื่น ๆ'].map(reason=>`<option value="${reason}" ${d.absenceReasonType===reason?'selected':''}>${reason}</option>`).join('')}</select></div><div class="ws-field ws-field-full"><label>รายละเอียดและช่วงเวลาที่ไม่อยู่ *</label><textarea id="absenceNote" placeholder="ระบุเหตุผล วันที่หรือช่วงเวลา และข้อมูลอ้างอิงที่เกี่ยวข้อง">${escapeHtml(d.absenceNote)}</textarea></div></div><div class="route-impact"><strong>ผลของเส้นทางนี้</strong><span>เรื่องจะส่งตรงถึง ผอ.กบค. พร้อมบันทึก Log โดย ผอ.กบค. สามารถอนุมัติให้ ผอ.ศรร. กลับมาให้ความเห็นเพิ่มเติมภายหลังได้</span></div></div></section></div>`;
      if(activeRole==='center')return `<div class="ws-section"><h3>ข้อมูลจากเจ้าหน้าที่รับเรื่อง</h3>${caseReadonly(c)}<div class="ws-callout" style="margin-top:.7rem"><strong>เขตที่เสนอให้มอบหมาย: ${escapeHtml(d.proposedRegion||c.region||'ยังไม่ระบุ')}</strong><br>ผลเสนอ: ${d.decision}<br>ความเห็น: ${escapeHtml(d.officerOpinion||'ยังไม่ระบุ')}</div></div><div class="ws-section"><h3>ความเห็น ผอ.ศรร.</h3><div class="ws-choice-grid"><label class="ws-choice"><input type="radio" name="centerDecision" value="agree" ${d.centerDecision!=='disagree'?'checked':''}><span><strong>เห็นชอบให้มอบหมาย ${escapeHtml(d.proposedRegion||c.region||'เขตที่เสนอ')}</strong></span></label><label class="ws-choice"><input type="radio" name="centerDecision" value="disagree" ${d.centerDecision==='disagree'?'checked':''}><span><strong>ไม่เห็นชอบ/ส่งกลับแก้ไข</strong></span></label></div><div class="ws-field" style="margin-top:.7rem"><label>ความเห็นและข้อเสนอแนะ</label><textarea id="centerOpinion">${escapeHtml(d.centerOpinion)}</textarea></div><div class="ws-field" style="margin-top:.7rem"><label>รายละเอียดเพิ่มเติมโดย ผอ.ศรร.</label><textarea id="centerAdditionalDetail" placeholder="เพิ่มข้อเท็จจริงหรือประเด็นประกอบการพิจารณา">${escapeHtml(d.centerAdditionalDetail||'')}</textarea><small>ระบบบันทึกเป็นข้อมูลประกอบการพิจารณา โดยไม่แก้ไขคำร้องเดิมหรือเปลี่ยนผลเสนอของเจ้าหน้าที่อัตโนมัติ</small></div></div>`;
      const centerText=d.centerOpinion|| (d.absenceNote?`ข้ามขั้นตอนตามหมายเหตุ: ${d.absenceNote}`:'ยังไม่ระบุ');
      const acceptedDecision=['18/1ก','18/1ข','18/4'].includes(d.decision);
      const internalLetterFields=acceptedDecision?`<div class="ws-section"><h3>ข้อมูลหนังสือรับไว้ดำเนินการ</h3><div class="ws-grid-2"><div class="ws-field"><label>เลขหนังสือ *</label><input id="internalLetterNo" value="${escapeHtml(d.internalLetterNo||'')}" placeholder="เช่น ปป 0012/2569"></div><div class="ws-field"><label>วันที่หนังสือ *</label><input id="internalLetterDate" type="date" value="${escapeHtml(d.internalLetterDate||'')}"></div></div><div class="ws-callout" style="margin-top:.7rem">ต้องบันทึกเลขหนังสือและวันที่หนังสือก่อนอนุมัติรับไว้ดำเนินการ</div></div>`:'';
      return `<div class="ws-section"><h3>ข้อมูลจากขั้นตอนก่อนหน้า</h3>${caseReadonly(c)}<div class="ws-callout" style="margin-top:.7rem">เขตที่เสนอให้มอบหมาย: ${escapeHtml(d.proposedRegion||c.region||'ยังไม่ระบุ')}<br>ความเห็นเจ้าหน้าที่: ${escapeHtml(d.officerOpinion||'ยังไม่ระบุ')}<br>ความเห็น ผอ.ศรร.: ${escapeHtml(centerText)}${d.centerAdditionalDetail?`<br>รายละเอียดเพิ่มเติม ผอ.ศรร.: ${escapeHtml(d.centerAdditionalDetail)}`:''}</div></div><div class="ws-section"><h3>${activeRole==='acting'?'คำสั่งผู้รักษาราชการแทนตามคำสั่ง':'คำสั่ง ผอ.กบค.'}</h3>${activeRole==='acting'?'<div class="ws-field"><label>อ้างอิงคำสั่งแต่งตั้ง</label><input id="actingOrder" placeholder="เลขที่คำสั่ง/วันที่"></div>':''}<div class="ws-field"><label>ความเห็นและคำสั่ง</label><textarea id="divisionOpinion">${escapeHtml(d.divisionOpinion)}</textarea></div><div class="ws-field" style="margin-top:.7rem"><label>รายละเอียดเพิ่มเติมโดย ${activeRole==='acting'?'ผู้รักษาราชการแทน':'ผอ.กบค.'}</label><textarea id="divisionAdditionalDetail" placeholder="เพิ่มข้อเท็จจริงหรือประเด็นประกอบคำสั่ง">${escapeHtml(d.divisionAdditionalDetail||'')}</textarea><small>ระบบบันทึกเป็นข้อมูลประกอบการพิจารณา โดยไม่แก้ไขคำร้องเดิมหรือเปลี่ยนผลเสนอของเจ้าหน้าที่อัตโนมัติ</small></div></div>${internalLetterFields}`}
    function actionsFor(state){const reset='<button class="ws-button ghost" data-action="reset">เริ่มข้อมูลเรื่องนี้ใหม่</button>';if(activeRole==='admin'){const canRecall=state.documentData.assignedOfficer&&state.workflow.stage==='officer'&&!state.workflow.complete;return `${reset}${canRecall?'<button class="ws-button danger" data-action="recall-assignment">ดึงงานกลับ</button>':''}<button class="ws-button secondary" data-action="draft">บันทึกร่าง</button><button class="ws-button primary" data-action="assign">${state.workflow.status==='รอมอบหมายใหม่'?'มอบหมายใหม่':'ลงรับและมอบหมาย'}</button>`}if(activeRole==='officer')return `${reset}<button class="ws-button secondary" data-action="draft">บันทึก Form 3</button><button class="ws-button secondary" data-action="print">พิมพ์ Form 3</button><button class="ws-button primary" data-action="officer-send">บันทึกและส่งพิจารณา</button>`;if(activeRole==='center')return `${reset}<button class="ws-button danger" data-action="center-return">ส่งกลับเจ้าหน้าที่แก้ไข</button><button class="ws-button primary" data-action="center-send">บันทึกและส่ง ผอ.กบค.</button>`;return `${reset}${activity5Link(state)}<button class="ws-button secondary" data-action="division-center">ขอความเห็น ผอ.ศรร.</button><button class="ws-button danger" data-action="division-return">ส่งกลับเจ้าหน้าที่แก้ไข</button><button class="ws-button primary" data-action="approve">อนุมัติและดำเนินการต่อ</button>`}
    function operationalWorkspace(state){const w=state.workflow;const editor=`<section class="ws-card ws-editor ${activeRole==='admin'?'ws-admin-workspace':''}"><header class="ws-editor-head"><div><p class="ws-kicker">งานของ ${ROLE_LABELS[activeRole]}</p><h2>${w.complete?'ตรวจสอบข้อมูลที่ดำเนินการแล้ว':'ดำเนินการเรื่องร้องเรียน'}</h2></div><span class="ws-status">${w.status}</span></header><div class="ws-editor-body">${editorFor(state)}${activeRole==='admin'?'':`<div class="ws-section"><h3>ประวัติการตัดสินใจ</h3><ul class="ws-history">${state.decisionHistory.length?state.decisionHistory.map(x=>`<li>${escapeHtml(x.text)}<time>${x.time}</time></li>`).join(''):'<li>ยังไม่มีประวัติการตัดสินใจ</li>'}</ul></div>`}</div></section>`;if(activeRole==='admin')return `<div class="ws-admin-layout">${editor}</div>`;return `<div class="document-workspace">${editor}<aside class="ws-doc-pane"><div class="ws-doc-toolbar"><div class="ws-doc-tabs">${docTabs(state,activeRole)}</div><button class="ws-button secondary" data-action="print">พิมพ์/PDF</button></div><div class="ws-paper-stage" id="paperStage">${documentPaper(state,'form3',activeRole)}</div></aside></div>`}
    function renderDetail(){const state=getState(selectedId),c=state.caseData,w=state.workflow;$('#caseListView').classList.add('ws-hidden');const view=$('#caseDetailView');view.classList.remove('ws-hidden');view.innerHTML=`<button class="ws-button ghost" id="backList" style="margin-bottom:.8rem">กลับรายการเรื่องร้องเรียน</button><section class="ws-card ws-case-head"><div><p class="ws-kicker">${escapeHtml(c.channel)} · ${escapeHtml(c.region)}</p><h1>${c.id}</h1><div class="ws-case-meta"><span>${escapeHtml(c.subject)}</span><span>รับเรื่อง ${c.received}</span><span>เลขติดตาม ${c.trackingYear} / ${c.trackingCode}</span></div></div><div><span class="ws-status ${w.complete?'success':''}">${w.status}</span><p style="margin:.4rem 0 0;font-size:.8rem;color:#687789">ผู้รับผิดชอบ: ${ROLE_LABELS[w.owner]}</p></div></section><nav class="ws-card ws-stagebar">${stagebar(state,activeRole)}</nav>${operationalWorkspace(state)}<div class="ws-actions">${actionsFor(state)}</div>`;$('#backList').onclick=()=>{view.classList.add('ws-hidden');$('#caseListView').classList.remove('ws-hidden');selectedId=null;renderList()};wireDetail(state)}
    function capture(state){const d=state.documentData;const value=id=>$('#'+id)?.value?.trim()||'';if(activeRole==='admin'){d.assignedOfficer=value('adminAssignee');d.backupOfficer=value('adminBackup');d.adminNote=value('adminNote')}if(activeRole==='officer'){d.decision=$('input[name="decision"]:checked')?.value||d.decision;d.reasons=$$('input[name="naccReason"]:checked').map(x=>x.value);d.notAcceptReason=value('notAcceptReason');d.anonymous=$('#anonymous')?.checked||false;d.proposedRegion=value('proposedRegion')||d.proposedRegion;d.officerOpinion=value('officerOpinion');d.reviewRoute=$('input[name="route"]:checked')?.value||'center';d.absenceReasonType=value('absenceReasonType');d.absenceNote=value('absenceNote');d.actingOfficer=value('actingOfficer')||d.actingOfficer;d.actingOrder=value('actingOrder')||d.actingOrder}if(activeRole==='center'){d.centerDecision=$('input[name="centerDecision"]:checked')?.value||'';d.centerOpinion=value('centerOpinion');d.centerAdditionalDetail=value('centerAdditionalDetail')}if(activeRole==='division'||activeRole==='acting'){d.divisionOpinion=value('divisionOpinion');d.divisionAdditionalDetail=value('divisionAdditionalDetail');d.internalLetterNo=value('internalLetterNo')||d.internalLetterNo;d.internalLetterDate=value('internalLetterDate')||d.internalLetterDate;d.actingOrder=value('actingOrder')||d.actingOrder}return state}
    function wireDetail(state){const refreshPaper=()=>{const paper=$('#paperStage');if(!paper)return;const activeDoc=$('[data-doc].active')?.dataset.doc||'form3';paper.innerHTML=documentPaper(capture(state),activeDoc,activeRole)};$$('input,textarea,select',$('#caseDetailView')).forEach(x=>x.addEventListener('input',refreshPaper));$$('input[name="decision"]').forEach(x=>x.onchange=()=>{$('#naccReasonBox').classList.toggle('ws-hidden',x.value!=='send-nacc');$('#notAcceptBox').classList.toggle('ws-hidden',x.value!=='not-accept');refreshPaper()});$$('input[name="route"]').forEach(x=>x.onchange=()=>$('#absenceBox').classList.toggle('ws-hidden',x.value!=='division'));$('#dupCheck')?.addEventListener('click',()=>{if($('#dupInput').value==='1234')$('#dupResult').classList.remove('ws-hidden');else notify('info','ยังไม่พบเรื่องใกล้เคียง','ผลนี้เป็นเพียงตัวช่วย เจ้าหน้าที่ยังต้องตรวจสอบข้อมูลด้วยตนเอง')});$$('[data-doc]').forEach(b=>b.onclick=()=>{$$('[data-doc]').forEach(x=>{const selected=x===b;x.classList.toggle('active',selected);x.setAttribute('aria-selected',String(selected))});$('#paperStage').innerHTML=documentPaper(capture(state),b.dataset.doc,activeRole)});$$('[data-action]').forEach(b=>b.onclick=()=>handleAction(b.dataset.action,state))}
    async function handleAction(action,state){
      if(action==='print'){window.print();return}
      if(action==='reset'){
        const ok=await confirmDo('เริ่มข้อมูลเรื่องนี้ใหม่','ลบเฉพาะข้อมูลกระบวนงานของเรื่องนี้ในเบราว์เซอร์ ข้อมูลเรื่องอื่นไม่เปลี่ยน','เริ่มใหม่');
        if(!ok.isConfirmed)return;
        const store=readStore();delete store[selectedId];writeStore(store);
        notify('success','เริ่มข้อมูลเรื่องนี้ใหม่แล้ว','ประวัติและร่างของเรื่องนี้ถูกล้างออก');renderDetail();renderList();return;
      }
      state=capture(state);
      const d=state.documentData,w=state.workflow;
      const add=text=>state.decisionHistory.push({text,time:now()});
      let handoffResult=null;
      if(action==='draft'){
        state.documentVersions.push({version:state.documentVersions.length+1,actor:ROLE_LABELS[activeRole],time:now()});
        saveState(selectedId,state);notify('success','บันทึกร่างแล้ว','ข้อมูลถูกเก็บในเรื่องนี้และจะแสดงให้ผู้ดำเนินการคนถัดไปเห็น');renderDetail();return;
      }
      if(action==='assign'){
        if(!d.assignedOfficer)return notify('warning','ยังไม่ได้เลือกผู้รับผิดชอบ','เลือกเจ้าหน้าที่รับผิดชอบหลักก่อนลงรับและมอบหมาย');
        const ok=await confirmDo('ยืนยันการลงรับและมอบหมาย',`ส่งงานให้ ${d.assignedOfficer}`,'ลงรับและมอบหมาย');
        if(!ok.isConfirmed)return;
        const previous=state.assignmentHistory.at(-1)?.text||'';
        state.assignmentHistory.push({text:`${previous?'เปลี่ยนผู้รับผิดชอบเป็น':'มอบหมายให้'} ${d.assignedOfficer} โดยธุรการ ศรร.`,time:now()});
        w.owner='officer';w.stage='officer';w.status='รอเจ้าหน้าที่พิจารณา';add(`ธุรการ ศรร. ลงรับและมอบหมายให้ ${d.assignedOfficer}`);
      }
      if(action==='officer-send'){
        if(!d.proposedRegion)return notify('warning','ยังไม่ได้เลือกเขตที่เสนอ','เลือกเขตที่เสนอให้มอบหมายก่อนส่งพิจารณา');
        if(!d.officerOpinion)return notify('warning','ยังไม่มีความเห็นเจ้าหน้าที่','กรอกข้อเท็จจริงและความเห็นก่อนส่งพิจารณา');
        if(d.decision==='send-nacc'&&!d.reasons.length)return notify('warning','ยังไม่ได้เลือกเหตุผล','เลือกเหตุผลส่งสำนักงาน ป.ป.ช. อย่างน้อย 1 ข้อ');
        const route=$('input[name="route"]:checked')?.value;
        if(route==='division'&&!d.absenceReasonType)return notify('warning','ยังไม่ได้เลือกประเภทเหตุผล','เลือกประเภทเหตุผลที่ต้องส่งข้าม ผอ.ศรร.');
        if(route==='division'&&!d.absenceNote)return notify('warning','รายละเอียดเหตุผลไม่ครบ','ระบุเหตุผล ช่วงเวลา และข้อมูลอ้างอิงก่อนส่งตรงถึง ผอ.กบค.');
        if(route==='division'&&!d.actingOfficer)return notify('warning','ยังไม่ได้เลือกผู้พิจารณาแทน','เลือก ผอ.กบค. หรือผู้รักษาราชการแทนตามคำสั่ง');
        if(route==='division'&&!d.actingOrder)return notify('warning','ยังไม่มีคำสั่งอ้างอิง','กรอกเลขที่คำสั่งและวันที่แต่งตั้งผู้รักษาราชการแทน');
        const useActing=route==='division'&&d.actingOfficer!=='ผอ.กบค.';
        w.owner=route==='division'?(useActing?'acting':'division'):'center';w.stage=w.owner;w.status=route==='division'?`รอ ${d.actingOfficer}`:'รอ ผอ.ศรร.';
        add(route==='division'?`เจ้าหน้าที่รับเรื่องเสนอให้มอบหมาย ${d.proposedRegion} เนื่องจาก ${d.absenceReasonType}: ${d.absenceNote} ส่งให้ ${d.actingOfficer} ตาม ${d.actingOrder}`:`เจ้าหน้าที่รับเรื่องเสนอให้มอบหมาย ${d.proposedRegion} และส่ง ผอ.ศรร.`);
      }
      if(action==='center-return'){
        if(!d.centerOpinion)return notify('warning','ต้องระบุเหตุผล','กรอกประเด็นที่ต้องแก้ไขก่อนส่งกลับ');
        w.owner='officer';w.stage='officer';w.status='ส่งกลับเจ้าหน้าที่แก้ไข';d.centerDecision='disagree';add(`ผอ.ศรร. ไม่เห็นชอบการมอบหมาย ${d.proposedRegion||'เขตที่เสนอ'} และส่งกลับเจ้าหน้าที่รับเรื่องแก้ไข`);
      }
      if(action==='center-send'){
        if(d.centerDecision==='disagree')return notify('warning','เลือกไม่เห็นชอบ','กดส่งกลับเจ้าหน้าที่แก้ไขเพื่อดำเนินการตามความเห็น');
        if(!d.centerOpinion)return notify('warning','ยังไม่มีความเห็น ผอ.ศรร.','กรอกความเห็นก่อนส่ง ผอ.กบค.');
        w.owner='division';w.stage='division';w.status='รอ ผอ.กบค.';add(`ผอ.ศรร. เห็นชอบให้มอบหมาย ${d.proposedRegion||'เขตที่เสนอ'} และส่ง ผอ.กบค.`);
      }
      if(action==='division-center'){w.owner='center';w.stage='center';w.status='รอ ผอ.ศรร. ให้ความเห็นเพิ่มเติม';add('ผอ.กบค. อนุมัติให้ ผอ.ศรร. กลับเข้าขั้นตอนเพื่อให้ความเห็นเพิ่มเติม')}
      if(action==='division-return'){
        if(!d.divisionOpinion)return notify('warning','ต้องระบุเหตุผล','กรอกคำสั่งหรือประเด็นที่ต้องแก้ไข');
        w.owner='officer';w.stage='officer';w.status='ส่งกลับเจ้าหน้าที่แก้ไข';add('ผอ.กบค. ส่งกลับเจ้าหน้าที่รับเรื่องแก้ไข');
      }
      if(action==='approve'){
        if(!d.divisionOpinion)return notify('warning','ยังไม่มีคำสั่ง','กรอกความเห็นและคำสั่งก่อนอนุมัติ');
        if(['18/1ก','18/1ข','18/4'].includes(d.decision)&&(!d.internalLetterNo||!d.internalLetterDate))return notify('warning','ข้อมูลหนังสือยังไม่ครบ','กรอกเลขหนังสือและวันที่หนังสือก่อนอนุมัติรับไว้ดำเนินการ');
        if(activeRole==='acting'){d.actingOrder=$('#actingOrder')?.value?.trim()||d.actingOrder||'';if(!d.actingOrder)return notify('warning','ยังไม่มีคำสั่งแต่งตั้ง','กรอกเลขที่คำสั่งและวันที่แต่งตั้งผู้รักษาราชการแทนก่อนอนุมัติ')}
        const approvalActor=activeRole==='acting'?`${d.actingOfficer||ROLE_LABELS[activeRole]} ตาม ${d.actingOrder}`:ROLE_LABELS[activeRole];
        const acceptedDecision=['18/1ก','18/1ข','18/4'].includes(d.decision);
        if(acceptedDecision&&!d.caseNumber){
          const confirmed=await confirmDo('ลงนามอนุมัติและออกเลขสำนวน','หลังยืนยัน ระบบจะออกเลขสำนวนและเปิดเผยสถานะรับไว้ดำเนินการแก่ผู้ร้อง','ลงนามและออกเลขสำนวน');
          if(!confirmed.isConfirmed)return;
          d.approvedAt=new Date().toISOString();d.approvedBy=approvalActor;issueCaseNumber(state);
          d.publicStatus='สำนักงานได้รับเรื่องของท่านไว้แล้ว และจะดำเนินการเรื่องของท่านต่อไป';
        }
        const anonymousRejected=d.decision==='not-accept'&&d.anonymous;
        if(anonymousRejected){
          w.owner='anonymous';w.stage='anonymous-box';w.status='รอหัวหน้าพนักงานผู้ตรวจเสนอ';w.complete=false;
          add(`${approvalActor} อนุมัติไม่รับไว้ดำเนินการและส่งเข้ากล่องบัตรสนเท่ห์`);
        }else{
          w.complete=true;w.status='ดำเนินการเสร็จสิ้น';add(`${approvalActor} อนุมัติผลการพิจารณา${d.caseNumber?` และออกเลขสำนวน ${d.caseNumber}`:''}${d.internalLetterNo?` เลขหนังสือ ${d.internalLetterNo} ลงวันที่ ${d.internalLetterDate}`:''}`);
          handoffResult=window.ECMISActivity5Handoff?.create(localStorage,state,new Date().toISOString(),activeRole)||null;if(handoffResult?.eligible)w.status='ส่งต่อ Activity 5 แล้ว';
        }
      }
      if(['center-return','center-send'].includes(action)&&d.centerAdditionalDetail)add('ผอ.ศรร. เพิ่มรายละเอียดประกอบการพิจารณา โดยไม่แก้ไขข้อมูลคำร้องเดิม');
      if(['division-center','division-return','approve'].includes(action)&&d.divisionAdditionalDetail)add(`${ROLE_LABELS[activeRole]} เพิ่มรายละเอียดประกอบการพิจารณา โดยไม่แก้ไขข้อมูลคำร้องเดิม`);
      state.documentVersions.push({version:state.documentVersions.length+1,actor:ROLE_LABELS[activeRole],time:now()});saveState(selectedId,state);
      const handoffText=handoffResult?.eligible?(handoffResult.created?' สร้างข้อมูลส่งต่อ Activity 5 แล้ว':' พบข้อมูลส่งต่อ Activity 5 เดิมและไม่สร้างซ้ำ'):'';
      notify('success','บันทึกและส่งงานแล้ว',`สถานะปัจจุบัน: ${w.status}${handoffText}`);renderDetail();renderList();
    }
    root.addEventListener('click',async event=>{
      const manageSuggestionsButton=event.target.closest('#manageSuggestions');
      if(manageSuggestionsButton){
        event.preventDefault();
        await manageSuggestions();
        return;
      }
      const suggestionButton=event.target.closest('[data-suggestion-target]');
      if(suggestionButton){
        event.preventDefault();
        const input=$(`#${suggestionButton.dataset.suggestionTarget}`);
        const text=suggestionButton.dataset.suggestionText;
        if(input&&!input.value.includes(text))input.value=[input.value.trim(),text].filter(Boolean).join('\n');
        input?.dispatchEvent(new Event('input',{bubbles:true}));
        suggestionButton.closest('.smart-suggestions')?.classList.add('suggestion-selected');
        setTimeout(()=>suggestionButton.closest('.smart-suggestions')?.classList.remove('suggestion-selected'),650);
        return;
      }
      const approveNaccButton=event.target.closest('[data-action="approve"]');
      if(approveNaccButton&&getState(selectedId).documentData.decision==='send-nacc'){
        event.preventDefault();
        event.stopImmediatePropagation();
        const state=capture(getState(selectedId)),d=state.documentData;
        if(!d.divisionOpinion){notify('warning','ยังไม่มีคำสั่ง','กรอกความเห็นและคำสั่งก่อนอนุมัติส่ง ป.ป.ช.');return}
        if(activeRole==='acting'){
          d.actingOrder=$('#actingOrder')?.value?.trim()||d.actingOrder||'';
          if(!d.actingOrder){notify('warning','ยังไม่มีคำสั่งแต่งตั้ง','กรอกเลขที่คำสั่งและวันที่แต่งตั้งผู้รักษาราชการแทน');return}
        }
        const confirmation=await confirmDo('อนุมัติส่งสำนักงาน ป.ป.ช.','ส่งงานกลับเจ้าหน้าที่รับเรื่องเพื่อออกหนังสือและบันทึกหลักฐานการจัดส่ง','อนุมัติและส่งจัดทำหนังสือ');
        if(!confirmation.isConfirmed)return;
        const time=now();
        state.workflow.owner='officer';
        state.workflow.stage='nacc-dispatch';
        state.workflow.status='รอจัดส่งสำนักงาน ป.ป.ช.';
        state.workflow.complete=false;
        const approvalActor=activeRole==='acting'?`${d.actingOfficer||ROLE_LABELS[activeRole]} ตาม ${d.actingOrder}`:ROLE_LABELS[activeRole];
        state.decisionHistory.push({text:`${approvalActor} อนุมัติให้ส่งสำนักงาน ป.ป.ช. และส่งงานกลับเจ้าหน้าที่รับเรื่องเพื่อจัดส่ง`,time});
        if(d.divisionAdditionalDetail)state.decisionHistory.push({text:`${ROLE_LABELS[activeRole]} เพิ่มรายละเอียดประกอบการพิจารณา โดยไม่แก้ไขข้อมูลคำร้องเดิม`,time});
        state.documentVersions.push({version:state.documentVersions.length+1,actor:ROLE_LABELS[activeRole],time});
        saveState(selectedId,state);
        notify('success','อนุมัติส่ง ป.ป.ช. แล้ว','เรื่องอยู่ในขั้นตอนรอเจ้าหน้าที่บันทึกเลขหนังสือและหลักฐานการจัดส่ง');
        activeRole='officer';
        sessionStorage.setItem('ecmis-a4-role',activeRole);
        $('#wsRole').value=activeRole;
        updateAdminTools();
        renderDetail();
        renderList();
        return;
      }
      const naccActionButton=event.target.closest('[data-action="nacc-draft"],[data-action="nacc-dispatch-confirm"]');
      if(naccActionButton){
        event.preventDefault();
        event.stopImmediatePropagation();
        const action=naccActionButton.dataset.action;
        const state=captureNaccDispatch(getState(selectedId)),d=state.documentData;
        if(action==='nacc-draft'){
          state.documentVersions.push({version:state.documentVersions.length+1,actor:'เจ้าหน้าที่รับเรื่อง',time:now()});
          saveState(selectedId,state);
          notify('success','บันทึกร่างการจัดส่งแล้ว','เลขหนังสือ ข้อมูล EMS และมติบอร์ดถูกบันทึกไว้ในเรื่อง');
          return;
        }
        if(!d.naccLetterNo||!d.naccLetterDate||!d.naccSentDate||!d.naccBoardNo||!d.naccBoardDate){notify('warning','ข้อมูลการจัดส่งยังไม่ครบ','กรอกเลขหนังสือ วันที่หนังสือ วันที่ส่ง และข้อมูลมติบอร์ดให้ครบ');return}
        if(d.naccSendMethod==='EMS'&&!d.naccEms){notify('warning','ยังไม่มีเลข EMS','กรอกเลข EMS ก่อนยืนยันการจัดส่ง');return}
        if(!d.naccNotified){notify('warning','ยังไม่ได้เลือกแจ้งผู้ร้อง','เลือกแจ้งผู้ร้องเพื่อเปิดเผยเลขหนังสือในหน้าติดตาม');return}
        const confirmation=await confirmDo('ยืนยันส่งสำนักงาน ป.ป.ช.','บันทึกการจัดส่งและเปิดเผยเลขหนังสือแก่ผู้ร้อง','ยืนยันส่งและแจ้งผู้ร้อง');
        if(!confirmation.isConfirmed)return;
        const time=now();
        state.workflow.stage='nacc-dispatch';
        state.workflow.status='ส่งสำนักงาน ป.ป.ช. แล้ว';
        state.workflow.complete=true;
        state.workflow.owner='officer';
        state.decisionHistory.push({text:`[จัดส่ง ป.ป.ช.] เลขหนังสือ ${d.naccLetterNo} · ${d.naccSendMethod}${d.naccEms?` ${d.naccEms}`:''} · มติ ${d.naccBoardNo} · แจ้งผู้ร้องแล้ว`,time});
        state.documentVersions.push({version:state.documentVersions.length+1,actor:'เจ้าหน้าที่รับเรื่อง',time});
        saveState(selectedId,state);
        notify('success','ส่งสำนักงาน ป.ป.ช. แล้ว','ผู้ร้องสามารถเห็นเลขหนังสือและข้อมูลการจัดส่งในหน้าติดตาม');
        renderDetail();
        renderList();
        return;
      }
      const naccPrintButton=event.target.closest('.nacc-dispatch-hero')?null:event.target.closest('[data-action="print"]');
      if(naccPrintButton&&getState(selectedId).workflow.stage==='nacc-dispatch'){
        event.preventDefault();
        event.stopImmediatePropagation();
        window.print();
        return;
      }
      const naccResetButton=event.target.closest('[data-action="reset"]');
      if(naccResetButton&&getState(selectedId).workflow.stage==='nacc-dispatch'){
        event.preventDefault();
        event.stopImmediatePropagation();
        await handleAction('reset',getState(selectedId));
        return;
      }
      const manageBackupsButton=event.target.closest('#manageBackups');
      if(manageBackupsButton){
        event.preventDefault();
        await manageBackupOfficers();
        return;
      }
      const assignButton=event.target.closest('[data-action="assign"]');
      if(assignButton){
        event.preventDefault();
        event.stopImmediatePropagation();
        const state=capture(getState(selectedId));
        const d=state.documentData;
        if(!d.assignedOfficer){
          notify('warning','ยังไม่ได้เลือกผู้รับผิดชอบ','เลือกเจ้าหน้าที่รับผิดชอบหลักก่อนลงรับและมอบหมาย');
          return;
        }
        d.backupOfficer=readBackupSettings().assignments[d.assignedOfficer]||'';
        if(d.backupOfficer&&d.backupOfficer===d.assignedOfficer){
          notify('warning','เลือกเจ้าหน้าที่ซ้ำกัน','ผู้รับผิดชอบหลักและผู้ปฏิบัติงานแทนต้องเป็นคนละคน');
          return;
        }
        const previousOfficer=d.previousOfficer||'';
        const previousBackupOfficer=d.previousBackupOfficer||'';
        const backupText=d.backupOfficer||'ไม่ได้กำหนด';
        const confirmation=await confirmDo('ยืนยันการมอบหมาย',`ผู้รับผิดชอบหลัก: ${d.assignedOfficer}\nผู้ปฏิบัติงานแทน: ${backupText}`,previousOfficer?'มอบหมายใหม่':'ลงรับและมอบหมาย');
        if(!confirmation.isConfirmed)return;
        const text=previousOfficer
          ?`[มอบหมายใหม่] เปลี่ยนผู้รับผิดชอบหลักจาก ${previousOfficer} เป็น ${d.assignedOfficer} · ผู้ปฏิบัติงานแทนจาก ${previousBackupOfficer||'ไม่ได้กำหนด'} เป็น ${backupText} · ดำเนินการโดยธุรการ ศรร.`
          :`[มอบหมาย] ผู้รับผิดชอบหลัก ${d.assignedOfficer} · ผู้ปฏิบัติงานแทน ${backupText} · ดำเนินการโดยธุรการ ศรร.`;
        state.assignmentHistory.push({action:previousOfficer?'reassign':'assign',previousOfficer,newOfficer:d.assignedOfficer,previousBackupOfficer,newBackupOfficer:d.backupOfficer||'',actor:'ธุรการ ศรร.',text,time:now()});
        state.decisionHistory.push({text,time:now()});
        state.documentVersions.push({version:state.documentVersions.length+1,actor:'ธุรการ ศรร.',time:now()});
        d.previousOfficer='';
        d.previousBackupOfficer='';
        state.workflow.owner='officer';
        state.workflow.stage='officer';
        state.workflow.status='รอเจ้าหน้าที่พิจารณา';
        saveState(selectedId,state);
        notify('success','มอบหมายงานแล้ว',`ผู้รับผิดชอบหลัก: ${d.assignedOfficer} · ผู้ปฏิบัติงานแทน: ${backupText}`);
        renderDetail();
        renderList();
        return;
      }
      const attachmentButton=event.target.closest('[data-attachment]');
      if(attachmentButton){
        event.preventDefault();
        event.stopImmediatePropagation();
        const name=attachmentButton.dataset.attachment;
        const isImage=/\.(jpe?g|png|gif|webp)$/i.test(name);
        const preview=isImage
          ?`<div class="mock-attachment-image"><span>ภาพเอกสารประกอบ</span><strong>${escapeHtml(name)}</strong></div>`
          :`<div class="mock-attachment-document"><p class="mock-document-mark">เอกสารเรื่องร้องเรียน</p><h3>${escapeHtml(name)}</h3><p>เอกสารฉบับจำลองสำหรับตรวจสอบข้อมูลและไฟล์แนบของเรื่องร้องเรียน</p><p>สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</p></div>`;
        if(window.Swal)await Swal.fire({title:'เปิดไฟล์แนบ',html:preview,width:760,confirmButtonText:'ปิด',confirmButtonColor:'#082b50'});
        else alert(`เปิดไฟล์แนบ: ${name}`);
        return;
      }
      const notifyDuplicateButton=event.target.closest('#notifyDuplicateResult');
      if(notifyDuplicateButton){
        event.preventDefault();
        const confirmation=await confirmDo('ยืนยันการแจ้งผลเรื่องซ้ำ','บันทึกและแจ้งผู้ร้องว่าเรื่องนี้ซ้ำกับ ECMIS-2569-000127','แจ้งผลเรื่องซ้ำ');
        if(!confirmation.isConfirmed)return;
        const state=getState(selectedId);
        const time=now();
        state.duplicateNotification={status:'sent',duplicateCaseId:'ECMIS-2569-000127',similarity:92,actor:'ธุรการ ศรร.',time};
        state.decisionHistory.push({text:'[แจ้งผลเรื่องซ้ำ] ธุรการ ศรร. แจ้งผู้ร้องว่าเรื่องซ้ำกับ ECMIS-2569-000127 ความใกล้เคียง 92%',time});
        saveState(selectedId,state);
        notifyDuplicateButton.disabled=true;
        notifyDuplicateButton.textContent='แจ้งผลแล้ว';
        notify('success','แจ้งผลเรื่องซ้ำแล้ว','ระบบบันทึกประวัติการแจ้งไว้ในเรื่องร้องเรียนแล้ว');
        return;
      }
      const copyDuplicateButton=event.target.closest('#copyDuplicateNote');
      if(copyDuplicateButton){
        event.preventDefault();
        putDuplicateInNote();
        return;
      }
      const duplicateButton=event.target.closest('#dupCheck');
      if(duplicateButton){
        event.preventDefault();
        event.stopImmediatePropagation();
        const silent=duplicateButton.dataset.silent==='true';
        delete duplicateButton.dataset.silent;
        const duplicateResult=$('#dupResult');
        if($('#dupInput').value==='1234'){
          duplicateResult.classList.remove('ws-hidden');
          duplicateResult.classList.add('duplicate-critical');
          const notified=getState(selectedId).duplicateNotification?.status==='sent';
          duplicateResult.innerHTML=`<div><strong>คำเตือนระดับสูง: พบความเสี่ยงเรื่องร้องเรียนซ้ำ</strong><p>เรื่องเดิม ECMIS-2569-000127 · ความใกล้เคียง 92%</p><p>ต้องตรวจสอบและเปรียบเทียบข้อเท็จจริงก่อนดำเนินการต่อ</p></div><div class="duplicate-alert-actions"><button type="button" class="ws-button secondary" id="copyDuplicateNote">ใส่ในหมายเหตุ</button><button type="button" class="ws-button danger" id="notifyDuplicateResult" ${notified?'disabled':''}>${notified?'แจ้งผลแล้ว':'แจ้งผลเรื่องซ้ำ'}</button></div>`;
          if(window.Swal&&!silent){
            const result=await Swal.fire({icon:'error',title:'คำเตือน: ความเสี่ยงเรื่องซ้ำสูง',html:'<div class="duplicate-alert-card"><span>ความใกล้เคียง</span><strong>92%</strong><p>พบเรื่องเดิม <b>ECMIS-2569-000127</b></p><p>กรุณาตรวจสอบและเปรียบเทียบข้อเท็จจริงก่อนมอบหมายงาน</p></div>',width:720,showCancelButton:true,confirmButtonText:'ใส่ในหมายเหตุ',cancelButtonText:'ปิดคำเตือน',confirmButtonColor:'#a52c25',cancelButtonColor:'#687789',allowOutsideClick:false});
            if(result.isConfirmed)putDuplicateInNote();
          }
          else if(!window.Swal&&!silent)alert('พบเรื่องร้องเรียนที่อาจซ้ำ\nเรื่องเดิม ECMIS-2569-000127\nความใกล้เคียง 92%');
        }else{
          duplicateResult.classList.add('ws-hidden');
          notify('info','ยังไม่พบเรื่องใกล้เคียง','ผลนี้เป็นเพียงข้อมูลประกอบ เจ้าหน้าที่ยังต้องตรวจสอบข้อเท็จจริง');
        }
        return;
      }
      const button=event.target.closest('[data-action="recall-assignment"]');
      if(!button)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const state=getState(selectedId);
      const previousOfficer=state.documentData.assignedOfficer;
      const previousBackupOfficer=state.documentData.backupOfficer||'';
      if(state.workflow.complete||state.workflow.stage!=='officer'||!previousOfficer){notify('warning','ไม่สามารถดึงงานกลับได้','เรื่องไม่ได้อยู่ในขั้นตอนที่ธุรการสามารถดึงกลับเพื่อมอบหมายใหม่');return}
      let reason='';
      if(window.Swal){
        const result=await Swal.fire({icon:'warning',title:'ดึงงานกลับเพื่อมอบหมายใหม่',text:`ผู้รับผิดชอบปัจจุบัน: ${previousOfficer}`,input:'textarea',inputLabel:'เหตุผลการดึงงานกลับ',inputPlaceholder:'ระบุเหตุผลที่มอบหมายผิดคน',inputValidator:value=>value.trim()?'':'กรุณาระบุเหตุผล',showCancelButton:true,confirmButtonText:'ดึงงานกลับ',cancelButtonText:'ยกเลิก',confirmButtonColor:'#a52c25'});
        if(!result.isConfirmed)return;
        reason=result.value.trim();
      }else{
        reason=(prompt('ระบุเหตุผลการดึงงานกลับ')||'').trim();
        if(!reason)return;
      }
      state.documentData.previousOfficer=previousOfficer;
      state.documentData.previousBackupOfficer=previousBackupOfficer;
      state.documentData.assignedOfficer='';
      state.documentData.backupOfficer='';
      state.workflow.owner='admin';
      state.workflow.stage='admin';
      state.workflow.status='รอมอบหมายใหม่';
      state.assignmentHistory.push({action:'recall',previousOfficer,newOfficer:'',previousBackupOfficer,newBackupOfficer:'',reason,actor:'ธุรการ ศรร.',text:`[ดึงกลับ] ดึงงานกลับจาก ${previousOfficer}${previousBackupOfficer?` · ผู้ปฏิบัติงานแทน ${previousBackupOfficer}`:''} · เหตุผล: ${reason} · ดำเนินการโดยธุรการ ศรร.`,time:now()});
      state.decisionHistory.push({text:`ธุรการ ศรร. ดึงงานกลับจาก ${previousOfficer} เพื่อมอบหมายใหม่`,time:now()});
      state.documentVersions.push({version:state.documentVersions.length+1,actor:'ธุรการ ศรร.',time:now()});
      saveState(selectedId,state);
      notify('success','ดึงงานกลับแล้ว','เรื่องอยู่ในสถานะรอมอบหมายใหม่');
      renderDetail();
      renderList();
    },true);
    renderList();if(selectedId)renderDetail();
  }
  document.addEventListener('DOMContentLoaded',()=>{if($('#walkinApp'))renderWalkin();if($('#staffApp'))renderStaff()});
})();
