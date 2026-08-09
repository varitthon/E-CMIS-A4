(() => {
  const STORAGE_KEY = 'ecmis-a4-workspace-v3';
  const BACKUP_STORAGE_KEY = 'ecmis-a4-officer-backups-v1';
  const SUGGESTION_STORAGE_KEY = 'ecmis-a4-suggestions-v1';
  const FONT_SIZE_STORAGE_KEY = 'ecmis-a4-font-size-v2';
  const DEFAULT_FONT_SIZE_STEP = 1;
  const THAI_LOCATION_URL = 'https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json';
  const STAFF_LOCATION_FALLBACK = [
    {name_th:'กรุงเทพมหานคร',districts:[{name_th:'เขตพระนคร',sub_districts:[{name_th:'พระบรมมหาราชวัง',zip_code:10200},{name_th:'วังบูรพาภิรมย์',zip_code:10200}]},{name_th:'เขตดุสิต',sub_districts:[{name_th:'ดุสิต',zip_code:10300},{name_th:'วชิรพยาบาล',zip_code:10300}]}]},
    {name_th:'นนทบุรี',districts:[{name_th:'เมืองนนทบุรี',sub_districts:[{name_th:'สวนใหญ่',zip_code:11000},{name_th:'ตลาดขวัญ',zip_code:11000},{name_th:'ท่าทราย',zip_code:11000}]},{name_th:'ปากเกร็ด',sub_districts:[{name_th:'ปากเกร็ด',zip_code:11120},{name_th:'บางตลาด',zip_code:11120}]}]},
    {name_th:'ชลบุรี',districts:[{name_th:'เมืองชลบุรี',sub_districts:[{name_th:'บางปลาสร้อย',zip_code:20000},{name_th:'มะขามหย่ง',zip_code:20000}]},{name_th:'ศรีราชา',sub_districts:[{name_th:'ศรีราชา',zip_code:20110},{name_th:'สุรศักดิ์',zip_code:20110}]}]}
  ];
  const ROLE_LABELS = { admin:'ธุรการ ศรร.', officer:'เจ้าหน้าที่รับเรื่อง', 'regional-officer':'เจ้าหน้าที่เขต', center:'ผู้อำนวยการศูนย์รับเรื่องร้องเรียน', division:'ผู้อำนวยการกองบริหารคดี', acting:'ผู้รักษาราชการแทนตามคำสั่ง', anonymous:'กล่องบัตรสนเท่ห์', activity7:'กิจกรรมที่ 7' };
  const ANONYMOUS_CHAIN_STEPS = ['หัวหน้าพนักงานผู้ตรวจเสนอ','หัวหน้าพนักงานผู้ให้ความเห็น','หัวหน้าพนักงานผู้อนุมัติส่งต่อ'];
  const ACTIVITY7_STORAGE_KEY = 'ecmis-a4-a7-handoffs-v1';
  const OFFICERS = ['คุณสุพจน์','คุณนครินทร์','คุณวารี','คุณอาภรณ์','คุณสุธาทิพย์','คุณรัชพล'];
  const REGIONS = ['ส่วนกลาง','เขต 1','เขต 2','เขต 3','เขต 4','เขต 5','เขต 6','เขต 7','เขต 8','เขต 9'];
  const REGIONAL_REGIONS = REGIONS.filter(region=>region!=='ส่วนกลาง');
  const REGIONAL_CHANNELS = ['Walk-In','จดหมาย','เบอร์โทร ปปท. เขต 1-9'];
  const isOfficerRole = role => ['officer','regional-officer'].includes(role);
  const channelKey = channel => String(channel||'').toLowerCase().replace(/[-\s]/g,'');
  const isRegionalChannel = channel => ['walkin','จดหมาย',channelKey('เบอร์โทร ปปท. เขต 1-9')].includes(channelKey(channel));
  const NACC_TRANSFER_REASONS = [
    'เจ้าหน้าที่ของรัฐอยู่ในอำนาจหน้าที่ของคณะกรรมการ ป.ป.ช.',
    'ร้องเรียนความผิดตาม พ.ร.บ. ว่าด้วยความผิดเกี่ยวกับการเสนอราคาต่อหน่วยงานของรัฐ',
    'ร้องเรียนพฤติการณ์ร่ำรวยผิดปกติ',
    'เรื่องทรัพยากรธรรมชาติ',
    'เรื่องความมั่นคงชาติ',
    'กรณีความผิดข้ามชาติ',
    'จัดซื้อจัดจ้างเกิน 2 ล้านบาท',
    'กรณีไม่เกี่ยวกับสัมปทานโดยรัฐ'
  ];
  const DEFAULT_SUGGESTIONS = {
    keywords:['โปรดตรวจสอบข้อเท็จจริงเพิ่มเติม','พบข้อมูลที่ควรตรวจสอบความเชื่อมโยง','เอกสารประกอบยังไม่ครบถ้วน','เสนอให้ตรวจสอบอำนาจหน้าที่ของหน่วยงาน'],
    notAcceptReasons:['ข้อเท็จจริงไม่เพียงพอต่อการดำเนินการ','ไม่อยู่ในอำนาจหน้าที่ของสำนักงาน ป.ป.ท.','ไม่ปรากฏพฤติการณ์หรือบุคคลที่เกี่ยวข้องชัดเจน','เรื่องอยู่ระหว่างการพิจารณาของหน่วยงานอื่น','ผู้ร้องถอนเรื่องหรือไม่ประสงค์ดำเนินการต่อ'],
    contexts:{
      adminNote:['มีความเป็นไปได้ว่าเป็นเรื่องเดียวกับเรื่องที่ระบบตรวจพบ','ข้อมูลผู้ร้องและข้อเท็จจริงมีความเชื่อมโยงกับเรื่องเดิม ควรตรวจสอบเพิ่มเติม','ผลตรวจอัตโนมัติพบความใกล้เคียง แต่ยังไม่เพียงพอที่จะสรุปว่าเป็นเรื่องซ้ำ'],
      officerOpinion:['เห็นควรรับไว้ตรวจสอบข้อเท็จจริงเพิ่มเติม','เสนอให้รวบรวมเอกสารและข้อมูลจากหน่วยงานที่เกี่ยวข้อง','ข้อเท็จจริงเบื้องต้นมีประเด็นที่อยู่ในอำนาจดำเนินการ'],
      absenceNote:['ผู้อำนวยการศูนย์รับเรื่องร้องเรียน ไม่อยู่ระหว่างวันที่กำหนด จึงเสนอผู้รักษาการพิจารณา','ดำเนินการตามคำสั่งมอบหมายผู้รักษาราชการแทน'],
      centerOpinion:['เห็นชอบตามความเห็นและข้อเสนอของเจ้าหน้าที่รับเรื่อง','ส่งกลับให้ตรวจสอบข้อเท็จจริงและเอกสารเพิ่มเติม','เห็นควรเสนอ ผู้อำนวยการกองบริหารคดี พิจารณาต่อไป','เพิ่มเติมข้อเท็จจริงประกอบการพิจารณา โดยไม่แก้ไขคำร้องเดิม'],
      divisionOpinion:['อนุมัติตามความเห็นและข้อเสนอ','ให้ตรวจสอบข้อเท็จจริงเพิ่มเติมก่อนเสนอใหม่','ขอความเห็น ผู้อำนวยการศูนย์รับเรื่องร้องเรียน เพิ่มเติมประกอบการพิจารณา','เพิ่มเติมประเด็นประกอบคำสั่ง โดยไม่แก้ไขคำร้องเดิม'],
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
    {id:'ECMIS-2569-000184',trackingYear:'690001',trackingCode:'5424',assignedOfficer:'คุณสุพจน์',anonymousDetected:false,confidentialityRequested:false,complainant:'นายสมชาย ใจดี',citizenId:'1-1001-00123-45-6',id4:'1234',phone:'0812341234',email:'somchai.jaidee@gmail.com',address:'123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',citizenId:'1-1001-00123-45-6',subject:'ร้องเรียนการจัดซื้อวัสดุสำนักงานไม่เป็นไปตามระเบียบ',agency:'สำนักงานจัดการทรัพย์สินภาครัฐ',channel:'Website',province:'กรุงเทพมหานคร',region:'ส่วนกลาง',registry:{kbk:'0101/2569',srr:'0102/2569'},received:'3 สิงหาคม 2569 09:10 น.',type:'การจัดซื้อจัดจ้าง',place:'สำนักงานจัดการทรัพย์สินภาครัฐ กรุงเทพมหานคร',detail:'ผู้ถูกร้องมีพฤติการณ์จัดซื้อวัสดุสำนักงานโดยไม่ปฏิบัติตามระเบียบและอาจเอื้อประโยชน์แก่ผู้เสนอราคารายหนึ่ง',damage:'เกิดความเสียหายต่องบประมาณของหน่วยงาน',request:'ขอให้ตรวจสอบกระบวนการจัดซื้อและผู้เกี่ยวข้อง',attachments:[{name:'ใบเสนอราคา.pdf',type:'PDF',pages:2,size:'245 KB',desc:'ใบเสนอราคาจากผู้เสนอราคา 1 ราย'},{name:'สำเนาประกาศจัดซื้อ.pdf',type:'PDF',pages:3,size:'890 KB',desc:'ประกาศจัดซื้อวัสดุสำนักงาน ประจำปีงบประมาณ 2569'},{name:'ภาพถ่ายเอกสาร.jpg',type:'ภาพถ่าย',pages:1,size:'1.2 MB',desc:'ภาพถ่ายเอกสารการจัดซื้อและตู้ปิดประกาศ'}]},
    {id:'ECMIS-2569-000183',trackingYear:'690002',trackingCode:'8292',assignedOfficer:'คุณนครินทร์',complainant:'นางสาวรัตนา แสงทอง',id4:'7812',citizenId:'1-2001-00456-78-1',phone:'0867897812',email:'rattana.sangthong@hotmail.com',address:'88/12 หมู่ 3 ตำบลแสนสุข อำเภอเมืองชลบุรี จังหวัดชลบุรี 20000',subject:'ร้องเรียนการใช้อำนาจโดยมิชอบของเจ้าหน้าที่',agency:'องค์การบริหารส่วนตำบลตัวอย่าง',channel:'สายด่วน 1206',province:'ชลบุรี',region:'เขต 2',registry:{srr:'0103/2569'},received:'3 สิงหาคม 2569 08:45 น.',type:'ใช้อำนาจโดยมิชอบ',place:'จังหวัดชลบุรี',detail:'เจ้าหน้าที่เรียกรับผลประโยชน์จากประชาชน',damage:'ประชาชนได้รับความเดือดร้อน',request:'ขอให้ตรวจสอบข้อเท็จจริง',attachments:[]},
    {id:'ECMIS-2569-000182',trackingYear:'690003',trackingCode:'8367',assignedOfficer:'คุณวารี',anonymousDetected:false,confidentialityRequested:true,complainant:'ขอปกปิดข้อมูล',id4:'4456',subject:'ขอให้ตรวจสอบการเบิกจ่ายงบประมาณโครงการ',agency:'สำนักงานจังหวัดตัวอย่าง',channel:'หนังสือราชการ',province:'นครราชสีมา',region:'เขต 3',registry:{srr:'0104/2569'},received:'2 สิงหาคม 2569 15:20 น.',type:'เบิกจ่ายงบประมาณ',place:'จังหวัดนครราชสีมา',detail:'พบความผิดปกติในการเบิกจ่าย',damage:'งบประมาณอาจเสียหาย',request:'ขอให้ตรวจสอบ',attachments:[{name:'เอกสารประกอบ.pdf',type:'PDF',pages:2,size:'410 KB',desc:'เอกสารประกอบคำร้อง (ผู้ร้องขอปกปิดข้อมูล)'}]},
    {id:'ECMIS-2569-000181',trackingYear:'690004',trackingCode:'7049',assignedOfficer:'คุณอาภรณ์',anonymousDetected:false,confidentialityRequested:false,complainant:'นายวิชัย กล้าหาญ',id4:'9090',citizenId:'1-3001-00909-01-3',phone:'0894569090',email:'wichai.kla@yahoo.com',address:'45/6 หมู่ 7 ตำบลในเมือง อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000',subject:'ร้องเรียนการเรียกรับผลประโยชน์',agency:'เทศบาลเมืองตัวอย่าง',channel:'Walk-in',province:'ขอนแก่น',region:'เขต 4',registry:{srr:'0105/2569'},received:'2 สิงหาคม 2569 13:05 น.',type:'เรียกรับผลประโยชน์',place:'จังหวัดขอนแก่น',detail:'เจ้าหน้าที่เรียกรับเงินเพื่อแลกกับการอนุมัติ',damage:'ผู้ร้องเสียประโยชน์',request:'ขอให้ดำเนินการตามกฎหมาย',attachments:[]},
    {id:'ECMIS-2569-000180',trackingYear:'690005',trackingCode:'3198',assignedOfficer:'คุณสุธาทิพย์',anonymousDetected:true,confidentialityRequested:false,complainant:'ไม่ระบุข้อมูลผู้ร้อง',id4:'',subject:'แจ้งเบาะแสการเรียกรับผลประโยชน์ในการอนุมัติใบอนุญาต',agency:'หน่วยงานท้องถิ่นตัวอย่าง',channel:'Website',province:'นนทบุรี',region:'ส่วนกลาง',registry:{kbk:'0106/2569',srr:'0107/2569'},received:'2 สิงหาคม 2569 11:20 น.',type:'เรียกรับผลประโยชน์',place:'จังหวัดนนทบุรี',detail:'ผู้ร้องแจ้งพฤติการณ์โดยไม่ระบุข้อมูลส่วนตัว',damage:'ประชาชนอาจได้รับความเสียหาย',request:'ขอให้ตรวจสอบข้อเท็จจริง',attachments:[{name:'หลักฐานประกอบ.pdf',type:'PDF',pages:1,size:'320 KB',desc:'หลักฐานประกอบการแจ้งเบาะแส'}]}
  ];
  const DUPLICATE_REFERENCE_CASES = [{id:'ECMIS-2569-000127',trackingYear:'690008',trackingCode:'7731',registry:{srr:'0088/2569'},complainant:'นายสมชาย ใจดี',citizenId:'1-1001-00123-45-6',id4:'1234',subject:'ขอให้ตรวจสอบการจัดซื้อวัสดุสำนักงานที่ไม่เป็นไปตามระเบียบ',agency:'สำนักงานจัดการทรัพย์สินภาครัฐ',province:'กรุงเทพมหานคร',place:'สำนักงานจัดการทรัพย์สินภาครัฐ กรุงเทพมหานคร',received:'2 สิงหาคม 2569 15:20 น.',detail:'พบการจัดซื้อวัสดุสำนักงานไม่เป็นไปตามระเบียบและมีพฤติการณ์เอื้อประโยชน์แก่ผู้เสนอราคา'}];
  const THAI_MONTHS={มกราคม:0,กุมภาพันธ์:1,มีนาคม:2,เมษายน:3,พฤษภาคม:4,มิถุนายน:5,กรกฎาคม:6,สิงหาคม:7,กันยายน:8,ตุลาคม:9,พฤศจิกายน:10,ธันวาคม:11,'ม.ค.':0,'ก.พ.':1,'มี.ค.':2,'เม.ย.':3,'พ.ค.':4,'มิ.ย.':5,'ก.ค.':6,'ส.ค.':7,'ก.ย.':8,'ต.ค.':9,'พ.ย.':10,'ธ.ค.':11};
  function normalizeComparable(value=''){return String(value).toLowerCase().replace(/[^\p{L}\p{N}]/gu,'')}
  function formatInternalReceiptNumber(value=''){
    const text=String(value||'').trim().replace(/\s+/g,'');
    if(/^\d{6}$/.test(text))return text;
    const match=text.match(/^(?:ECMIS-)?(\d{4})-(\d{1,6})$/i);
    return match?`${match[1].slice(-2)}${match[2].slice(-4).padStart(4,'0')}`:text;
  }
  function registryPlan(channel,region){
    const ch=String(channel||'').toLowerCase();
    const central=!String(region||'').includes('เขต');
    if(ch.includes('walk'))return central?['kbk','srr']:['srr'];
    if(ch.includes('1206'))return ['srr'];
    if(ch.includes('โทร'))return [];
    if(ch.includes('จดหมาย'))return central?['office','kbk','srr']:['srr'];
    if(ch.includes('หนังสือจากหน่วยงาน'))return ['kbk','srr'];
    if(ch.includes('62'))return ['office','kbk','srr'];
    if(ch.includes('หนังสือ'))return central?['office','kbk','srr']:['srr'];
    return ['kbk','srr'];
  }
  function nextRegistryNumber(regKey){
    const year=new Date().getFullYear()+543;
    const key=`ecmis-reg-${regKey}-${year}`;
    const next=(Number(localStorage.getItem(key))||0)+1;
    localStorage.setItem(key,String(next));
    return `${String(next).padStart(4,'0')}/${year}`;
  }
  function issueRegistry(channel,region){
    const reg={};
    const plan=registryPlan(channel,region);
    if(plan.includes('kbk'))reg.kbk=nextRegistryNumber('kbk');
    if(plan.includes('srr'))reg.srr=nextRegistryNumber('srr');
    return reg;
  }
  function registryReceiptNumber(c){const r=c.registry||{};return r.srr||r.kbk||r.office||''}
  function caseDisplayId(c){if(!c)return '';return registryReceiptNumber(c)||c.trackingYear||c.id||''}
  function normalizeCitizenId(value=''){return String(value).replace(/\D/g,'')}
  function isValidThaiCitizenId(value=''){
    const digits=normalizeCitizenId(value);if(!/^\d{13}$/.test(digits))return false;
    let sum=0;for(let index=0;index<12;index++)sum+=Number(digits[index])*(13-index);
    return (11-(sum%11))%10===Number(digits[12]);
  }
  function textSimilarity(left='',right=''){
    const a=normalizeComparable(left),b=normalizeComparable(right);
    if(!a||!b)return 0;if(a===b)return 1;
    const pairs=value=>{const result=[];for(let i=0;i<value.length-1;i++)result.push(value.slice(i,i+2));return result};
    const aPairs=pairs(a),bPairs=pairs(b),counts=new Map();aPairs.forEach(pair=>counts.set(pair,(counts.get(pair)||0)+1));
    let overlap=0;bPairs.forEach(pair=>{const count=counts.get(pair)||0;if(count){overlap++;counts.set(pair,count-1)}});
    return (2*overlap)/(aPairs.length+bPairs.length);
  }
  function parseThaiReceived(value=''){
    const match=String(value).match(/(\d{1,2})\s+([^\s]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if(!match||THAI_MONTHS[match[2]]===undefined)return null;
    return new Date(Number(match[3])-543,THAI_MONTHS[match[2]],Number(match[1]),Number(match[4]||0),Number(match[5]||0)).getTime();
  }
  function analyzeDuplicateCase(caseData,candidates=null){
    const storedCases=Object.values(readStore()).map(state=>state?.caseData).filter(Boolean);
    const pool=[...new Map((candidates||[...DUPLICATE_REFERENCE_CASES,...CASES,...storedCases]).map(candidate=>[candidate.id,candidate])).values()];
    const ranked=pool.filter(candidate=>candidate.id!==caseData.id).map(candidate=>{
      let score=0;const signals=[];
      const citizen=normalizeCitizenId(caseData.citizenId),candidateCitizen=normalizeCitizenId(candidate.citizenId);
      if((citizen&&candidateCitizen&&citizen===candidateCitizen)||(!citizen&&!candidateCitizen&&caseData.id4&&caseData.id4===candidate.id4)){score+=35;signals.push('เลขประจำตัวประชาชนตรงกัน')}
      if(normalizeComparable(caseData.complainant)&&normalizeComparable(caseData.complainant)===normalizeComparable(candidate.complainant)){score+=10;signals.push('ผู้ร้องเป็นบุคคลเดียวกัน')}
      if(normalizeComparable(caseData.agency)&&normalizeComparable(caseData.agency)===normalizeComparable(candidate.agency)){score+=10;signals.push('ผู้ถูกร้องหรือหน่วยงานตรงกัน')}
      const samePerson=(citizen&&candidateCitizen&&citizen===candidateCitizen)||(!citizen&&!candidateCitizen&&caseData.id4&&caseData.id4===candidate.id4)||(normalizeComparable(caseData.complainant)&&normalizeComparable(caseData.complainant)===normalizeComparable(candidate.complainant));
      if(!samePerson&&normalizeComparable(caseData.agency)&&normalizeComparable(caseData.agency)===normalizeComparable(candidate.agency)){score+=6;signals.push('มีผู้ร้องรายอื่นร้องเรียนหน่วยงาน/เรื่องเดียวกัน — แนวปฏิบัติปกติ: แยกกันดำเนินการ')}
      const narrativeSimilarity=textSimilarity(`${caseData.subject||''} ${caseData.detail||''}`,`${candidate.subject||''} ${candidate.detail||''}`);
      const narrativeScore=Math.round(narrativeSimilarity*25);score+=narrativeScore;if(narrativeScore>=12)signals.push(`เนื้อหาใกล้เคียง ${Math.round(narrativeSimilarity*100)}%`);
      const sameProvince=normalizeComparable(caseData.province)&&normalizeComparable(caseData.province)===normalizeComparable(candidate.province);
      const placeSimilarity=textSimilarity(caseData.place,candidate.place);
      if(sameProvince||placeSimilarity>=.7){score+=10;signals.push('พื้นที่เกิดเหตุสัมพันธ์กัน')}
      const received=parseThaiReceived(caseData.received),candidateReceived=parseThaiReceived(candidate.received);
      if(received&&candidateReceived){const hours=Math.abs(received-candidateReceived)/36e5;if(hours<=24){score+=10;signals.push('รับเรื่องภายในช่วงเวลา 24 ชั่วโมง')}else if(hours<=168){score+=6;signals.push('รับเรื่องภายในช่วงเวลา 7 วัน')}else if(hours<=720){score+=3;signals.push('รับเรื่องภายในช่วงเวลา 30 วัน')}}
      return {caseId:candidate.id,score:Math.min(100,score),signals};
    }).sort((a,b)=>b.score-a.score);
    const best=ranked[0]||{caseId:'',score:0,signals:[]};
    return {...best,level:best.score>=80?'high':best.score>=55?'review':'low'};
  }
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const escapeHtml = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const now = () => new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short'}).format(new Date());
  function readStore(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
  function writeStore(store){localStorage.setItem(STORAGE_KEY,JSON.stringify(store))}
  function isOfficerScreenedChannel(channel){return ['Walk-In','Walk-in','สายด่วน 1206','เบอร์โทร ป.ป.ท. เขต 1-9'].some(x=>channelKey(channel)===channelKey(x))}
  function trackingLabel(c){return (c.allocationStatus==='pending'||!c.trackingYear)?'รอจัดสรรเลขรับบริการ':`${c.trackingYear} / PIN ${c.trackingCode}`}
  function qrForTracking(trackingYear){
    if(!trackingYear)return '';
    try{const url=new URL(`tracking.html?serviceNumber=${encodeURIComponent(trackingYear)}`,location.href).href;const q=qrcode(0,'M');q.addData(url);q.make();return q.createDataURL(5,8)}catch{return ''}
  }
  function findOriginalCase(linkedCaseId){
    if(!linkedCaseId)return null;
    const stored=readStore()[linkedCaseId];
    if(stored?.caseData)return stored;
    const seed=CASES.find(c=>c.id===linkedCaseId)||DUPLICATE_REFERENCE_CASES.find(c=>c.id===linkedCaseId);
    return seed?initialState(seed):null;
  }
  function duplicateCandidateOptions(state){
    const pool=Object.values(readStore()).map(s=>s?.caseData).filter(Boolean);
    const all=[...pool,...CASES,...DUPLICATE_REFERENCE_CASES].filter(c=>c.id!==state.caseData.id);
    return [...new Map(all.map(c=>[c.id,c])).values()];
  }
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
      [/ผอ\.?\s*ศรร\.?/g,'ผู้อำนวยการศูนย์รับเรื่องร้องเรียน'],[/ผอ\.?\s*กบค\.?/g,'ผู้อำนวยการกองบริหารคดี'],[/ป\.?ป\.?ช\.?/g,'ป.ป.ช.'],[/ป\.?ป\.?ท\.?/g,'ป.ป.ท.'],
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
  const DOCUMENT_SOURCE_VERSION='official-forms-1-01-to-1-14-v2';
  const ALL_DOCUMENTS_ID='all-documents';
  const REVIEW_RECORD_ID='pcms-review-record';
  const REVIEW_RECORD_NAME='แบบบันทึกการพิจารณาและกลั่นกรองเรื่องร้องเรียน/เบาะแส';
  const OFFICIAL_DOCUMENTS={
    [REVIEW_RECORD_ID]:{name:REVIEW_RECORD_NAME,pages:1,register:'none'},
    '1-01':{name:'แบบปกสำนวนการไต่สวน (สีฟ้า)',pages:1,register:'case'},
    '1-02':{name:'แบบแจ้งการร้องเรียน/เบาะแส',pages:2,register:'none'},
    '1-03':{name:'แบบบันทึกการตรวจสอบเรื่องร้องเรียน',pages:2,register:'srr'},
    '1-04':{name:'แบบบันทึกส่งเรื่องร้องเรียนให้หน่วยงานดำเนินการตามอำนาจหน้าที่ กรณีประพฤติมิชอบ ตามมาตรา 18/4',pages:1,register:'case-admin'},
    '1-05':{name:'แบบบันทึกส่งเรื่องร้องเรียนให้หน่วยงานดำเนินการตามหน้าที่ ตามมาตรา 62',pages:1,register:'case-admin'},
    '1-06':{name:'แบบหนังสือแจ้งผู้ร้องเรียน กรณีรับไว้ดำเนินการ ตามมาตรา 18/4',pages:1,register:'case-admin'},
    '1-07':{name:'แบบหนังสือแจ้งผู้ร้องเรียน กรณีสำนักงาน ป.ป.ช. ส่งเรื่องให้สำนักงาน ป.ป.ท. ดำเนินการตามมาตรา 62',pages:1,register:'pb'},
    '1-08':{name:'แบบหนังสือแจ้งสำนักงาน ป.ป.ช. กรณีรับไว้ดำเนินการตามมาตรา 62',pages:1,register:'pending'},
    '1-09':{name:'แบบหนังสือส่งเรื่องร้องเรียนคืนคณะกรรมการ ป.ป.ช. กรณีอายุความไม่ถึง 6 เดือน ตามมาตรา 18/1 (ข) (3)',pages:1,register:'case-admin'},
    '1-10':{name:'แบบบันทึกเสนอส่งเรื่องร้องเรียนให้สำนักงาน ป.ป.ช. กรณีสำนักงาน ป.ป.ท. รับเรื่องเอง',pages:1,register:'pending'},
    '1-11':{name:'แบบหนังสือส่งเรื่องร้องเรียนให้สำนักงาน ป.ป.ช. กรณีสำนักงาน ป.ป.ท. รับเรื่องเอง',pages:1,register:'pending'},
    '1-12':{name:'แบบบัญชีส่งเรื่องร้องเรียนให้สำนักงาน ป.ป.ช. ดำเนินการ กรณีสำนักงาน ป.ป.ท. รับเรื่องเอง',pages:1,register:'reference-1-11'},
    '1-13':{name:'แบบบันทึกเสนอส่งเรื่องแจ้งให้ผู้ร้องเรียนทราบ กรณีส่งให้สำนักงาน ป.ป.ช. ดำเนินการ',pages:1,register:'case-admin'},
    '1-14':{name:'แบบหนังสือแจ้งให้ผู้ร้องเรียนทราบผลการดำเนินการ กรณีส่งให้สำนักงาน ป.ป.ช. ดำเนินการ',pages:1,register:'pending'}
  };
  function initialState(item){return {caseData:{...item},documentData:{decision:'18/1ก',reasons:[],naccOtherChecked:false,naccOtherReason:'',anonymous:Boolean(item.anonymousDetected??item.anonymous),documentSubject:item.subject||'',assignedOfficer:item.assignedOfficer||'',officerOpinion:'',proposedRegion:item.region||'',reviewRoute:'center',centerDecision:'',centerOpinion:'',documentPack:{caseType:'18/1ก',sourceVersion:DOCUMENT_SOURCE_VERSION,pages:{complainant:10,'1-03':2},steps:{}},officerSignature:{signed:false,signerName:'',signerRole:'เจ้าหน้าที่รับเรื่อง',signedAt:'',signatureId:''},centerSignature:{signed:false,signerName:'',signerRole:'ผู้อำนวยการศูนย์รับเรื่องร้องเรียน',signedAt:'',signatureId:''},divisionOpinion:'',divisionSignature:{signed:false,signerName:'',signerRole:'ผู้อำนวยการกองบริหารคดี',signedAt:'',signatureId:''},outgoingRegisters:{srr:{number:'',date:''},caseAdmin:{number:'',date:''}},internalLetterNo:'',internalLetterDate:'',caseNumber:'',caseNumberIssuedAt:'',caseNumberIssuedBy:'',publicStatus:'',approvedAt:'',approvedBy:'',actingOfficer:'',actingOrder:'',assignedOfficer:'',backupOfficer:'',previousOfficer:'',previousBackupOfficer:'',adminNote:'',screening:{decision:'',decidedAt:'',decidedBy:'',linkedCaseId:'',linkedTracking:'',note:'',additionalInfo:'',reportedToSupervisor:null},absenceReasonType:'',absenceNote:'',notAcceptReason:'',notAcceptOtherChecked:false,notAcceptOtherReason:'',dispatchLetterNo:'',dispatchLetterDate:'',dispatchSendMethod:'EMS',dispatchEms:'',dispatchSentDate:'',dispatchProofName:'',dispatchDestinationUnit:item.region||'',dispatchNote:'',dispatchConfirmedAt:'',naccLetterNo:'',naccLetterDate:'',naccSendMethod:'EMS',naccEms:'',naccSentDate:'',naccBoardNo:'',naccBoardDate:'',naccBoardNote:'',naccProofName:'',naccNotified:true},workflow:{owner:'admin',stage:'admin',status:'รอลงรับและมอบหมาย',complete:false},assignmentHistory:[],decisionHistory:[],anonymousHistory:[],documentVersions:[]}}
  function currentCaseSequence(buddhistYear){
    const key=`ecmis-a4-case-sequence-${buddhistYear}`;
    const storedSequence=Number(localStorage.getItem(key)||0);
    const stateSequences=Object.values(readStore()).map(state=>String(state?.documentData?.caseNumber||'').match(/^(\d{4})\/(\d{4})$/)).filter(match=>match&&Number(match[2])===buddhistYear).map(match=>Number(match[1]));
    return Math.max(0,storedSequence,...stateSequences);
  }
  function formatCaseSequence(sequence,buddhistYear){return `${String(sequence).padStart(4,'0')}/${buddhistYear}`}
  function issueCaseNumber(state){
    if(state.documentData.caseNumber)return state.documentData.caseNumber;
    const buddhistYear=new Date().getFullYear()+543;
    const key=`ecmis-a4-case-sequence-${buddhistYear}`;
    const next=currentCaseSequence(buddhistYear)+1;
    localStorage.setItem(key,String(next));
    state.documentData.caseNumber=formatCaseSequence(next,buddhistYear);
    state.documentData.caseNumberIssuedAt=new Date().toISOString();
    state.documentData.caseNumberIssuedBy=state.documentData.divisionSignature?.signerName||state.documentData.approvedBy||'ผู้อำนวยการกองบริหารคดี';
    return state.documentData.caseNumber;
  }
  function signatureRecord(role,signerName){
    const signedAt=new Date().toISOString();
    const signatureId=`SIG-${signedAt.replace(/\D/g,'').slice(0,14)}-${Math.random().toString(16).slice(2,10).toUpperCase()}`;
    return {signed:true,signerName,signerRole:role,signedAt,signatureId};
  }
  function confirmSignature(state,signerName,signerRole){
    const caseNo=registryReceiptNumber(state.caseData)||'....................';
    const subject=state.documentData.documentSubject||state.caseData.subject||'-';
    const documentName='แบบบันทึกการพิจารณาและกลั่นกรองเรื่องร้องเรียน/เบาะแส';
    const signatureType=signerRole.includes('ศูนย์รับเรื่องร้องเรียน')?'center':signerRole.includes('กองบริหารคดี')||signerRole.includes('รักษาราชการแทน')?'division':'officer';
    if(!window.Swal){
      return Promise.resolve({isConfirmed:confirm(`ยืนยันการลงนามเอกสาร\nผู้ลงนาม: ${signerName}\nหน้าที่: ${signerRole}\nเลขรับเรื่อง: ${caseNo}\nเอกสาร: ${documentName}`)});
    }
    return Swal.fire({
      title:'ยืนยันการลงนามอิเล็กทรอนิกส์',
      html:`<div class="signature-confirm-summary">
        <div class="signature-confirm-intro">
          <span class="signature-confirm-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 5.5 5.7v5.8c0 4.2 2.7 7.9 6.5 9.5 3.8-1.6 6.5-5.3 6.5-9.5V5.7L12 3Z"/><path d="m8.8 12.1 2 2 4.5-4.6"/></svg></span>
          <div><strong>ตรวจสอบรายละเอียดเอกสารก่อนลงนาม</strong><span>การลงนามมีผลผูกพันกับบัญชีผู้ใช้งานและจะถูกบันทึกในประวัติเอกสาร</span></div>
        </div>
        <dl aria-label="ข้อมูลเอกสารที่ลงนาม">
          <div><dt>ผู้ลงนาม</dt><dd>${escapeHtml(signerName)}</dd></div>
          <div><dt>ตำแหน่ง</dt><dd>${escapeHtml(signerRole)}</dd></div>
          <div><dt>เลขรับเรื่อง</dt><dd>${escapeHtml(caseNo)}</dd></div>
          <div><dt>ชื่อเอกสาร</dt><dd>${escapeHtml(documentName)}</dd></div>
          <div class="wide"><dt>เรื่อง</dt><dd>${escapeHtml(subject)}</dd></div>
        </dl>
        <div class="signature-confirm-preview"><span>ภาพลายมือชื่อที่จะบันทึกในเอกสาร</span>${signatureImage(signatureType,'dialog')}</div>
        <label class="signature-attestation" for="ecmisSignatureAttestation">
          <input id="ecmisSignatureAttestation" type="checkbox">
          <span><strong>คำรับรองของผู้ลงนาม</strong><small>ข้าพเจ้าได้ตรวจสอบความถูกต้องและความครบถ้วนของเอกสารฉบับนี้แล้ว และยืนยันลงนามด้วยบัญชีผู้ใช้งานของข้าพเจ้า</small></span>
        </label>
        <div class="signature-audit-note"><strong>การบันทึกหลักฐาน</strong><span>ระบบจะบันทึกภาพลายมือชื่อ ชื่อผู้ลงนาม และวันเวลาไว้ในประวัติเอกสารเพื่อการตรวจสอบ</span></div>
      </div>`,
      showCancelButton:true,
      showCloseButton:true,
      confirmButtonText:'ยืนยันและลงนาม',
      cancelButtonText:'ยกเลิก',
      confirmButtonColor:'#082b50',
      cancelButtonColor:'#eef2f5',
      reverseButtons:true,
      focusCancel:true,
      allowOutsideClick:false,
      customClass:{popup:'ecmis-signature-dialog',confirmButton:'ecmis-signature-confirm',cancelButton:'ecmis-signature-cancel'},
      preConfirm:()=>{
        const accepted=document.getElementById('ecmisSignatureAttestation')?.checked;
        if(!accepted){Swal.showValidationMessage('กรุณารับรองว่าได้ตรวจสอบข้อมูลก่อนลงนาม');return false}
        return true;
      }
    });
  }
  const SIGNATURE_IMAGE_BY_ROLE={
    officer:'assets/signatures/officer-demo.svg',
    center:'assets/signatures/director-center-demo.png',
    division:'assets/signatures/director-division-demo.png'
  };
  function signatureImage(type,context='card'){
    const src=SIGNATURE_IMAGE_BY_ROLE[type];
    return src?`<span class="signature-image-wrap ${context}"><img class="signature-image" src="${src}" alt="ลายมือชื่ออิเล็กทรอนิกส์ตัวอย่าง"><em>ลายมือชื่อตัวอย่าง</em></span>`:'';
  }
  function assignedOfficerName(documentData){
    return documentData.assignedOfficer||documentData.officerSignature?.signerName||'เจ้าหน้าที่รับเรื่อง';
  }
  function signatureCard(state,type,roleContext){
    const d=state.documentData,isCenter=type==='center',isOfficer=type==='officer',signature=isCenter?d.centerSignature:isOfficer?d.officerSignature:d.divisionSignature;
    const role=isCenter?'ผู้อำนวยการศูนย์รับเรื่องร้องเรียน':isOfficer?'เจ้าหน้าที่รับเรื่อง':(roleContext==='acting'?(d.actingOfficer||'ผู้รักษาราชการแทน'):'ผู้อำนวยการกองบริหารคดี');
    const action=isCenter?'center-sign':isOfficer?'officer-sign':'division-sign';
    const proof=signature?.signed
      ?`<div class="signature-proof signature-proof-signed">${signatureImage(isOfficer?'officer':isCenter?'center':'division')}</div>`
      :`<div class="signature-pending"><span>ผู้มีหน้าที่ลงนาม</span><strong>${escapeHtml(role)}</strong><small>แบบบันทึกการพิจารณาและกลั่นกรองเรื่องร้องเรียน/เบาะแส</small></div><button type="button" class="ws-button primary" data-action="${action}">ลงนามเอกสาร</button>`;
    return `<section class="signature-workflow"><header><div><span>การลงนามเอกสารอิเล็กทรอนิกส์</span><h3>${escapeHtml(role)}</h3></div><b class="${signature?.signed?'signed':''}">${signature?.signed?'ลงนามแล้ว':'รอการลงนาม'}</b></header><div class="signature-workflow-body">${proof}</div></section>`;
  }
  function packCaseTypeOf(state){
    const d=state.documentData;
    if(d.decision==='18/1ข')return '18/1ข';
    if(d.decision==='18/4')return '18/4';
    if(d.decision==='62')return '62';
    if(d.decision==='58/2')return '582';
    if(d.decision==='send-nacc')return 'send-nacc';
    if(d.decision==='not-accept')return d.anonymous?'anon':'not-accept';
    return '18/1ก';
  }
  function usesForm102(channel){const ch=String(channel||'').toLowerCase();return /walk|1206|โทร/.test(ch)}
  function officialDocumentIds(state){
    const caseType=packCaseTypeOf(state);
    const anonymous=Boolean(state.documentData.anonymous);
    const ids=usesForm102(state.caseData.channel)?['1-02']:[];
    if(['18/1ก','18/1ข','18/4'].includes(caseType))ids.unshift('1-01');
    if(['18/1ก','18/1ข','18/4','62'].includes(caseType))ids.push('1-03');
    if(caseType==='18/1ข'&&(state.documentData.decisionSubcase==='18/1ข(3)'||state.documentData.underSixMonths))ids.push('1-09');
    if(caseType==='18/4'){
      ids.push('1-04');
      if(!anonymous)ids.push('1-06');
    }
    if(caseType==='62'){
      ids.push('1-05','1-08');
      if(!anonymous)ids.push('1-07');
    }
    if(caseType==='send-nacc'){
      ids.push('1-10','1-11','1-12','1-13');
      if(!anonymous)ids.push('1-14');
    }
    return ids;
  }
  const OUTGOING_META={'srr':{label:'ปป 0004.2'},'kbk':{label:'ปป 0004'},'pb':{label:'ปบ 0004'}};
  function outgoingSeriesOf(docId){const r=(OFFICIAL_DOCUMENTS[docId]||{}).register;if(r==='srr')return 'srr';if(r==='case-admin')return 'kbk';if(r==='pb')return 'pb';return null;}
  function currentOutgoingSequence(series,year){
    const meta=OUTGOING_META[series];if(!meta)return 0;
    let stored=0;try{stored=Number(localStorage.getItem(`ecmis-out-${series}-${year}`))||0}catch{}
    const seqs=Object.values(readStore()).map(s=>{const v=(s?.documentData?.outgoingNumbers||{})[series];return v?Number(String(v).match(/(\d{4})$/)?.[1]||0):0}).filter(Boolean);
    return Math.max(0,stored,...seqs);
  }
  function nextOutgoingNumber(series){
    const meta=OUTGOING_META[series];if(!meta)return '';
    const year=new Date().getFullYear()+543;
    const next=currentOutgoingSequence(series,year)+1;
    try{localStorage.setItem(`ecmis-out-${series}-${year}`,String(next))}catch{}
    return `${meta.label}/${String(next).padStart(4,'0')}`;
  }
  function issueOutgoingNumbers(state){
    const d=state.documentData;d.outgoingNumbers=d.outgoingNumbers||{};
    officialDocumentIds(state).forEach(id=>{const series=outgoingSeriesOf(id);if(series&&!d.outgoingNumbers[id])d.outgoingNumbers[id]=nextOutgoingNumber(series)});
  }
  function outgoingAt(state,id){return (state.documentData.outgoingNumbers||{})[id]||'';}
  function documentRegisterLabel(doc){
    if(doc.register==='case')return 'ใช้เลขสำนวนซึ่งออกหลัง ผู้อำนวยการกองบริหารคดี ลงนามอนุมัติ';
    if(doc.register==='srr')return 'เลขหนังสือขาออก ศรร. รูปแบบ ปป 0004.2/[running]';
    if(doc.register==='case-admin')return 'เลขหนังสือขาออก กบค. รูปแบบ ปป 0004/[running]';
    if(doc.register==='pb')return 'เลขหนังสือรูปแบบ ปบ 0004/[running]';
    if(doc.register==='reference-1-11')return 'อ้างอิงเลขหนังสือหลักจากแบบ 1-11';
    if(doc.register==='pending')return 'รอยืนยันเจ้าของทะเบียนเลขหนังสือ';
    return 'ไม่ใช้เลขหนังสือขาออก';
  }
  function packTotal(state){
    const pack=state.documentData.documentPack||{pages:{}},pages=pack.pages||{};
    const generated=officialDocumentIds(state).filter(id=>id!=='1-01'&&id!=='1-02').reduce((sum,id)=>sum+(Number(pages[id])||OFFICIAL_DOCUMENTS[id]?.pages||0),0);
    return Math.max((Number(pages.complainant)||0)+generated-1,0);
  }
  function todayTH(){return new Date().toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'})}
  function documentPackPanel(state){
    const d=state.documentData,pack=d.documentPack||{pages:{complainant:10,'1-03':2}},pages=pack.pages||{};
    const ids=officialDocumentIds(state);
    const stepItem=(no,id)=>{const doc=OFFICIAL_DOCUMENTS[id]||{name:'ปกหน้า (แบบ 1-01)',register:'none'};const isCover=['1-01','back-cover'].includes(id);return `<li class="pack-step"><b class="pack-step-no">${no}</b><div class="pack-step-body"><strong>${id==='back-cover'?'':'ปปท. '+id+' '}${escapeHtml(doc.name)}</strong><small>${isCover?'แบบพิมพ์จริงไม่มีปกหลัง — ชุดเอกสารมีเพียงปกหน้า (แบบ 1-01)':escapeHtml(documentRegisterLabel(doc))}</small></div><button type="button" class="pack-open" data-doc-open="${id}">เปิดเอกสาร</button><span class="pack-badge ${isCover?'muted':''}">${isCover?'ไม่นับหน้า':`${doc.pages} หน้า`}</span></li>`};
    const hint=(strong,body)=>`<span class="complaint-hint"><button type="button" aria-label="ดูคำแนะนำ">?</button><span class="complaint-hint-box" role="tooltip"><strong>${strong}</strong>${body}</span></span>`;
    const countInputs=ids.filter(id=>id!=='1-01'&&id!=='1-02').map((id,index)=>`<div class="pack-count-row"><span class="pack-count-no">${index+2}</span><span class="pack-count-name" title="${escapeHtml(OFFICIAL_DOCUMENTS[id].name)}">ปปท. ${id} ${escapeHtml(OFFICIAL_DOCUMENTS[id].name)}</span><input type="number" min="0" value="${Number(pages[id])||OFFICIAL_DOCUMENTS[id].pages}" data-pack-page="${id}" aria-label="จำนวนหน้า ปปท. ${id}"></div>`).join('');
    return `<div class="ws-section pack-card"><div class="pack-head"><p class="ws-kicker">เอกสารส่งพิจารณา · เจ้าหน้าที่รับเรื่องเป็นผู้จัดทำ</p><h3>จัดทำและเรียงชุดเอกสาร ${hint('ลำดับการจัดทำ','จัดทำแบบบันทึกการพิจารณาและกลั่นกรองเรื่องร้องเรียน/เบาะแสก่อน จากนั้นจัดทำเอกสารตามผลพิจารณา และเรียงชุดเอกสารตามรายการด้านล่าง')}</h3></div><ol class="pack-steps">${stepItem(1,'back-cover')}${ids.map((id,index)=>stepItem(index+2,id)).join('')}</ol>${usesReviewRecord(state)?`<div class="pack-work-record"><strong>${REVIEW_RECORD_NAME}</strong><small>เอกสารบันทึกผลพิจารณาในระบบ แยกจากแบบ 1-02</small><button type="button" class="pack-open" data-doc-open="${REVIEW_RECORD_ID}">เปิดเอกสาร</button></div>`:''}<div class="pack-count-card"><h4>นับจำนวนหน้า ${hint('นับหน้าไม่รวมตัวเอง และไม่นับปก','เอกสารผู้ร้องและเอกสารแนบ รวมเอกสารตามผลพิจารณา แล้วลบ 1 เพื่อได้เลขหน้าสุดท้าย จากนั้นบวกปกสำนวน 1 แผ่น')}</h4><div class="pack-count-table"><div class="pack-count-row pack-count-head"><span>ลำดับ</span><span>รายการเอกสาร</span><span>หน้า</span></div><div class="pack-count-row"><span class="pack-count-no">1</span><span class="pack-count-name" title="ข้อมูลเรื่องร้องเรียนและเอกสารแนบ">ข้อมูลเรื่องร้องเรียน (${usesForm102(state.caseData.channel)?'แบบ 1-02':'ต้นฉบับ'}) และเอกสารแนบ</span><input id="packComplaintPages" data-pack-page="complainant" type="number" min="0" value="${Number(pages.complainant)||10}" aria-label="จำนวนหน้าข้อมูลเรื่องร้องเรียนและเอกสารแนบ"></div>${countInputs}<div class="pack-count-row pack-count-total-row"><span class="pack-count-no">รวม</span><span class="pack-count-name"></span><strong class="pack-count-total-val" id="packTotalSum">—</strong></div></div><div class="pack-total"><div><span>เลขหน้าสุดท้าย</span><strong id="packTotalPages">—</strong><small>หน้า (ไม่รวมตัวเอง)</small></div><div><span>จำนวนแผ่นรวมปกหน้า</span><strong id="packTotalCover">—</strong><small>แผ่น</small></div></div></div></div>`;
  }
  function updatePackCount(){
    const sum=$$('[data-pack-page]').reduce((sum,input)=>sum+(Number(input.value)||0),0);
    const total=Math.max(sum-1,0);
    const t=$('#packTotalPages'),c=$('#packTotalCover'),s=$('#packTotalSum');
    if(t)t.textContent=total;
    if(c)c.textContent=total+1;
    if(s)s.textContent=sum;
  }
  function caseIssuanceCard(state){
    const d=state.documentData,buddhistYear=new Date().getFullYear()+543,eligible=['18/1ก','18/1ข','18/4'].includes(d.decision);
    if(!eligible)return `<section class="case-issuance neutral"><span>การออกเลขสำนวน</span><strong>กรณีนี้ไม่ออกเลขสำนวน</strong><p>ผลพิจารณา ${escapeHtml(d.decision||'ยังไม่ระบุ')}</p></section>`;
    const latest=currentCaseSequence(buddhistYear),next=latest+1;
    if(d.caseNumber)return `<section class="case-issuance issued"><span>เลขสำนวนที่ออกแล้ว</span><strong>${escapeHtml(d.caseNumber)}</strong><p>เลขล่าสุดของปี ${buddhistYear} · ออกหลัง ${escapeHtml(d.divisionSignature?.signerRole||'ผู้อำนวยการกองบริหารคดี')} ลงนาม</p></section>`;
    return `<section class="case-issuance"><span>ลำดับเลขสำนวน ปี ${buddhistYear}</span><div class="case-sequence-preview"><p><small>เลขล่าสุด</small><strong>${formatCaseSequence(latest,buddhistYear)}</strong></p><p><small>เลขถัดไป</small><strong>${formatCaseSequence(next,buddhistYear)}</strong></p></div><p>เลขถัดไปยังไม่ถูกจอง ระบบจะออกเลขหลัง ผู้อำนวยการกองบริหารคดี ลงนามอนุมัติสำเร็จ</p></section>`;
  }

  function parseThaiDate(text){
    const m=String(text||'').match(/(\d{1,2})\s+([\u0E00-\u0E7F]+)\s+(\d{4})/);
    if(!m)return null;
    const months={มกราคม:1,กุมภาพันธ์:2,มีนาคม:3,เมษายน:4,พฤษภาคม:5,มิถุนายน:6,กรกฎาคม:7,สิงหาคม:8,กันยายน:9,ตุลาคม:10,พฤศจิกายน:11,ธันวาคม:12};
    const mon=months[m[2]];
    if(!mon)return null;
    return new Date(Number(m[3])-543,mon-1,Number(m[1]));
  }
  function prescriptionLevel(days){
    if(days===null)return null;
    if(days<0)return {key:'expired',label:'ขาดอายุความแล้ว',color:'#7a0000'};
    if(days<=90)return {key:'red',label:'เหลือไม่ถึง 3 เดือน',color:'#c0392b'};
    if(days<=180)return {key:'orange',label:'เหลือไม่ถึง 6 เดือน',color:'#d35400'};
    if(days<=365)return {key:'yellow',label:'เหลือไม่ถึง 1 ปี',color:'#b8860b'};
    return {key:'green',label:'เหลือเกิน 1 ปี',color:'#1e7e34'};
  }
  function remainingYMD(expireTs){
    const now=Date.now();
    if(expireTs<=now)return {text:'หมดอายุความแล้ว',days:Math.floor((now-expireTs)/86400000)};
    const days=Math.floor((expireTs-now)/86400000);
    let y=Math.floor(days/365),m=Math.floor((days%365)/30),d=days%30;
    if(m>=12){y+=1;m-=12}
    const parts=[];
    if(y)parts.push(y+' ปี');
    if(m)parts.push(m+' เดือน');
    if(d)parts.push(d+' วัน');
    return {text:parts.length?parts.join(' '):'0 วัน',days};
  }
  function caseAgeCard(state){
    const d=state.documentData;
    if(!d.caseNumber||!d.caseNumberIssuedAt)return '';
    const issued=Date.parse(d.caseNumberIssuedAt);
    if(!issued)return '';
    const ageDays=Math.max(0,Math.floor((Date.now()-issued)/86400000));
    const issuedText=new Date(issued).toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'});
    const base=parseThaiDate(state.caseData&&state.caseData.received)||new Date(issued);
    const expire=base.getTime()+2*365*86400000;
    const remain=remainingYMD(expire);
    const lv=prescriptionLevel(remain.days);
    const badge=lv?`<span class="age-badge" style="background:${lv.color}">${lv.label}</span>`:'<span class="age-badge age-badge-none">ไม่ระบุอายุความ</span>';
    const received=parseThaiDate(state.caseData&&state.caseData.received);
    let r213='';
    if(received){
      const deadline=received.getTime()+60*86400000;
      const left=Math.floor((deadline-Date.now())/86400000);
      const dlText=new Date(deadline).toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'});
      const lv=left<0?{label:'ครบกำหนดแล้ว',color:'#7a0000'}:left<=5?{label:'เหลือไม่ถึง 5 วัน',color:'#c0392b'}:left<=15?{label:'เหลือไม่ถึง 15 วัน',color:'#d35400'}:{label:'อยู่ในกรอบ',color:'#1e7e34'};
      r213=`<div class="age-row"><span><strong>รายงาน 213 (60 วัน)</strong> เหลือ ${Math.max(0,left)} วัน · ครบ ${dlText}</span><span class="age-badge" style="background:${lv.color}">${lv.label}</span></div>`;
    }
    return `<section class="case-age"><div class="age-row"><span><strong>อายุเรื่อง</strong> ${ageDays} วัน</span><small>เริ่มนับ ${issuedText} (หลัง ผู้อำนวยการกองบริหารคดี ลงนามอนุมัติ)</small></div><div class="age-row"><span><strong>อายุความ</strong> ${remain.text}</span>${badge}</div>${r213}</section>`;
  }

  function getState(id){
    const store=readStore();
    const raw=store[id];
    if(raw&&typeof raw==='object'&&raw.caseData&&raw.documentData){const seed=CASES.find(c=>c.id===id);if(seed){for(const key in seed)if(raw.caseData[key]===undefined)raw.caseData[key]=seed[key];const wc=raw.documentData.workingCopy;if(wc)for(const key in seed)if(wc[key]===undefined)wc[key]=String(seed[key])}}
    const state=(raw&&typeof raw==='object'&&raw.caseData&&raw.documentData)?raw:initialState(CASES.find(c=>c.id===id)||CASES[0]);
    if(!state.documentData.assignedOfficer)state.documentData.assignedOfficer=state.caseData?.assignedOfficer||'';
    ['assignedOfficer','backupOfficer','previousOfficer','previousBackupOfficer'].forEach(field=>{
      if(state.documentData[field]==='คุณสุพจน์ (พี่ฮอต)')state.documentData[field]='คุณสุพจน์';
    });
    state.assignmentHistory=(state.assignmentHistory||[]).map(entry=>{
      entry={...entry,text:String(entry.text||'').replaceAll('คุณสุพจน์ (พี่ฮอต)','คุณสุพจน์')};
      if(/^\[(มอบหมาย|ดึงกลับ|มอบหมายใหม่)\]/.test(entry.text||''))return entry;
      const action=entry.action==='recall'||entry.text?.includes('ดึงงานกลับ')?'ดึงกลับ':entry.action==='reassign'||entry.text?.includes('เปลี่ยนผู้รับผิดชอบ')?'มอบหมายใหม่':'มอบหมาย';
      return {...entry,text:`[${action}] ${entry.text||''}`};
    });
    state.anonymousHistory=state.anonymousHistory||[];
    state.workflow=state.workflow&&state.workflow.owner?state.workflow:{owner:'admin',stage:'admin',status:'รอลงรับและมอบหมาย',complete:false};
    state.decisionHistory=state.decisionHistory||[];
    state.documentVersions=state.documentVersions||[];
    const storedDocumentPack=state.documentData.documentPack||{};
    const storedPages=storedDocumentPack.pages||{};
    state.documentData.documentPack={caseType:'18/1ก',sourceVersion:DOCUMENT_SOURCE_VERSION,pages:{complainant:10,'1-03':2,...storedPages},steps:{},...storedDocumentPack};
    state.documentData.documentPack.sourceVersion=DOCUMENT_SOURCE_VERSION;
    state.documentData.documentPack.pages={complainant:Number(storedPages.complainant)||10,'1-03':Number(storedPages['1-03']??storedPages.n103)||2,...storedPages};
    delete state.documentData.documentPack.pages.n103;
    state.documentData.outgoingRegisters={srr:{number:'',date:''},caseAdmin:{number:'',date:''},...(state.documentData.outgoingRegisters||{})};
    state.documentData.officerSignature={signed:false,signerName:'',signerRole:'เจ้าหน้าที่รับเรื่อง',signedAt:'',signatureId:'',...(state.documentData.officerSignature||{})};
    state.documentData.centerSignature={signed:false,signerName:'',signerRole:'ผู้อำนวยการศูนย์รับเรื่องร้องเรียน',signedAt:'',signatureId:'',...(state.documentData.centerSignature||{})};
    state.documentData.divisionSignature={signed:false,signerName:'',signerRole:'ผู้อำนวยการกองบริหารคดี',signedAt:'',signatureId:'',...(state.documentData.divisionSignature||{})};
    state.documentData.screening={decision:'',decidedAt:'',decidedBy:'',linkedCaseId:'',linkedTracking:'',note:'',additionalInfo:'',reportedToSupervisor:null,...(state.documentData.screening||{})};
    state.documentData.mergedDuplicates=state.documentData.mergedDuplicates||[];
    state.documentData.caseNumberIssuedAt=state.documentData.caseNumberIssuedAt||state.documentData.approvedAt||'';
    state.documentData.caseNumberIssuedBy=state.documentData.caseNumberIssuedBy||state.documentData.approvedBy||'';
    if(!String(state.documentData.documentSubject||'').trim())state.documentData.documentSubject=state.caseData.subject||'';
    const legacyCaseNumber=String(state.documentData.caseNumber||'').match(/^สส\s*(\d{4})\/(\d{4})$/);
    if(legacyCaseNumber)state.documentData.caseNumber=`${legacyCaseNumber[2]}/${legacyCaseNumber[1]}`;
    const dispatchComplete=Boolean(
      state.documentData.dispatchLetterNo&&
      state.documentData.dispatchLetterDate&&
      state.documentData.dispatchSentDate&&
      state.documentData.dispatchDestinationUnit&&
      state.documentData.dispatchConfirmedAt
    );
    if(state.workflow.stage==='activity5-dispatch'&&!dispatchComplete){
      state.workflow.owner='officer';
      state.workflow.stage='officer-dispatch';
      state.workflow.status='รอเจ้าหน้าที่รับเรื่อง ศรร. บันทึกข้อมูลและยืนยันการจัดส่ง';
      state.workflow.complete=false;
    }
    return state;
  }
  function saveState(id,state){const intakeChannel=document.getElementById('wiChannel');const intakeRegion=document.getElementById('wiIntakeRegion');const anonymous=document.getElementById('wiAnonymous');if(intakeChannel){state.caseData.channel=intakeChannel.value;const usesIntakeRegion=['Walk-In','จดหมาย'].includes(intakeChannel.value);state.caseData.intakeRegion=usesIntakeRegion?(intakeRegion?.value||''):'';if(usesIntakeRegion&&intakeRegion?.value)state.caseData.region=intakeRegion.value}if(anonymous){state.caseData.anonymous=anonymous.checked;state.documentData.anonymous=anonymous.checked}const store=readStore();store[id]=state;writeStore(store)}
  function activity5Handoff(state){return window.ECMISActivity5Handoff?.read(localStorage).records[state.caseData.id]||null}
  function activity5Link(state){if(state.workflow.stage!=='activity5-dispatch'||!state.workflow.complete)return '';const handoff=activity5Handoff(state);if(!handoff)return '';const caseId=String(state.caseData.id).replace(/'/g,"\\'");return `<a class="ws-button primary" href="#" onclick="event.preventDefault();window.EXMIS&&window.EXMIS.showA5('${caseId}')">เปิดกระบวนงานลำดับถัดไป</a>`}
  function notify(icon,title,text){if(window.Swal)return Swal.fire({icon,title,text,confirmButtonText:'ปิด',confirmButtonColor:'#082b50'});alert(`${title}\n${text}`)}
  function confirmDo(title,text,confirmButtonText='ยืนยัน'){if(!window.Swal)return Promise.resolve({isConfirmed:confirm(`${title}\n${text}`)});return Swal.fire({icon:'question',title,text,showCancelButton:true,confirmButtonText,cancelButtonText:'ยกเลิก',confirmButtonColor:'#082b50',cancelButtonColor:'#687789'})}
  function fontSizeControls(){return `<div class="ws-font-controls" role="group" aria-label="ปรับขนาดตัวอักษร"><span>ขนาดตัวอักษร</span><button type="button" data-font-size="decrease" aria-label="ลดขนาดตัวอักษร">A−</button><button type="button" data-font-size="reset" aria-label="ใช้ขนาดตัวอักษรปกติ">A</button><button type="button" data-font-size="increase" aria-label="เพิ่มขนาดตัวอักษร">A+</button><output id="fontSizeValue" aria-live="polite">106%</output></div>`}
  function applyFontSize(step){
    const normalized=Math.max(-1,Math.min(3,Number(step)||0));
    const fontSize=16+normalized;
    document.documentElement.style.fontSize=`${fontSize}px`;
    localStorage.setItem(FONT_SIZE_STORAGE_KEY,String(normalized));
    const output=$('#fontSizeValue');
    if(output)output.textContent=`${Math.round((fontSize/16)*100)}%`;
    $$('[data-font-size]').forEach(button=>button.classList.toggle('active',button.dataset.fontSize==='reset'&&normalized===DEFAULT_FONT_SIZE_STEP));
    return normalized;
  }
  function initFontSizeControls(){
    const storedStep=localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    let step=storedStep===null?DEFAULT_FONT_SIZE_STEP:Number(storedStep);
    step=applyFontSize(step);
    document.addEventListener('click',event=>{
      const button=event.target.closest('[data-font-size]');
      if(!button)return;
      if(button.dataset.fontSize==='reset')step=DEFAULT_FONT_SIZE_STEP;
      if(button.dataset.fontSize==='decrease')step-=1;
      if(button.dataset.fontSize==='increase')step+=1;
      step=applyFontSize(step);
    });
  }

  const SEARCH_ACTIONS=[
    {label:'ลงรับและมอบหมาย (ธุรการ ศรร.)',kw:'มอบหมาย ลงรับ assign',action:'assign'},
    {label:'บันทึกและส่งพิจารณา (เจ้าหน้าที่รับเรื่อง)',kw:'ส่งพิจารณา บันทึกส่ง officer',action:'officer-send'},
    {label:'บันทึกและส่ง ผู้อำนวยการกองบริหารคดี (ผอ.ศรร.)',kw:'ส่ง ผอ.กบค center เห็นชอบ',action:'center-send'},
    {label:'อนุมัติและดำเนินการต่อ (ผอ.กบค.)',kw:'อนุมัติ approve ลงนาม',action:'approve'},
    {label:'พิมพ์/PDF เอกสาร',kw:'พิมพ์ pdf print',action:'print'},
    {label:'แก้ไขเอกสาร (โหมดแก้ไขเหมือน Word)',kw:'แก้ไขเอกสาร word edit',action:'toggle-edit'},
    {label:'ส่งกลับเจ้าหน้าที่แก้ไข',kw:'ส่งกลับ แก้ไข return',action:'division-return'},
  ];

  function header(roleSelect=true){return `<header class="ws-topbar"><div class="ws-topbar-inner"><div class="ws-search"><input id="wsSearchInput" type="search" placeholder="ค้นหาคดี เอกสาร ฟังก์ชัน..." autocomplete="off" aria-label="ค้นหาทุกอย่าง"><div class="ws-search-results ws-hidden" id="wsSearchResults"></div></div><a class="ws-brand" href="index.html"><span class="ws-brand-mark">ศร</span><span><strong>E-CMIS</strong><small>ระบบบริหารจัดการเรื่องร้องเรียน</small></span></a>${roleSelect?`<div class="ws-profile">${fontSizeControls()}<button type="button" class="ws-admin-tool ws-button secondary" id="manageSuggestions">จัดการคำแนะนำ</button><button type="button" class="ws-admin-tool ws-button secondary" id="manageBackups">จัดการผู้ปฏิบัติงานแทน</button><span>สิทธิ์การทำงาน</span><select class="ws-role-select" id="wsRole"><option value="admin">ธุรการ ศรร.</option><option value="officer">เจ้าหน้าที่รับเรื่อง</option><option value="regional-officer">เจ้าหน้าที่เขต</option><option value="center">ผู้อำนวยการศูนย์รับเรื่องร้องเรียน</option><option value="division">ผู้อำนวยการกองบริหารคดี</option><option value="acting">ผู้รักษาราชการแทนตามคำสั่ง</option></select><label class="ws-hidden" id="wsRegionalRegionField"><span>พื้นที่รับผิดชอบ</span><select class="ws-role-select" id="wsRegionalRegion">${REGIONAL_REGIONS.map(region=>`<option value="${region}">${region}</option>`).join('')}</select></label></div>`:`<div class="ws-profile">${fontSizeControls()}<a class="ws-button secondary" href="staff-workflow.html">กลับรายการเจ้าหน้าที่</a></div>`}</div></header>`}
  function formatFileSize(bytes){if(!bytes)return'';if(bytes>=1048576)return`${(bytes/1048576).toFixed(1)} MB`;if(bytes>=1024)return`${Math.round(bytes/1024)} KB`;return`${bytes} B`}
  function attachmentName(a){return typeof a==='string'?a:(a&&a.name?a.name:'')}
  function attachmentDetails(a){if(typeof a==='string')return'';const parts=[];if(a.type)parts.push(a.type);if(a.pages)parts.push(`${a.pages} หน้า`);if(a.size)parts.push(a.size);return parts.length?` (${parts.join(' · ')})`:''}
  function attachmentDesc(a){return (typeof a==='object'&&a.desc)?` — ${a.desc}`:''}
  function attachmentList(c){return `<div class="ws-attachment-list"><h3>เอกสารแนบ ${c.attachments.length} รายการ</h3>${c.attachments.length?`<ol>${c.attachments.map(a=>`<li><button type="button" class="ws-attachment-open" data-attachment="${escapeHtml(attachmentName(a))}">${escapeHtml(attachmentName(a))}<small>${escapeHtml(attachmentDetails(a))}</small></button></li>`).join('')}</ol>`:'<p class="ws-empty">ไม่มีเอกสารแนบ</p>'}</div>`}
  function caseReadonly(c){return `<div class="ws-readonly"><dl><div><dt>ผู้ร้องเรียน</dt><dd>${escapeHtml(c.complainant)}</dd></div><div><dt>หน่วยงานที่ถูกร้อง</dt><dd>${escapeHtml(c.agency)}</dd></div><div><dt>ชื่อเรื่องร้องเรียน</dt><dd>${escapeHtml(c.subject)}</dd></div><div><dt>สถานที่เกิดเหตุ</dt><dd>${escapeHtml(c.place)}</dd></div><div><dt>เลขรับบริการ / PIN</dt><dd>${trackingLabel(c)}</dd></div><div><dt>เอกสารแนบ</dt><dd>${c.attachments.length} รายการ</dd></div></dl></div>${attachmentList(c)}`}
  function officerSubjectFields(state){const c=state.caseData,d=state.documentData;return `<div class="ws-grid-2" style="margin-top:.8rem"><div class="ws-field"><label for="originalComplaintSubject">หัวข้อเรื่องที่ผู้ร้องเรียนระบุ</label><input id="originalComplaintSubject" value="${escapeHtml(c.subject)}" readonly aria-readonly="true"><small>ข้อมูลต้นฉบับจากผู้ร้องเรียน ระบบจะไม่แก้ไขหรือเขียนทับ</small></div><div class="ws-field"><label for="documentSubject">ชื่อเรื่องสำหรับใช้ในเอกสาร</label><input id="documentSubject" value="${escapeHtml(d.documentSubject||c.subject)}"><small>ระบบคัดลอกจากหัวข้อเดิมเป็นค่าเริ่มต้น เจ้าหน้าที่สามารถปรับถ้อยคำสำหรับเอกสารได้</small></div></div>`}

  const WORKING_COPY_FIELDS=[['complainant','ผู้ร้องเรียน'],['citizenId','เลขบัตรประชาชน'],['phone','โทรศัพท์'],['email','อีเมล'],['address','ที่อยู่'],['agency','ผู้ถูกร้อง/หน่วยงาน'],['subject','เรื่องร้องเรียน'],['type','ประเภทเรื่อง'],['detail','รายละเอียดพฤติการณ์'],['place','สถานที่เกิดเหตุ'],['province','จังหวัด'],['region','เขตพื้นที่'],['damage','ความเสียหายหรือความเดือดร้อน'],['request','ความประสงค์ของผู้ร้อง']];
  function workingCopyOriginalView(c){return `<div class="ws-readonly"><dl>${WORKING_COPY_FIELDS.map(([key,label])=>`<div${['address','detail','damage','request'].includes(key)?' class="ws-field-full"':''}><dt>${label}</dt><dd>${escapeHtml(c[key]||'-')}</dd></div>`).join('')}</dl></div>${attachmentList(c)}`}
  function ensureWorkingCopy(state){const d=state.documentData;if(!d.workingCopy){const c=state.caseData;d.workingCopy={};WORKING_COPY_FIELDS.forEach(([key])=>d.workingCopy[key]=c[key]!==undefined?String(c[key]):'')}return d.workingCopy}
  function caseView(state){const w=state.documentData.workingCopy;if(!w)return state.caseData;const merged={};for(const key in state.caseData)merged[key]=state.caseData[key];for(const key in w)if(w[key]!==undefined&&w[key]!=='')merged[key]=w[key];return merged}
  function workingCopyChanged(state,key){const w=state.documentData.workingCopy;return !!w&&String(w[key]||'')!==String(state.caseData[key]||'')}
  function workingCopySection(state){const c=state.caseData,w=ensureWorkingCopy(state);const cap=key=>key[0].toUpperCase()+key.slice(1);const num=registryReceiptNumber(c)||'....................';const field=(key,label,full,textarea)=>`<div class="ws-field${full?' ws-field-full':''}"><label for="wc${cap(key)}">${label}</label>${textarea?`<textarea id="wc${cap(key)}">${escapeHtml(w[key])}</textarea>`:`<input id="wc${cap(key)}" value="${escapeHtml(w[key])}">`}</div>`;return `<div class="ws-section working-copy-section"><div class="wc-section-head"><h3>สำเนาเรื่องร้องเรียน (ฉบับเจ้าหน้าที่)</h3><span class="wc-copy-chip">สำเนา</span></div><div class="wc-tabs" role="tablist" aria-label="เลือกฉบับเอกสาร"><button type="button" class="wc-tab" data-wc-tab="original" aria-selected="false">ฉบับผู้ร้อง</button><button type="button" class="wc-tab active" data-wc-tab="copy" aria-selected="true">ฉบับเจ้าหน้าที่</button></div><div class="wc-panel ws-hidden" data-wc-panel="original"><div class="wc-orig-note">ต้นฉบับของผู้ร้อง เลขรับ ${escapeHtml(num)} — ระบบไม่แก้ไขข้อมูลนี้ เจ้าหน้าที่แก้ไขได้เฉพาะในฉบับเจ้าหน้าที่</div>${workingCopyOriginalView(c)}</div><div class="wc-panel" data-wc-panel="copy"><div class="wc-editor-banner"><strong>แก้ไขในสำเนาเท่านั้น</strong> — ต้นฉบับของผู้ร้อง (เลขรับ ${escapeHtml(num)}) อยู่ในแท็บ "ฉบับผู้ร้อง" และไม่ถูกเขียนทับ</div><div class="ws-grid-2">${field('complainant','ผู้ร้องเรียน')}${field('citizenId','เลขบัตรประชาชน')}${field('phone','โทรศัพท์')}${field('email','อีเมล')}${field('address','ที่อยู่',true)}${field('agency','ผู้ถูกร้อง/หน่วยงาน')}${field('subject','เรื่องร้องเรียน')}${field('type','ประเภทเรื่อง')}${field('detail','รายละเอียดพฤติการณ์',true,true)}${field('place','สถานที่เกิดเหตุ')}${field('province','จังหวัด')}${field('region','เขตพื้นที่')}${field('damage','ความเสียหายหรือความเดือดร้อน',true)}${field('request','ความประสงค์ของผู้ร้อง',true)}</div></div></div>`}
  function complainantOriginalPaper(state){
    const c=state.caseData;
    const num=registryReceiptNumber(c)||'....................';
    return `<article class="a4-paper template-official-form template-complainant-original" id="activePaper">
      <p class="document-confidential confidential-top">ลับ</p>
      <header class="form3-header">
        <img src="${PACC_LOGO}" alt="ตราสำนักงาน ป.ป.ท." class="form3-pacc-logo">
        <div class="form3-header-right">
          <p class="form3-system-name">ระบบบริหารจัดการเรื่องร้องเรียน สำนักงาน ป.ป.ท.</p>
          <h2 class="official-form-title">แบบบันทึกข้อมูลเรื่องร้องเรียน (ฉบับต้นฉบับ)</h2>
          <div class="form3-number">
            <strong>เลขรับเรื่องที่</strong> ${escapeHtml(num)}<br>
            <strong>วันที่รับเรื่อง</strong> ${escapeHtml(c.received||'-')}<br>
            <strong>ช่องทางยื่นเรื่อง</strong> ${escapeHtml(c.channel||'-')}
          </div>
        </div>
      </header>
      <div class="official-form-header-divider"></div>

      <table class="official-form-table">
        <tbody>
          <tr>
            <td class="col-num">๑.</td>
            <td class="col-label"><strong>ผู้ร้องเรียน</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(c.complainant||'-')}</td>
          </tr>
          <tr>
            <td></td>
            <td class="col-sublabel">เลขบัตรประชาชน:</td>
            <td>${escapeHtml(c.citizenId||'-')}</td>
            <td><strong>เบอร์โทร:</strong> ${escapeHtml(c.phone||'-')} · <strong>อีเมล:</strong> ${escapeHtml(c.email||'-')}</td>
          </tr>
          <tr>
            <td></td>
            <td class="col-sublabel">ที่อยู่:</td>
            <td colspan="2">${escapeHtml(c.address||'-')}</td>
          </tr>
          <tr>
            <td class="col-num">๒.</td>
            <td class="col-label"><strong>ผู้ถูกร้อง / หน่วยงาน</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(c.agency||'-')}</td>
          </tr>
          <tr>
            <td class="col-num">๓.</td>
            <td class="col-label"><strong>เรื่องร้องเรียน</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(c.subject||'-')}</td>
          </tr>
          <tr>
            <td class="col-num">๔.</td>
            <td class="col-label"><strong>ประเภทเรื่อง</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(c.type||'-')}</td>
          </tr>
          <tr>
            <td class="col-num">๕.</td>
            <td class="col-label" colspan="3"><strong>รายละเอียดพฤติการณ์</strong></td>
          </tr>
          <tr>
            <td></td>
            <td colspan="3">
              <div class="official-writing-box">${escapeHtml(c.detail||'-')}</div>
            </td>
          </tr>
          <tr>
            <td class="col-num">๖.</td>
            <td class="col-label"><strong>สถานที่เกิดเหตุ</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(c.place||'-')}</td>
          </tr>
          <tr>
            <td class="col-num">๗.</td>
            <td class="col-label"><strong>จังหวัด / เขตพื้นที่</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(c.province||'-')} (${escapeHtml(c.region||'-')})</td>
          </tr>
          <tr>
            <td class="col-num">๘.</td>
            <td class="col-label"><strong>ความเสียหาย/ความเดือดร้อน</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(c.damage||'-')}</td>
          </tr>
          <tr>
            <td class="col-num">๙.</td>
            <td class="col-label"><strong>ความประสงค์ของผู้ร้อง</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(c.request||'-')}</td>
          </tr>
        </tbody>
      </table>

      <footer class="official-form-footer">
        <p style="margin:0 0 .25rem 0; font-size:11.5px;">ลงชื่อ ................................................................</p>
        <p class="form3-signature-name" style="margin:0; font-size:11.5px; font-weight:600;">(${escapeHtml(state.documentData.assignedOfficer||'คุณสุพจน์')})</p>
        <p class="form3-signature-position" style="margin:.1rem 0 0 0; font-size:11px; color:#333;">เจ้าหน้าที่ผู้รับเรื่องร้องเรียน</p>
      </footer>
      <p class="doc-official-note">* หมายเหตุ: เอกสารฉบับนี้เป็นข้อมูลที่ผู้ร้องเรียนยื่นผ่านระบบโดยตรง (ฉบับต้นฉบับ)</p>
      <p class="document-confidential confidential-bottom">ลับ</p>
    </article>`;
  }

  function workingCopyPaper(state){
    const c=state.caseData;
    const w=ensureWorkingCopy(state);
    const num=registryReceiptNumber(c)||'....................';
    const edited=key=>workingCopyChanged(state,key)?` <small class="official-edited-tag">(แก้ไขในสำเนา)</small>`:'';

    return `<article class="a4-paper template-official-form template-working-copy" id="activePaper">
      <p class="document-confidential confidential-top">ลับ</p>
      <header class="form3-header">
        <img src="${PACC_LOGO}" alt="ตราสำนักงาน ป.ป.ท." class="form3-pacc-logo">
        <div class="form3-header-right">
          <p class="form3-system-name">ระบบบริหารจัดการเรื่องร้องเรียน สำนักงาน ป.ป.ท.</p>
          <h2 class="official-form-title">แบบบันทึกสำเนาเรื่องร้องเรียน (ฉบับเจ้าหน้าที่)</h2>
          <div class="form3-number">
            <strong>เลขรับเรื่องที่</strong> ${escapeHtml(num)}<br>
            <strong>วันที่รับเรื่อง</strong> ${escapeHtml(c.received||'-')}<br>
            <strong>ช่องทางยื่นเรื่อง</strong> ${escapeHtml(c.channel||'-')}
          </div>
        </div>
      </header>
      <div class="official-form-header-divider"></div>

      <table class="official-form-table">
        <tbody>
          <tr>
            <td class="col-num">๑.</td>
            <td class="col-label"><strong>ผู้ร้องเรียน</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(w.complainant||'-')}${edited('complainant')}</td>
          </tr>
          <tr>
            <td></td>
            <td class="col-sublabel">เลขบัตรประชาชน:</td>
            <td>${escapeHtml(w.citizenId||'-')}${edited('citizenId')}</td>
            <td><strong>เบอร์โทร:</strong> ${escapeHtml(w.phone||'-')}${edited('phone')} · <strong>อีเมล:</strong> ${escapeHtml(w.email||'-')}${edited('email')}</td>
          </tr>
          <tr>
            <td></td>
            <td class="col-sublabel">ที่อยู่:</td>
            <td colspan="2">${escapeHtml(w.address||'-')}${edited('address')}</td>
          </tr>
          <tr>
            <td class="col-num">๒.</td>
            <td class="col-label"><strong>ผู้ถูกร้อง / หน่วยงาน</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(w.agency||'-')}${edited('agency')}</td>
          </tr>
          <tr>
            <td class="col-num">๓.</td>
            <td class="col-label"><strong>เรื่องร้องเรียน</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(w.subject||'-')}${edited('subject')}</td>
          </tr>
          <tr>
            <td class="col-num">๔.</td>
            <td class="col-label"><strong>ประเภทเรื่อง</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(w.type||'-')}${edited('type')}</td>
          </tr>
          <tr>
            <td class="col-num">๕.</td>
            <td class="col-label" colspan="3"><strong>รายละเอียดพฤติการณ์</strong>${edited('detail')}</td>
          </tr>
          <tr>
            <td></td>
            <td colspan="3">
              <div class="official-writing-box">${escapeHtml(w.detail||'-')}</div>
            </td>
          </tr>
          <tr>
            <td class="col-num">๖.</td>
            <td class="col-label"><strong>สถานที่เกิดเหตุ</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(w.place||'-')}${edited('place')}</td>
          </tr>
          <tr>
            <td class="col-num">๗.</td>
            <td class="col-label"><strong>จังหวัด / เขตพื้นที่</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(w.province||'-')} (${escapeHtml(w.region||'-')})${edited('province')}</td>
          </tr>
          <tr>
            <td class="col-num">๘.</td>
            <td class="col-label"><strong>ความเสียหาย/ความเดือดร้อน</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(w.damage||'-')}${edited('damage')}</td>
          </tr>
          <tr>
            <td class="col-num">๙.</td>
            <td class="col-label"><strong>ความประสงค์ของผู้ร้อง</strong></td>
            <td class="col-content" colspan="2">${escapeHtml(w.request||'-')}${edited('request')}</td>
          </tr>
        </tbody>
      </table>

      <footer class="official-form-footer">
        <p style="margin:0 0 .25rem 0; font-size:11.5px;">ลงชื่อ ................................................................</p>
        <p class="form3-signature-name" style="margin:0; font-size:11.5px; font-weight:600;">(${escapeHtml(state.documentData.assignedOfficer||'คุณสุพจน์')})</p>
        <p class="form3-signature-position" style="margin:.1rem 0 0 0; font-size:11px; color:#333;">เจ้าหน้าที่ผู้ตรวจทาน/รับเรื่องร้องเรียน</p>
      </footer>
      <p class="doc-official-note">* หมายเหตุ: เอกสารฉบับนี้เป็นสำเนาสำหรับการทำงานของเจ้าหน้าที่รับเรื่อง การแก้ไขข้อมูลไม่กระทบฉบับต้นฉบับ</p>
      <p class="document-confidential confidential-bottom">ลับ</p>
    </article>`;
  }
  function adminCaseSummary(c){return `<div class="ws-readonly ws-admin-summary"><dl><div><dt>ผู้ร้องเรียน</dt><dd>${escapeHtml(c.complainant)}</dd></div><div><dt>เลขบัตรประชาชน 4 หลักท้าย</dt><dd>${escapeHtml(c.id4)}</dd></div><div><dt>โทรศัพท์</dt><dd>${escapeHtml(c.phone||'-')}</dd></div><div><dt>อีเมล</dt><dd>${escapeHtml(c.email||'-')}</dd></div><div class="ws-field-full"><dt>ที่อยู่</dt><dd>${escapeHtml(c.address||'-')}</dd></div><div class="ws-field-full"><dt>ชื่อเรื่องร้องเรียน</dt><dd>${escapeHtml(c.subject)}</dd></div><div><dt>ผู้ถูกร้อง/หน่วยงาน</dt><dd>${escapeHtml(c.agency)}</dd></div><div><dt>ประเภทเรื่อง</dt><dd>${escapeHtml(c.type)}</dd></div><div class="ws-field-full"><dt>รายละเอียดพฤติการณ์</dt><dd>${escapeHtml(c.detail)}</dd></div><div><dt>สถานที่เกิดเหตุ</dt><dd>${escapeHtml(c.place)}</dd></div><div><dt>จังหวัด/เขตพื้นที่</dt><dd>${escapeHtml(c.province)} · ${escapeHtml(c.region)}</dd></div><div class="ws-field-full"><dt>ความเสียหายหรือความเดือดร้อน</dt><dd>${escapeHtml(c.damage)}</dd></div><div class="ws-field-full"><dt>ความประสงค์ของผู้ร้อง</dt><dd>${escapeHtml(c.request)}</dd></div></dl></div>${attachmentList(c)}`}
  const PACC_LOGO = 'https://www.pacc.go.th/images/pacc_logo.png';
  const GARUDA_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADKBAMAAAAFnIJvAAAABGdBTUEAALGIlZj0pgAAADBQTFRFAAAAgAAAAIAAgIAAAACAgACAAICAgICAwMDA/wAAAP8A//8AAAD//wD/AP//////ex+xxAAAAAlwSFlzAAAOQAAADkUBMpLx3wAADBBJREFUeJzVnAuC5LYKRdkB+98lO+CVBZePLNmuT78klWSmuyzrCIEQYDmkf/2h/yZBiFcE+h1Mal/xI/2Q0IaLn15YXjf+6FPm6f9H+O0kVU1QfPNjAkOIJPxyklQ4Rux/068JJJ1QvvjRh0S4EfjnBKa/JsSiG38J/dJnoN8/J2Ca/ozAWgnHrw8JT42aWFy1RpCnBHljJH9NIMhL47a/kEGkEPggPJrgp4TXDIl2gnxFOI1Phh4mAk1Nln29hnYeydF2vp2PPoPwmjOeCHbTmbEieFu2nkMoKrN0ELT7c6I1YkUYzXyE4e4omjrhtcgFNzA2pDNBNjKwqwLalCFBkYEOGVLAaH4S4SAs1BNCUBDYZiYJ1Ahityx0yusoUax97MWvKWmzNHY4yQ2VDbDq6RBt8b2hCcN+dfiiuWM6E9g0vLT7PcHmqRG0EPiQkEEYsi7MXq339RVTtuN9gU0Edb6a4a6dw54whGDv7lgMQy2dQK6nMf51N07YauK42ayKc1czwhCQQdCtFsj+2QlhNx/qsDUXhPELmyROWM/1bqWnEOjO1FAJY5rsXtb9XN8Sjgn2SVoQzJ2OSV7O9OEHxmfDh/CvBjZVE4EqYa1nwlh2l9VcY/aXBLfQw2AvCAyvsZ4mC4xsb5sI4oT0f7tpGIRh9YsWNr9Dzz7o4pegCDjsxf3kywamsiEoCJGSgGDThG9XhOOi7xpre4IMqYZcWkYYElwQ+ueSYJPUCKYb3LoyRynrYa8HcXOWmSDkg5QtgaoYw4GcCDaFYjMhneAG5mIsdjexFZSERQQ3tq7Xf9Y3UdM0ljQ+SwKNXWvrOsRW/EFwaZotFSNZE9gn8Ypgl4790xXSCB6Q7AmxSfr1k+vCzezGj0EEgaqtnFQ9NmgSiBohY1NDnYJOiF/30xR6jnjz3KTeLCtC18Tp9jbGMMUipbfg7KllivM0zffbsAnjWRAgHdbziuBWblY96+HYs2yVYRhTAw/JzCVZMF8IYAr+QGiVHdjWhXmIyGjWwrgbZqWdwNTnes44dMQYIfK0C9XlSl3KJMg1QbLTh4ReOUn14OqEYOXWSycIdQqXJC0CbrcFieHPhD6CvslBqclfERBsRJbR+3C/E1tVtQTJXjgAC4IbfKqodhJwiT9OIoRBbQmYaenX/GcKQZm0WTN+Dg3LmRDOpllBXxNS97gWlUVfYwBmdhsCuY/n6VbrXy0YEcsNkkApwrgCB3KapQxEqN6j9UdWSwFbkxTB8pDhW3MIFA0x/CqE1J6ijFBcawGYgpxOmcYEIbxvncOU4jUoQep3DDVXQIzVfhxuSUoak7M1+pZJiOhiBK0wlgMGCVpLsoXT1kvIOOJu8si83Wc++wgGop5irpWmCXW/T9MY8QNDFX2aSp/Fo6Xd1klCGOUamQm5VqqCI4iLMCRXVF87pdbSt5eqU3TukXiRIRDsmatJ1kXAypDueQsBu6fklmzbp93POWILHZEUxvgI+xPvCAIhi/gWI6Fm4P2M4o6t8UpQT0J7AlM0MuJBSA+EJ9niK9o+jFo/ZOh+TYXXhMNeJPaAWLWWJ1dvPUI+nxEvIfg6gaktZ8mWSrgs/M1OYM7GrCh1OmEYeYaS4M4E0cgibPVbDcIInn/CWrNrheakBNhaP4XgtfCUt+hyqKOmTnZVpOdGUBktCUiDYbjm3fyJkYXjGQ564UVIM1a25eAiLwm5NZXN7vByuJoWAGsck0VBgC9u8WAjsMVlUgyWQCBB6MypylGnLSucLE3lDcEliMWJ5M0usuS1cAtSAhfQ5+RlJjSVkRnJuD8yLNvtO8H9gRB8yYYQ/rF/cE3TvVrLogJJdzxX6SZCrLbIlDAgWwU+YFNmy0TSjes1Ab4ChLJViIdMKFaO5cEhIzqcH0/OIXT41JQCvljMdXESfFfX9Ftedt0S0qLDm5dAVsh9h2QYN6IcLERzXnPpqf+KsjULKiCNoF4dKwSq1tEUsibgXp5MNm6qQXdJSWERfBZhSWCEwcgvGyHbcvGSsYmcU/HpV/fcfHg8igjjHAZDBnO35DqaE4sFAUsiqoLScrK5KWeE0W6/ILTsBZHwnmB/l5tXj7pO9xXjKZHXmUCRmo/tUWllqguCCsGUYIK5cCcRQhCJWOqkhQWhVGvICy2qZ/1B0OoZT8v5HyPkdumbTcsT0m/5phffo/E9oberyo462SLlO914RdDuJY5Yq3DyxxYaLpfCloBJGYVTBNnnT3ru+OIpoW5dWkus5icaxtvwFNreEco8RYRh0Ax0ULymiKfWgA2hevzpB4w8484qzRuE8GuZHvYJr6rZWNE1QcVTGevymiAfEWBRpdPiFOewag+4IaRaI+c8pcHt8luEMkI+dyEUsYJcC7E3AUL4ZEvgTIgzHjuPdE1wRctwGfN5EbUIIbze3mXsCfBxYiWjUw82Sa3tThUbAgXBApQgYGKIOCNJOg/hjoBq4CudIU/Qsfo0CiyUjfnivN7yazu8Mh7SGsEzPN/W2EXohO10rEWwO8yQvD+sLEy7zaIRWXPSHsoQ7oa84j2nRpyrIN37Y0LdOb3c0J4oTv3h940iloSsGvrpjIigUhT7Psazn6a1DKYGIS8rZZnSFziJEcb+wHZ2aBmObQhWwrBnTjrqGpCBfRdF7G/llvH0/y0ZUNIzixyZp3km7KIczlBaFPqcEHOtFCd2zNWZeVWzkaqbx4R6W4kUzYDGejaopp5xZugpQSmUW+ogueWU7whl+shRnxLGFFF5WD894XAhxomeUS/YHUnaEaxeJGVc4gE2vKpYue/4HinjG7aEXNr9GWbdCOMkndqKCEsq9d4nBE/zwzkwzk1Z6ujpVJTvzSDeIdjjjoiHIZj1J173zIoWix/aeYMQmhOcr4H/lPEQOcjmLoygvbx3S/Bd5aiqeWCN+GkUsjzmZ/Gzh8Po3iCU2lorIpuO4zEB9Q8vJ2mfP1RlI1C1+loU2ymefoxDju/tcdhCzW1ADBslSQByF9H39ulRDBtLjiV6UZU8iRfDxylQ2R0N2xHYqrvFFR2lc4UMdZ+Fs13reRsvoVe4v+qOwkGx5CVaO9YtoUYXReHSCf2zAVzErapRIo4x60SwXXV1BOWWYAHqcQZkHADEUQ4jxLMDcgNeVMYeEFqO6+7Zs2cUuYvFbnu5ImhRqFaC+qxkLn+RY10TomjrNFh8nuy7np8nBOz+7iJQJJE4WXoPeELwNZy9SRTcf0TQXIG+sWaC8j1Bqgjtw/6M6wcEPe8ENmMU178h+NawyB58/X1kS12nVkVdCEGTEETrlXf+roY+VYQTJR7lALCuYp0IsYFxDBC73ayIKIsr8uwV4lSvwH4eKwDr+ixCebrR6ro3hFK79dGxZ6VnQl92kqQrQhmQOSI7jn98OdvT9HygRYjXMrTTR0J4EaBvzgTHlEPjVPsNQdXPUOBGjC9PbzYL0ibHLWFOZEolvZ+FwNTLqvW1DPFOTdSMQaBqPG04IfAjwly6q4R0Ut661BWr1d4RyngxzLmugVJ0HfIbhP5sgKynZqxsWYNGfhHt72dJM5NJUcSPPcVGJHYcNW2Ud739k4R0sObhuATEGudyCDkYFuIT3xqnZzL1MUz6b7bXNKrSJvO4kQG9DJwBSPM4nqc8EUbNvvjJLOV3yKQUbxr6G0dUJG11mqezVAAIIOONBp5EoPoS1TNCZkuCp1W+AHgcyKYQwdrcRlyX18TjU3+5xQmea/t6pN37QfeEEsOgwON1y3hZ2T3IxwR/jOKCeELrsV6+VETbLPQBoYQo5NUkZSovsHqd6fJzTSiPbk3vXhEoRirfyBC1QX9RmZwAV+7b3OeaRvVxJAviZSfliBUow6lPCXYziqz+mmyN/5Ru8tA7gh2QHv+KouzMEZ3Zq27f5nHWvQUZY8rtoYeks/g2fxD2U5SjcOuhsPqbk97gO4Kn/bYn4JVr9lNSi1d2PiB49OonAyNeUt6/tvouQW2DswDZt1V/LPFLgtlPvK3qvvt3BIsr4B4kCU8AzwjxOjI1wrPPo4bYqo2Aze8+WX9OiMcL42yls54K8bSd1eqD8EzJbxE8AmYk0Y8Bzwlo/sboPyK8NfoPCe+K8O8jPP5/tXxBeBfwwR3vfv4HpAT+CEwM+dUAAAAASUVORK5CYII=';
  const checkMark = checked => `<span class="doc-checkbox" aria-hidden="true">${checked?'✓':''}</span>`;
  function form3Paper(state,role){
    const canEditOpinion=key=>role==='center'&&key==='center'||role==='division'&&key==='division';
    const c=caseView(state),d=state.documentData;
    const selected = value => d.decision===value;
    const zoneProposal=/เขต/.test(d.proposedRegion||'');
    const naccReasons = NACC_TRANSFER_REASONS.map(reason=>[reason,reason]);
    const reasonChecked = key => d.reasons.some(reason=>reason.includes(key));
    const writingArea = (checked,value,compact) => checked&&value ? `<p class="form3-writing-text${compact?' compact':''}">${escapeHtml(value)}</p>` : `<div class="form3-writing-lines${compact?' compact':''}"><div></div><div></div><div></div>${compact?'':'<div></div>'}</div>`;
    const signedLine = (signature,type) => signature?.signed
      ?`<div class="form3-signed-block">${signatureImage(type,'document')}<p class="form3-signature-name">(${escapeHtml(signature.signerName||signature.signerRole||'ผู้ลงนาม')})</p><p class="form3-signature-position">ตำแหน่ง ${escapeHtml(signature.signerRole||'')}</p></div>`
      :'<div class="form3-approval-signature"><p class="form3-signature-name">(..............................................................)</p><p class="form3-signature-position"><span>ตำแหน่ง</span> <span class="form3-position-line"></span></p></div>';
    const mainPage=`<article class="a4-paper template-form3" data-auto-paginate>
      <p class="document-confidential confidential-top">ลับ</p>
      <header class="form3-header">
        <img src="${PACC_LOGO}" alt="ตราสำนักงาน ป.ป.ท." class="form3-pacc-logo">
        <div class="form3-header-right">
          <p class="form3-system-name">ระบบบริหารจัดการเรื่องร้องเรียน สำนักงาน ป.ป.ท.</p>
          <div class="form3-number">
            <strong>เลขรับเรื่องที่</strong> ${escapeHtml(registryReceiptNumber(c)||'....................')}<br>
            <strong>วันที่</strong> ........ <strong>เดือน</strong> .............. <strong>พ.ศ.</strong> ..............
          </div>
        </div>
      </header>
      <div class="official-subject">
        <strong>เรื่อง</strong><span>การพิจารณารับและกลั่นกรองเรื่องร้องเรียน/เบาะแส เลขรับเรื่องที่ ${escapeHtml(registryReceiptNumber(c)||'....................')}</span>
        <strong>เรียน</strong><span>เลขาธิการคณะกรรมการ ป.ป.ท.</span>
      </div>
      <p class="form3-intro">ได้พิจารณาแล้ว จึงขอเสนอเพื่ออนุมัติ ดำเนินการตาม พรบ. ป.ป.ท. ดังนี้</p>
      <div class="form3-decision-grid">
        <section class="form3-decision-column">
          <h3>${checkMark(selected('send-nacc'))} ไม่รับไว้ดำเนินการ ส่งสำนักงาน ป.ป.ช.</h3>
          <p class="form3-section-label">เหตุที่ไม่สามารถรับไว้ดำเนินการ</p>
          ${naccReasons.map(([key,label])=>`<p>${checkMark(selected('send-nacc')&&reasonChecked(key))} ${label}</p>`).join('')}
          <p>${checkMark(selected('send-nacc')&&d.naccOtherChecked)} อื่นๆ .....................................................................</p>
          ${writingArea(selected('send-nacc')&&d.naccOtherChecked,d.naccOtherReason,false)}
          <h3>${checkMark(selected('not-accept'))} ไม่รับไว้ดำเนินการ</h3>
          ${writingArea(selected('not-accept'),d.notAcceptReason,true)}
        </section>
        <section class="form3-decision-column form3-accept-column">
          ${[['18/1ก','รับไว้ตรวจสอบ กรณี มาตรา 18/1(ก)'],['18/1ข','รับไว้ตรวจสอบ กรณี มาตรา 18/1(ข)'],['18/4','รับไว้ตรวจสอบ กรณี มาตรา 18/4'],['58/2','รับไว้ตรวจสอบ กรณี มาตรา 58/2']].map(([key,label])=>`<h3>${checkMark(selected(key))} ${label}</h3><p>${checkMark(selected(key)&&!zoneProposal)} มอบหมาย สำนัก/กอง (สำหรับ ศรร. กบค.)</p><p class="form3-line">${selected(key)&&!zoneProposal?'กองบริหารคดี':''}</p><p>${checkMark(selected(key)&&zoneProposal)} มอบหมาย ผู้รับผิดชอบ (สำหรับ สำนัก/กอง)</p><p class="form3-line">${selected(key)&&zoneProposal?escapeHtml(d.proposedRegion):''}</p>`).join('')}
        </section>
      </div>
      <div class="form3-footer-block">
        <p class="form3-note"><strong>หมายเหตุ</strong> ให้สแกนเอกสารที่สำคัญและจำเป็นลงในระบบฯ<br><span>ทั้งนี้ กรณี ส่งเรื่องไปยังระบบไต่สวนให้นำเข้าเอกสารที่สแกนลงในระบบไต่สวนด้วย</span></p>
        <p class="form3-submit">จึงเรียนมาเพื่อโปรดพิจารณา</p>
        <div class="form3-operator">${d.officerSignature?.signed?`<div class="form3-signed-block">${signatureImage('officer','document')}</div>`:'<div class="form3-operator-dots"></div>'}<p class="form3-signature-name" data-editable="assignedOfficer" contenteditable="true" spellcheck="false">${d.officerSignature?.signed?`(${escapeHtml(assignedOfficerName(d))})`:'ชื่อผู้ดำเนินการ'}</p><p class="form3-signature-position">${d.officerSignature?.signed?'เจ้าหน้าที่รับเรื่อง':'ตำแหน่งผู้ดำเนินการ'}</p></div>
      </div>
      <div class="form3-opinion-grid">
        <section data-flow-section data-opinion-section="center">
          <h3 data-flow-heading>ความเห็น ผู้บังคับบัญชาชั้นต้น</h3>
          <div class="form3-opinion-lines-container">
            <p class="form3-opinion-line" data-flow-text data-editable="centerOpinion"${canEditOpinion('center')?' contenteditable="true" spellcheck="false"':''}>${escapeHtml(d.centerOpinion||'')}</p>
            <div class="form3-opinion-line-extra"></div>
          </div>
          <div data-keep-together>${signedLine(d.centerSignature,'center')}</div>
        </section>
        <section data-flow-section data-opinion-section="division">
          <h3 data-flow-heading>ความเห็น ผู้อำนวยการสำนัก/กอง</h3>
          <div class="form3-opinion-lines-container">
            <p class="form3-opinion-line" data-flow-text data-editable="divisionOpinion"${canEditOpinion('division')?' contenteditable="true" spellcheck="false"':''}>${escapeHtml(d.divisionOpinion||'')}</p>
            <div class="form3-opinion-line-extra"></div>
          </div>
          <div data-keep-together>${signedLine(d.divisionSignature,'division')}</div>
        </section>
      </div>
      <p class="document-confidential confidential-bottom">ลับ</p>
    </article>`;
    return `<div class="document-page-set form3-document-set" id="activePaper">${mainPage}</div>`;
  }
  function receiptPaper(c,qr='',opts={}){
    const isDuplicate=Boolean(opts.originalTracking);
    const receiptTracking=isDuplicate?opts.originalTracking:(c.trackingYear||'รอจัดสรร');
    const receiptPin=isDuplicate?opts.originalPin:(c.trackingCode||'—');
    const officeRows = [
      ['กองปราบปรามการทุจริตในภาครัฐ 1','025026670-80 ต่อ 2109',''],['กองปราบปรามการทุจริตในภาครัฐ 2','025026670-80 ต่อ 2206',''],['กองปราบปรามการทุจริตในภาครัฐ 3','025026670-80 ต่อ 2301, 2308',''],['กองปราบปรามการทุจริตในภาครัฐ 4','025026670-80 ต่อ 2407',''],['กองปราบปรามการทุจริตในภาครัฐ 5','025026670-80 ต่อ 2502',''],['กองอำนวยการต่อต้านการทุจริต','025026670-80 ต่อ 4222',''],
      ['สำนักงาน ป.ป.ท. เขต 1','035323365-8','22/25 ถนนนเรศวร ตำบลประตูชัย อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา 13000'],['สำนักงาน ป.ป.ท. เขต 2','033004537','388 หมู่ 1 ตำบลหนองไม้แดง อำเภอเมือง จังหวัดชลบุรี 20000'],['สำนักงาน ป.ป.ท. เขต 3','044465054','118 หมู่ 10 ถนนมิตรภาพ ตำบลโคกกรวด อำเภอเมือง จังหวัดนครราชสีมา 30280'],['สำนักงาน ป.ป.ท. เขต 4','043239092-3','4/33 ถนนหน้าเมือง ตำบลในเมือง อำเภอเมือง จังหวัดขอนแก่น 40000'],['สำนักงาน ป.ป.ท. เขต 5','053112802','ศูนย์ราชการจังหวัดเชียงใหม่ ถนนโชตนา อำเภอเมือง จังหวัดเชียงใหม่ 50300'],['สำนักงาน ป.ป.ท. เขต 6','055304117','723/13-17 ถนนพิชัยสงคราม ตำบลในเมือง อำเภอเมือง จังหวัดพิษณุโลก 65000'],['สำนักงาน ป.ป.ท. เขต 7','034272338-41','445/2 ถนนเทศา ตำบลพระประโทน อำเภอเมือง จังหวัดนครปฐม 73000'],['สำนักงาน ป.ป.ท. เขต 8','077206185','91/1 หมู่ 1 ถนนกาญจนวิถี ตำบลบางกุ้ง อำเภอเมือง จังหวัดสุราษฎร์ธานี 84000'],['สำนักงาน ป.ป.ท. เขต 9','074552027-8','116 หมู่ 2 ถนนเพชรเกษม ตำบลควนลัง อำเภอหาดใหญ่ จังหวัดสงขลา 90110']
    ];
    const directoryPage = (rows,page)=>`<article class="a4-paper receipt-directory-page"><h2>เบอร์โทรศัพท์ สำนัก / กอง / ศูนย์</h2>${page===2?'<p class="directory-head"><strong>สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ (สำนักงาน ป.ป.ท.)</strong><br>99 หมู่ 4 อาคารซอฟต์แวร์ปาร์ค ถนนแจ้งวัฒนะ ตำบลคลองเกลือ อำเภอปากเกร็ด จังหวัดนนทบุรี 11120</p>':''}<div class="receipt-directory">${rows.map(([name,phone,address])=>`<section><div><strong>${name}</strong><strong>โทร: ${phone}</strong></div>${address?`<p>${address}</p>`:''}</section>`).join('')}</div><p class="document-page-number">หน้า ${page} จาก 3</p></article>`;
    return `<div class="document-page-set" id="activePaper">
      <article class="a4-paper template-receipt">
        <header class="receipt-header"><img src="${PACC_LOGO}" alt="ตราสำนักงาน ป.ป.ท."><div class="receipt-code-box"><strong>58/2-02</strong><span>แบบแจ้งเลขเรื่องร้องเรียน/เลขติดตาม PCMS</span></div></header>
        <div class="doc-heading"><h2>แบบแจ้งเลขเรื่องร้องเรียนและเลขติดตามเรื่องร้องเรียน</h2><p>ระบบการตรวจสอบข้อเท็จจริง สำนักงาน ป.ป.ท.</p><p>ศูนย์รับเรื่องร้องเรียน/สำนักงาน ป.ป.ท. เขต ${escapeHtml(c.region||'ส่วนกลาง')}</p></div>
        <div class="receipt-fields"><p><span>วันที่ลงรับ</span><strong>${escapeHtml(c.received)}</strong></p><p><span>เลขรับเรื่อง</span><strong>${escapeHtml(registryReceiptNumber(c)||'....................')}</strong></p><p><span>เลขรับบริการ</span><strong>${escapeHtml(receiptTracking)}</strong></p><p><span>PIN ติดตามเรื่อง 4 หลัก</span><strong>${escapeHtml(receiptPin)}</strong></p><p class="receipt-field-wide"><span>หน่วยงานที่รับเรื่องร้องเรียน</span><strong>ศูนย์รับเรื่องร้องเรียน สำนักงาน ป.ป.ท.</strong></p><p><span>ช่องทางติดต่อ</span><strong>สายด่วน 1206</strong></p><p class="receipt-field-address"><span>ที่อยู่</span><strong>99 หมู่ 4 อาคารซอฟต์แวร์ปาร์ค ถนนแจ้งวัฒนะ ตำบลคลองเกลือ อำเภอปากเกร็ด จังหวัดนนทบุรี 11120</strong></p></div>
        <p class="receipt-instruction">ท่านสามารถติดตามเรื่องร้องเรียนของท่านได้ที่หน่วยงานข้างต้น<br>หรือติดตามสถานะเรื่องร้องเรียนตาม QR CODE ด้านท้ายหนังสือฉบับนี้<br>โดยให้ท่านใส่เลขเรื่องร้องเรียน และเลขติดตามตามที่กำหนด</p>
        ${isDuplicate?`<p class="receipt-duplicate-note"><strong>เรื่องซ้ำ — ใช้เลขติดตามเดิม</strong> เรื่องนี้เป็นเรื่องซ้ำของเรื่องเดิม (เลขรับเรื่อง ${escapeHtml(opts.duplicateOf||'')}) และไม่มีการออกเลขติดตามใหม่ กรุณาใช้เลขรับบริการและ PIN ข้างต้น (เลขเดิม) เพื่อติดตามสถานะเรื่องร้องเรียน</p>`:''}
        <p class="receipt-officer">เจ้าหน้าที่ผู้รับเรื่อง <strong>${escapeHtml(c.receivingOfficer||'........................................................')}</strong> ตำแหน่ง <strong>${escapeHtml(opts.duplicateOf?'เจ้าหน้าที่รับเรื่องร้องเรียน (กลั่นกรองเรื่องซ้ำ)':'เจ้าหน้าที่รับเรื่องร้องเรียน')}</strong></p>
        <div class="receipt-signature-row">${qr?`<figure><img class="doc-qr" src="${qr}" alt="QR Code ติดตามเรื่อง"><figcaption>ระบบติดตามสถานะเรื่องร้องเรียน</figcaption></figure>`:'<div class="doc-qr"></div>'}<div><p>ศูนย์รับเรื่องร้องเรียน/สำนักงาน ป.ป.ท.</p><p>สำนักงาน ป.ป.ท.</p></div></div>
        <p class="receipt-red-note"><strong>หมายเหตุ</strong> เอกสารฉบับนี้ถือเป็นเอกสารแจ้งให้ทราบว่า สำนักงาน ป.ป.ท. ได้รับเรื่องร้องเรียนของท่านไว้ดำเนินการแล้ว ขอให้เก็บรักษาเอกสารไว้เพื่อยืนยันตัวบุคคล หรือเพื่อติดตามเรื่องร้องเรียนของท่าน ทั้งจากหน่วยงานที่รับเรื่อง และระบบการติดตามเรื่องร้องเรียน สำนักงาน ป.ป.ท.</p>
        <p class="document-page-number">หน้า 1 จาก 3</p>
      </article>
      ${directoryPage(officeRows.slice(0,13),2)}${directoryPage(officeRows.slice(13),3)}
    </div>`;
  }
  function duplicateReceiptPaper(newCase,originalCase,qr){
    return receiptPaper(newCase,qr,{duplicateOf:caseDisplayId(originalCase)||originalCase?.id||'',originalTracking:originalCase?.trackingYear||'',originalPin:originalCase?.trackingCode||''});
  }
  function officerPreviewPages(state){
    const officialIds=officialDocumentIds(state);
    const cover=officialIds.includes('1-01')?[['1-01',`ปปท. 1-01 ${OFFICIAL_DOCUMENTS['1-01'].name}`]]:[];
    const remaining=officialIds.filter(id=>id!=='1-01').map(id=>[id,`ปปท. ${id} ${OFFICIAL_DOCUMENTS[id].name}`]);
    const docs=[['back-cover','ปกหน้า (แบบ 1-01)'],...cover,...remaining,...(usesReviewRecord(state)?[[REVIEW_RECORD_ID,REVIEW_RECORD_NAME]]:[]),['complainant-original','ข้อมูลเรื่องร้องเรียน (ต้นฉบับ)'],['working-copy','สำเนาเรื่องร้องเรียน (ฉบับเจ้าหน้าที่)']];
    const pages=[];
    docs.forEach(([id,name])=>{
      const source=document.createElement('div');
      source.innerHTML=documentPaper(state,id,'officer');
      const papers=[...source.querySelectorAll('.a4-paper')];
      if(papers.length){
        papers.forEach((paper,index)=>{
          const copy=paper.cloneNode(true);
          copy.removeAttribute('id');
          copy.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
          pages.push({name,index:index+1,total:papers.length,html:copy.outerHTML});
        });
        return;
      }
      pages.push({name,index:1,total:1,html:`<article class="a4-paper document-placeholder officer-preview-placeholder">${source.innerHTML}</article>`});
    });
    return pages;
  }
  function officerSendReviewHtml(){
    return `<div class="officer-document-preview"><header class="officer-preview-head"><div><span>เอกสารปัจจุบัน</span><strong id="officerPreviewTitle">—</strong></div><b id="officerPreviewCounter">หน้า 1 จาก 1</b></header><div class="officer-preview-viewport" id="officerPreviewViewport"></div><footer class="officer-preview-navigation"><button type="button" id="officerPreviewPrev">ก่อนหน้า</button><span>ตรวจสอบเอกสารตามลำดับจนถึงหน้าสุดท้าย</span><button type="button" id="officerPreviewNext">ถัดไป</button></footer></div>`;
  }
  function usesReviewRecord(state){return packCaseTypeOf(state)!=='62'}
  function firstDocumentId(state,role){if(usesReviewRecord(state))return REVIEW_RECORD_ID;return role==='officer'?ALL_DOCUMENTS_ID:'working-copy'}
  function docTabs(state,role){
    if(role==='admin')return '';
    const officialIds=officialDocumentIds(state),cover=officialIds.includes('1-01')?[['1-01',`1-01 ${OFFICIAL_DOCUMENTS['1-01'].name}`]]:[],remaining=officialIds.filter(id=>id!=='1-01').map(id=>[id,`${id} ${OFFICIAL_DOCUMENTS[id].name}`]);
    const docs=[['back-cover','ปกหน้า (แบบ 1-01)'],...cover,...remaining,...(usesReviewRecord(state)?[[REVIEW_RECORD_ID,REVIEW_RECORD_NAME]]:[]),...(state.documentData?.screening?.decision==='duplicate'?[['duplicate-receipt','ใบแจ้งเลขติดตาม (เลขเดิม)']]:[]),...(role==='officer'?[[ALL_DOCUMENTS_ID,'ดูชุดเอกสารทั้งหมด']]:[]),['complainant-original','ข้อมูลเรื่องร้องเรียน (ต้นฉบับ)'],['working-copy','สำเนาเรื่องร้องเรียน (ฉบับเจ้าหน้าที่)']];
    const activeId=firstDocumentId(state,role);return docs.map(([id,name])=>`<button class="ws-doc-tab ${id===activeId?'active':''}" data-doc="${id}" aria-selected="${id===activeId?'true':'false'}">${name}</button>`).join('');
  }
  function docSelect(state,role){
    if(role==='admin')return '';
    const officialIds=officialDocumentIds(state),cover=officialIds.includes('1-01')?[['1-01',`1-01 ${OFFICIAL_DOCUMENTS['1-01'].name}`]]:[],remaining=officialIds.filter(id=>id!=='1-01').map(id=>[id,`${id} ${OFFICIAL_DOCUMENTS[id].name}`]);
    const docs=[['back-cover','ปกหน้า (แบบ 1-01)'],...cover,...remaining,...(usesReviewRecord(state)?[[REVIEW_RECORD_ID,REVIEW_RECORD_NAME]]:[]),...(state.documentData?.screening?.decision==='duplicate'?[['duplicate-receipt','ใบแจ้งเลขติดตาม (เลขเดิม)']]:[]),...(role==='officer'?[[ALL_DOCUMENTS_ID,'ดูชุดเอกสารทั้งหมด']]:[]),['complainant-original','ข้อมูลเรื่องร้องเรียน (ต้นฉบับ)'],['working-copy','สำเนาเรื่องร้องเรียน (ฉบับเจ้าหน้าที่)']];
    return docs.map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
  }
  function combinedDocumentPaper(state,role){
    const officialIds=officialDocumentIds(state);
    const cover=officialIds.includes('1-01')?[['1-01',`ปปท. 1-01 ${OFFICIAL_DOCUMENTS['1-01'].name}`]]:[];
    const remaining=officialIds.filter(id=>id!=='1-01').map(id=>[id,`ปปท. ${id} ${OFFICIAL_DOCUMENTS[id].name}`]);
    const docs=[['back-cover','ปกหน้า (แบบ 1-01)'],...cover,...remaining,...(usesReviewRecord(state)?[[REVIEW_RECORD_ID,REVIEW_RECORD_NAME]]:[]),...(state.documentData?.screening?.decision==='duplicate'?[['duplicate-receipt','ใบแจ้งเลขติดตาม (เลขเดิม)']]:[]),['complainant-original','ข้อมูลเรื่องร้องเรียน (ต้นฉบับ)'],['working-copy','สำเนาเรื่องร้องเรียน (ฉบับเจ้าหน้าที่)']];
    return `<div class="document-bundle-preview" id="activePaper"><header class="document-bundle-title"><span>ชุดเอกสารสำหรับตรวจสอบก่อนเสนอพิจารณา</span><strong>${docs.length} รายการ</strong></header>${docs.map(([id,name],index)=>`<section class="document-bundle-item"><div class="document-bundle-item-head"><b>${index+1}</b><h3>${escapeHtml(name)}</h3></div><div class="document-bundle-paper">${documentPaper(state,id,role).replace(/\sid="activePaper"/g,'')}</div></section>`).join('')}</div>`;
  }
  function f102Paper(state){
    const c=state.caseData;
    const nameWithoutPrefix=c.complainant.replace(/^(นาย|นางสาว|นาง|เด็กชาย|เด็กหญิง|ว่าที่ร้อยตรี|ว่าที่ร้อยเอก|พันตำรวจโท|พลตำรวจตรี|พลตำรวจเอก)\s*/,'');
    const nameParts=nameWithoutPrefix.split(/\s+/).filter(Boolean);
    const prefix=(c.complainant.match(/^(นาย|นางสาว|นาง|เด็กชาย|เด็กหญิง|ว่าที่ร้อยตรี|ว่าที่ร้อยเอก|พันตำรวจโท|พลตำรวจตรี|พลตำรวจเอก)/)||[])[1]||'';
    const firstName=nameParts.length>1?nameParts.slice(0,-1).join(' '):nameWithoutPrefix;
    const lastName=nameParts.length>1?nameParts.at(-1):'';
    const accused=c.agency||'';
    const isAgency=/สำนักงาน|กรม|กระทรวง|เทศบาล|องค์การ|หน่วยงาน|มหาวิทยาลัย|โรงพยาบาล/.test(accused);
    const attachments=c.attachments||[];
    const field=value=>escapeHtml(value||'................................................................');
    return `<article class="a4-paper template-petition" id="activePaper">
        <header class="petition-header"><p>“ตัวอย่างแจ้งการร้องเรียน-เบาะแส”</p><img src="${PACC_LOGO}" alt="ตราสำนักงาน ป.ป.ท."><div><strong>เขียนที่</strong> ................................................<br><strong>วันที่</strong> ......... เดือน .................. พ.ศ. .......</div></header>
        <div class="doc-heading"><h2>แจ้งการร้องเรียน/เบาะแส<br>สำนักงาน ป.ป.ท.</h2></div>
        <div class="official-subject"><strong>เรียน</strong><span>เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</span></div>
        <section class="petition-section"><h3>ข้อมูลผู้ร้องเรียน</h3>
          <p>${checkMark(Boolean(c.confidentialityRequested))} ขอปกปิดชื่อและไม่ประสงค์จะเปิดเผยตัวตน</p>
          <p>คำนำหน้านาม ${field(prefix)} ชื่อ ${field(firstName)} นามสกุล ${field(lastName)} หมายเลขบัตรประชาชน ${field(c.citizenId)}</p>
          <p>ที่อยู่ปัจจุบัน ${field(c.address)} ซอย ........................................................ หมู่ที่ .................... ตำบล/แขวง ........................................................</p>
          <p>อำเภอ/เขต ........................................................ จังหวัด ${field(c.province)} รหัสไปรษณีย์ ....................................</p>
          <p>หมายเลขโทรศัพท์ที่ติดต่อได้ ${field(c.phone)} EMAIL ${field(c.email)}</p>
          <p>ท่านเป็นเครือข่ายของสำนักงาน ป.ป.ท. ${checkMark(false)} ไม่ได้เป็นเครือข่าย&nbsp;&nbsp;&nbsp; ${checkMark(false)} เป็นเครือข่าย ${field('')}</p>
        </section>
        <section class="petition-section"><h3>ข้อมูลบุคคล/หน่วยงานที่ร้องเรียน</h3>
          <p>${checkMark(!isAgency)} ร้องเรียนเจ้าหน้าที่ของรัฐ (กรณีมากกว่า 1 รายให้เพิ่มในรายละเอียดการร้องเรียน/เบาะแส)</p>
          <p>คำนำหน้านาม ${field('')} ชื่อ ${field(isAgency?'':accused)} นามสกุล ${field('')}</p>
          <p>ตำแหน่ง ${field('')} สังกัด ${field(isAgency?'':accused)}</p>
          <p>กรม ${field('')} กระทรวง ${field('')}</p>
          <p>${checkMark(isAgency)} ร้องเรียนหน่วยงาน กรม ${field(isAgency?accused:'')} กระทรวง/อื่น ๆ ${field('')}</p>
          <p>ชื่อโครงการที่ต้องการร้องเรียน (ถ้ามี) ${field(c.subject)}</p>
          <h3>รายละเอียดการร้องเรียน/แจ้งเบาะแส</h3><div class="petition-detail">${escapeHtml(c.detail||'')}</div>
          <p class="petition-inline-sign">ลงชื่อ...(ผู้ร้อง)....................................................</p>
        </section>
        <section class="petition-section petition-followup">
          <p><strong>วันเวลาเกิดเหตุ</strong>&nbsp;&nbsp; วันที่ ................................................................... เวลาเกิดเหตุ ................................................</p>
          <p><strong>สถานที่เกิดเหตุ</strong>&nbsp;&nbsp; ตำบล ........................................................ อำเภอ ........................................................ จังหวัด ${field(c.province)}</p>
          <p><strong>ความเดือดร้อนเสียหายที่ได้รับ</strong> ${field(c.damage)}</p>
          <p><strong>มีความประสงค์ให้สำนักงาน ป.ป.ท. ดำเนินการ</strong> ${field(c.request)}</p>
          <p><strong>ในกรณีเดียวกันมีการร้องเรียนไปที่หน่วยงานอื่นใดหรือไม่ ผลดำเนินการเป็นประการใด</strong> ................................................................................................................................................................</p>
          <p><strong>ได้มอบเอกสารประกอบเรื่องร้องเรียน ดังนี้</strong></p>
          <div class="petition-attachments">${attachments.length?attachments.map((a,index)=>`<p>${index+1}. ${escapeHtml(attachmentName(a))}${escapeHtml(attachmentDetails(a))}</p>${attachmentDesc(a)?`<p class="petition-attachment-desc">${escapeHtml(attachmentDesc(a))}</p>`:''}`).join(''):'<p>............................................................................................................................................................</p><p>............................................................................................................................................................</p><p>............................................................................................................................................................</p>'}</div>
        </section>
        <div class="petition-signature"><p>ลงชื่อ .....................................................................</p><p>(${escapeHtml(c.complainant||'.................................................................')})</p><p>ผู้ร้องเรียน</p></div>
      </article>`;
  }
  function officialDocumentPlaceholder(state,id){
    const doc=OFFICIAL_DOCUMENTS[id];
    return `<article class="a4-paper document-placeholder official-document-placeholder" id="activePaper"><span>ปปท. ${escapeHtml(id)}</span><h2>${escapeHtml(doc?.name||'เอกสารทางราชการ')}</h2><p>${escapeHtml(documentRegisterLabel(doc||{register:'pending'}))}</p><small>ยังไม่มีเนื้อหาแบบพิมพ์ที่ยืนยันจากไฟล์ต้นฉบับ จึงไม่สร้างข้อความราชการแทน</small></article>`;
  }
  function documentPaper(state,id,role){
    if(role==='admin')return '';
    if(id===ALL_DOCUMENTS_ID)return combinedDocumentPaper(state,role);
    if([REVIEW_RECORD_ID,'form3','pcms'].includes(id))return form3Paper(state,role);
    if(id==='working-copy')return workingCopyPaper(state);
    if(id==='complainant-original')return complainantOriginalPaper(state);
    if(id==='duplicate-receipt'){const original=findOriginalCase(state.documentData?.screening?.linkedCaseId);if(!original?.caseData)return '<div class="document-placeholder">ไม่พบเรื่องเดิมสำหรับออกใบแจ้งเลขเดิม</div>';return duplicateReceiptPaper(state.caseData,original.caseData,qrForTracking(original.caseData.trackingYear))}
    if(id==='1-02')return f102Paper(state);
    const legacy={'pakfa':'1-01','n103':'1-03','f104':'1-04','f105':'1-05','f106':'1-06','f107':'1-07','paklap':'back-cover'};
    id=legacy[id]||id;
    if(id==='back-cover')return `<div class="document-placeholder" id="activePaper"><strong>ปกหน้า (แบบ 1-01)</strong><p>เอกสารนี้เป็นปกหน้าของชุดสำนวน — แบบพิมพ์จริงใช้แบบ 1-01 (ปกสำนวนการไต่สวน) ไม่มีปกหลังแยกต่างหาก</p></div>`;
    if(id==='1-01')return packDocumentPaper(state,'pakfa');
    if(id==='1-03')return packDocumentPaper(state,'n103');
    if(id==='1-04')return officialOutgoingDocument(state,'1-04');
    if(id==='1-05')return packDocumentPaper(state,'f105');
    if(id==='1-06')return packDocumentPaper(state,'f106');
    if(id==='1-07')return packDocumentPaper(state,'f107');
    if(id==='1-11')return officialOutgoingDocument(state,'1-11');
    return officialDocumentPlaceholder(state,id);
  }
  function fitFlowText(page,textNode,text){
    const characters=Array.from(text);
    let low=0,high=characters.length,best=0;
    while(low<=high){
      const middle=Math.floor((low+high)/2);
      textNode.textContent=characters.slice(0,middle).join('');
      if(page.scrollHeight<=page.clientHeight+1){best=middle;low=middle+1}else high=middle-1;
    }
    if(best===0){textNode.textContent='';return ['',text]}
    let cut=best;
    const floor=Math.floor(best*.7);
    for(let index=best;index>floor;index--){
      if(/[\s,.;:!?…ฯ]/u.test(characters[index-1]||'')){cut=index;break}
    }
    const current=characters.slice(0,cut).join('').trim();
    textNode.textContent=current;
    return [current,characters.slice(cut).join('').trim()];
  }
  function createFlowPage(sourcePage,heading,signature,opinionKey,editable){
    const page=document.createElement('article');
    page.className=sourcePage.className;
    page.classList.add('auto-flow-page');
    page.removeAttribute('id');
    page.removeAttribute('data-auto-paginate');
    const confidentialTop=sourcePage.querySelector('.confidential-top')?.cloneNode(true);
    const header=sourcePage.querySelector('.form3-header')?.cloneNode(true);
    const subject=sourcePage.querySelector('.official-subject')?.cloneNode(true);
    const confidentialBottom=sourcePage.querySelector('.confidential-bottom')?.cloneNode(true);
    if(confidentialTop)page.append(confidentialTop);
    if(header)page.append(header);
    if(subject)page.append(subject);
    const section=document.createElement('section');
    section.className='form3-flow-section';
    const title=document.createElement('h3');
    title.textContent=heading;
    const body=document.createElement('p');
    body.className='form3-flow-text';
    if(opinionKey){body.setAttribute('data-editable',opinionKey);if(editable){body.setAttribute('contenteditable','true');body.setAttribute('spellcheck','false')}}
    section.append(title,body);
    if(signature)section.append(signature);
    page.append(section);
    if(confidentialBottom)page.append(confidentialBottom);
    return {page,body,section};
  }
  function paginateFlowSection(pageSet,sourcePage,section){
    const textNode=section.querySelector('[data-flow-text]');
    const signature=section.querySelector('[data-keep-together]');
    const opinionKey=section.getAttribute('data-opinion-section')||textNode?.getAttribute('data-editable')||'';
    const editable=Boolean(textNode?.hasAttribute('contenteditable'));
    if(!textNode||!signature||sourcePage.scrollHeight<=sourcePage.clientHeight+1)return;
    const fullText=textNode.textContent.trim();
    const heading=section.querySelector('[data-flow-heading]')?.textContent.trim()||'';
    const signatureTemplate=signature.cloneNode(true);
    signature.remove();
    const [,initialRemainder]=fitFlowText(textNode,textNode,fullText);
    let remaining=initialRemainder;
    while(remaining){
      const finalCandidate=createFlowPage(sourcePage,heading,signatureTemplate.cloneNode(true),opinionKey,editable);
      pageSet.append(finalCandidate.page);
      finalCandidate.body.textContent=remaining;
      if(finalCandidate.page.scrollHeight<=finalCandidate.page.clientHeight+1)break;
      finalCandidate.section.lastElementChild.remove();
      const [,rest]=fitFlowText(finalCandidate.page,finalCandidate.body,remaining);
      if(rest===remaining){finalCandidate.body.textContent=remaining;break}
      remaining=rest;
    }
  }
  function autoPaginateDocument(stage){
    if(!stage||!stage.isConnected)return;
    stage.querySelectorAll('.auto-flow-page').forEach(page=>page.remove());
    stage.querySelectorAll('.a4-paper').forEach(page=>{
      page.classList.add('auto-pagination-source');
      page.removeAttribute('data-page-overflow');
    });
    stage.querySelectorAll('[data-auto-paginate]').forEach(sourcePage=>{
      const pageSet=sourcePage.closest('.document-page-set')||stage;
      sourcePage.querySelectorAll('[data-flow-section]').forEach(section=>paginateFlowSection(pageSet,sourcePage,section));
    });
    stage.querySelectorAll('.a4-paper:not(.auto-flow-page)').forEach(page=>{
      if(page.scrollHeight>page.clientHeight+1)page.dataset.pageOverflow='true';
    });
    stage.querySelectorAll('.document-page-set').forEach(pageSet=>{
      const pages=pageSet.querySelectorAll('.a4-paper');
      if(pages.length>1)pages.forEach((pg,index)=>{
        let num=pg.querySelector('.document-page-number');
        if(!num){num=document.createElement('span');num.className='document-page-number';pg.append(num)}
        num.textContent='หน้า '+(index+1);
      });
    });
  }
  function scheduleDocumentPagination(stage){
    if(!stage)return Promise.resolve();
    const token=String((Number(stage.dataset.renderToken)||0)+1);
    stage.dataset.renderToken=token;
    const ready=document.fonts?.ready||Promise.resolve();
    return ready.catch(()=>{}).then(()=>{
      if(stage.dataset.renderToken===token)autoPaginateDocument(stage);
    });
  }
  function renderDocumentInto(stage,html){
    if(!stage)return Promise.resolve();
    stage.innerHTML=html;
    return scheduleDocumentPagination(stage);
  }
  function stagebar(state){
    const w=state.workflow,d=state.documentData;
    if(w.stage==='duplicate-closed'){
      const linked=w.status.replace(/^เรื่องซ้ำ — รวมกับเรื่องเดิม\s*/,'');
      return `<div class="ws-stage-summary"><div><span>ขั้นตอนปัจจุบัน</span><strong>${escapeHtml(w.status)}</strong><small>ผู้รับผิดชอบ: ${escapeHtml(ROLE_LABELS[w.owner]||w.owner||'ยังไม่ระบุ')}</small></div><div class="ws-stage-next"><span>ผลการกลั่นกรอง</span><strong>เรื่องซ้ำ — ไม่เข้าสายพานพิจารณา</strong></div><b>เรื่องซ้ำ</b></div><div class="ws-stage-caption"><span>กลั่นกรองโดยเจ้าหน้าที่</span><strong>เรื่องนี้ถูกรวมกับเรื่องเดิม${linked?` ${escapeHtml(linked)}`:''} — ไม่มีการออกเลขสำนวน/เลขขาออก</strong></div><div class="ws-stage-track"><span class="ws-stage-node done"><b>1</b><small>รับเรื่อง</small></span><span class="ws-stage-node done"><b>2</b><small>กลั่นกรองซ้ำ</small></span><span class="ws-stage-node done"><b>3</b><small>รวมกับเรื่องเดิม</small></span></div>`;
    }
    const branchLabel=w.stage==='anonymous-box'||(d.decision==='not-accept'&&d.anonymous)
      ?'กล่องบัตรสนเท่ห์'
      :w.stage==='nacc-dispatch'||d.decision==='send-nacc'
        ?'เจ้าหน้าที่จัดส่งสำนักงาน ป.ป.ช.'
        :['officer-dispatch','activity5-dispatch'].includes(w.stage)||['18/1ก','18/1ข','18/4'].includes(d.decision)
          ?'เจ้าหน้าที่จัดส่งไปยังเขต'
          :'ผู้อำนวยการกองบริหารคดี มีคำสั่ง';
    // เฉพาะขั้นของระบบรับเรื่อง (ขั้น 1-5) — ขั้น 6-15 อยู่ในระบบไต่สวน
    const JOURNEY=['รับเรื่อง','กลั่นกรอง/มอบหมาย','พิจารณา Form 3','อนุมัติ/เลขสำนวน',branchLabel];
    const assigned=state.assignmentHistory.length>0||Boolean(d.assignedOfficer);
    const stageIndex={admin:assigned?1:0,officer:2,center:3,division:4,acting:4,'division-order':4,'anonymous-box':4,'nacc-dispatch':4,'officer-dispatch':4,'activity5-dispatch':4};
    const currentIndex=Math.min(stageIndex[w.stage]??0,JOURNEY.length-1);
    const terminalComplete=w.complete&&currentIndex===JOURNEY.length-1;
    const currentLabel=terminalComplete?'ดำเนินการเสร็จสิ้น':w.status;
    const nextLabel=terminalComplete?'ไม่มีขั้นตอนถัดไป':JOURNEY[currentIndex+1]||'รอผลการดำเนินการ';
    const nodes=JOURNEY.map((label,index)=>{
      const status=index<currentIndex||(terminalComplete&&index===currentIndex)?'done':index===currentIndex?'active':'pending';
      return `<span class="ws-stage-node ${status}" title="${escapeHtml(label)}"><b>${index+1}</b><small>${escapeHtml(label)}</small></span>`;
    }).join('');
    const completedCount=currentIndex+(terminalComplete?1:0);
    return `<div class="ws-stage-summary"><div><span>ขั้นตอนปัจจุบัน</span><strong>${escapeHtml(currentLabel)}</strong><small>ผู้รับผิดชอบ: ${escapeHtml(ROLE_LABELS[w.owner]||w.owner||'ยังไม่ระบุ')}</small></div><div class="ws-stage-next"><span>ขั้นตอนถัดไป</span><strong>${escapeHtml(nextLabel)}</strong></div><b>ขั้นตอน ${currentIndex+1} / ${JOURNEY.length}</b></div><div class="ws-stage-caption"><span>แสดงลำดับการดำเนินงานของเรื่องนี้</span><strong>ผ่านแล้ว ${completedCount} ขั้น · รออีก ${JOURNEY.length-completedCount-(terminalComplete?0:1)} ขั้น</strong></div><div class="ws-stage-track">${nodes}</div>`;
  }
  function miniStagebar(state){
    const w=state.workflow,d=state.documentData;
    if(w.stage==='duplicate-closed'){
      const steps=['รับเรื่อง','กลั่นกรองซ้ำ','รวมกับเรื่องเดิม'];
      return `<div class="mini-stagebar">${steps.map((label,i)=>`${i?'<span class="mini-stage-line done"></span>':''}<span class="mini-stage-dot done" title="${escapeHtml(label)}"></span>`).join('')}<span class="mini-stage-label">${escapeHtml(w.status)}</span></div>`;
    }
    const branchLabel=w.stage==='anonymous-box'||(d.decision==='not-accept'&&d.anonymous)
      ?'กล่องบัตรสนเท่ห์'
      :w.stage==='nacc-dispatch'||d.decision==='send-nacc'
        ?'เจ้าหน้าที่จัดส่งสำนักงาน ป.ป.ช.'
        :['officer-dispatch','activity5-dispatch'].includes(w.stage)||['18/1ก','18/1ข','18/4'].includes(d.decision)
          ?'เจ้าหน้าที่จัดส่งไปยังเขต'
          :'ผู้อำนวยการกองบริหารคดี มีคำสั่ง';
    const JOURNEY=['รับเรื่อง','กลั่นกรอง/มอบหมาย','พิจารณา Form 3','อนุมัติ/เลขสำนวน',branchLabel];
    const assigned=state.assignmentHistory.length>0||Boolean(d.assignedOfficer);
    const stageIndex={admin:assigned?1:0,officer:2,center:3,division:4,acting:4,'division-order':4,'anonymous-box':4,'nacc-dispatch':4,'officer-dispatch':4,'activity5-dispatch':4};
    const currentIndex=Math.min(stageIndex[w.stage]??0,JOURNEY.length-1);
    const terminalComplete=w.complete&&currentIndex===JOURNEY.length-1;
    const currentLabel=terminalComplete?'ดำเนินการเสร็จสิ้น':w.status;
    return `<div class="mini-stagebar">${JOURNEY.map((label,i)=>{
      const status=i<currentIndex||(terminalComplete&&i===currentIndex)?'done':i===currentIndex?'current':'';
      return `${i?`<span class="mini-stage-line ${i<=currentIndex?'done':''}"></span>`:''}<span class="mini-stage-dot ${status}" title="${escapeHtml(label)}"></span>`;
    }).join('')}<span class="mini-stage-label">${escapeHtml(currentLabel)}</span></div>`;
  }
  function officialOutgoingDocument(state,id){
    const c=caseView(state),d=state.documentData;
    const signature=`<div class="official-signature"><p>(........................................................)</p><p>${id==='1-04'?'ผู้อำนวยการสำนัก/กอง':'เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ'}</p>${id==='1-11'?'<p>หรือผู้ที่ได้รับมอบหมาย</p>':''}</div>`;
    if(id==='1-04')return `<article class="a4-paper template-memo" id="activePaper">
      <div class="memo-heading"><img class="memo-garuda" src="${GARUDA_IMAGE}" alt="ตราครุฑ"><h2>บันทึกข้อความ</h2></div>
      <div class="memo-metadata"><p><strong>ส่วนราชการ</strong> สำนัก/กอง ........................................................ <strong>โทร.</strong> ........................</p><p><strong>ที่</strong> ${outgoingAt(state,id)||'ปป ๐๐ ....../........'} <strong>วันที่</strong> ........................................................</p><p><strong>เรื่อง</strong> ส่งสำนวนเรื่องกล่าวหาร้องเรียน กรณี <span class="doc-editable" data-editable="documentSubject" contenteditable="true" spellcheck="false">${escapeHtml(d.documentSubject||c.subject)}</span>${d.caseNumber?' '+escapeHtml(d.caseNumber):''}</p><p><strong>เรียน</strong> ผู้อำนวยการสำนัก/กอง</p></div>
      <div class="official-body"><p>ตามที่พระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริตในภาครัฐ พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม ตามมาตรา ๑๘/๔ (๒) กำหนดให้ ในกรณีที่เป็นเรื่องที่อยู่ในหน้าที่และอำนาจของคณะกรรมการ ป.ป.ท. ตามพระราชบัญญัตินี้และมิใช่เป็นกรณีที่ปรากฏว่าการกระทำของเจ้าหน้าที่ของรัฐมีลักษณะเป็นการทุจริตต่อหน้าที่รวมอยู่ด้วย และเรื่องนั้นมิได้รับมอบหมายจากคณะกรรมการ ป.ป.ช. ตามมาตรา ๑๘/๑ เมื่อเลขาธิการสั่งให้ดำเนินการต่อไปแล้ว ให้พนักงาน ป.ป.ท. มีอำนาจดำเนินการไต่สวนตามพระราชบัญญัตินี้ การไต่สวนดังกล่าวให้อยู่ภายใต้การกำกับดูแลของคณะกรรมการ ป.ป.ท. นั้น</p><p>ในการนี้ สำนัก/กอง ได้ตรวจสอบแล้ว พบว่าเป็นเรื่องร้องเรียนซึ่งอยู่ในอำนาจหน้าที่ จึงขอส่งเรื่องร้องเรียนกรณีประพฤติมิชอบให้ดำเนินการ คือ เรื่องที่ <strong><span class="doc-editable" data-editable="documentSubject" contenteditable="true" spellcheck="false">${escapeHtml(d.documentSubject||c.subject)}</span></strong> (เลขรับเรื่องที่ <strong>${escapeHtml(registryReceiptNumber(c)||'....................')}</strong> ลงวันที่ <strong>${escapeHtml(c.received)}</strong>) จำนวน <strong>${c.attachments.length}</strong> รายการ ทั้งนี้ เมื่อได้รับเรื่องแล้ว ให้พิจารณามอบหมายผู้รับผิดชอบสำนวนดำเนินการตามอำนาจหน้าที่ พร้อมสรุปพฤติการณ์โดยย่อและระบุชื่อเจ้าของสำนวนลงในระบบไต่สวนด้วย รายละเอียดตามเอกสารที่แนบมาพร้อมนี้</p><p>จึงเรียนมาเพื่อโปรดพิจารณา</p></div>${signature}<p class="official-form-code">ปปท. 1-04</p>
    </article>`;
    if(id==='1-11')return `<article class="a4-paper template-official-letter" id="activePaper">
      <div class="official-letter-head"><p><strong>ที่</strong> ${escapeHtml(d.naccLetterNo||'ปป ๐๐.../.....')}</p><p>สำนักงาน ป.ป.ท.<br>อาคารซอฟต์แวร์ปาร์ค ถนนแจ้งวัฒนะ<br>อำเภอปากเกร็ด จังหวัดนนทบุรี ๑๑๑๒๐</p></div>
      <p class="official-date">${escapeHtml(d.naccLetterDate||'(วัน เดือน ปี)')}</p>
      <div class="official-subject"><strong>เรื่อง</strong><span>ส่งเรื่องร้องเรียนเจ้าหน้าที่ของรัฐ กรณี <span class="doc-editable" data-editable="documentSubject" contenteditable="true" spellcheck="false">${escapeHtml(d.documentSubject||c.subject)}</span></span><strong>เรียน</strong><span>เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ</span><strong>สิ่งที่ส่งมาด้วย</strong><span>๑. บัญชีเรื่องร้องเรียน จำนวน .......... แผ่น<br>๒. ต้นฉบับเอกสารเรื่องร้องเรียน จำนวน ๑ เรื่อง</span></div>
      <div class="official-body"><p>ตามที่รัฐธรรมนูญแห่งราชอาณาจักรไทย พุทธศักราช ๒๕๖๐ มาตรา ๒๓๔ (๒) ได้กำหนดให้คณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ มีหน้าที่และอำนาจในการไต่สวนและวินิจฉัยว่าเจ้าหน้าที่ของรัฐร่ำรวยผิดปกติ กระทำความผิดฐานทุจริตต่อหน้าที่ หรือกระทำความผิดต่อตำแหน่งหน้าที่ราชการ หรือความผิดต่อตำแหน่งหน้าที่ในการยุติธรรม ประกอบกับพระราชบัญญัติประกอบรัฐธรรมนูญว่าด้วยการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๖๑ มาตรา ๕๙ และมาตรา ๑๘/๔ (๑) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม กำหนดให้ส่งเรื่องร้องเรียนที่อยู่ในหน้าที่และอำนาจของคณะกรรมการ ป.ป.ช. ให้คณะกรรมการ ป.ป.ช. ดำเนินการตามอำนาจหน้าที่ต่อไป นั้น</p><p>สำนักงาน ป.ป.ท. ได้รับเรื่องร้องเรียนกรณี <strong><span class="doc-editable" data-editable="documentSubject" contenteditable="true" spellcheck="false">${escapeHtml(d.documentSubject||c.subject)}</span></strong> จากการตรวจสอบพบว่า ${escapeHtml(d.reasons.join(' และ ')||'เรื่องอยู่ในหน้าที่และอำนาจของคณะกรรมการ ป.ป.ช.')} จึงขอส่งเรื่องร้องเรียนเจ้าหน้าที่ของรัฐ จำนวน ๑ เรื่อง ให้สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติพิจารณาดำเนินการตามอำนาจหน้าที่ต่อไป รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย ๑ และ ๒ ตามลำดับ</p><p>จึงเรียนมาเพื่อโปรดพิจารณา</p></div>${signature}
      <div class="official-contact"><p>กอง/สำนัก ........................................</p><p>โทร. ........................................ โทรสาร ........................................</p><p>เจ้าของสำนวน ${escapeHtml(d.assignedOfficer||'........................................')}</p></div>
      <p class="official-form-code">ปปท. 1-11</p>
    </article>`;
    return '<div class="document-placeholder">ยังไม่มีเอกสารที่ยืนยันสำหรับขั้นตอนนี้</div>';
  }
  function packDocumentPaper(state,id){
    const c=caseView(state),d=state.documentData,caseType=packCaseTypeOf(state);
    const signer=name=>`<p>(${escapeHtml(name||'.....................................')})</p>`;
    const decisionLabel={'18/1ก':'รับไว้ดำเนินการ 18/1 (ก)','18/1ข':'รับไว้ดำเนินการ 18/1 (ข)','18/4':'รับไว้ดำเนินการ 18/4','58/2':'ดำเนินการตาม 58/2','send-nacc':'ส่งสำนักงาน ป.ป.ช.','not-accept':'ไม่รับไว้ดำเนินการ'};
    if(id==='pakfa')return `<article class="a4-paper template-cover official-blue-cover" id="activePaper">
      <p class="official-page-label">หน้าที่ 1</p>
      <p class="cover-reference">ตัวอย่างปกสำนวนการไต่สวน<br>(ใช้ปกสีฟ้า)</p>
      <div class="cover-head"><img class="memo-garuda" src="${PACC_LOGO}" alt="ตราสำนักงาน ป.ป.ท."><div><h1>สำนวนการไต่สวน</h1><p>สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</p></div></div>
      <div class="cover-body">
        <p class="cover-subject"><strong>เรื่องที่</strong> ${escapeHtml(d.caseNumber||'ออกหลัง ผู้อำนวยการกองบริหารคดี ลงนามอนุมัติ')}</p>
        <div class="cover-parties">
          <div class="cover-party-line"><span>${escapeHtml(c.complainant||'.....................................')}${d.anonymous?' (ปกปิดตัวตน)':''}</span><b>ผู้กล่าวหา</b></div>
          <p class="cover-between">ระหว่าง</p>
          <div class="cover-party-line"><span>.........................................................</span><b>ผู้ถูกกล่าวหา</b></div>
        </div>
        <div class="cover-ground">
          <span>เป็นกรณีกล่าวหาว่ากระทำการ</span>
          <div class="cover-ground-options">
            <label><input type="checkbox" ${d.decision==='18/4'?'':'checked'} disabled> ทุจริตต่อหน้าที่</label>
            <label><input type="checkbox" ${d.decision==='18/4'?'checked':''} disabled> ประพฤติมิชอบ</label>
            <label><input type="checkbox" disabled> อื่น ๆ ................................</label>
          </div>
        </div>
        <p class="cover-field"><strong>ข้อกล่าวหา</strong> ${escapeHtml(c.detail||'.....................................')}</p>
        <p class="cover-field"><strong>เอกสารพยานหลักฐาน รวมจำนวน</strong> ${packTotal(state)} แผ่น</p>
        <p class="cover-sublist">- คำร้องเรียน/กล่าวหา จำนวน ${d.documentPack?.pages?.complainant||10} แผ่น<br>- เอกสารประกอบ จำนวน ......... แผ่น<br>- อื่น ๆ จำนวน .........</p>
        <p class="cover-field"><strong>สถานที่เกิดเหตุ</strong> ${escapeHtml(c.place||c.region||'.....................................')}<br><strong>วันเวลาที่เกิดเหตุ</strong> ${escapeHtml(c.received||'.....................................')}</p>
        <p class="cover-field"><strong>อายุความ</strong> .......... ปี <span class="cover-dim">ขาดอายุความ (ทุกฐานความผิด)</span> .................................</p>
        <p class="cover-field"><strong>สำนักที่รับผิดชอบ</strong> ${escapeHtml(d.proposedRegion||c.region||'.....................................')}</p>
        <p class="cover-field"><strong>สำนักงาน ป.ป.ท. รับเรื่อง</strong> วันที่ .......... เดือน ................. พ.ศ. ..........</p>
        <p class="cover-field"><strong>พนักงาน ป.ป.ท. ผู้รับผิดชอบสำนวนไต่สวน</strong> ${escapeHtml(d.assignedOfficer||'.....................................')}<br><strong>เจ้าหน้าที่ ป.ป.ท. ผู้ช่วย</strong> ${escapeHtml(d.backupOfficer||'.....................................')}</p>
      </div>
      <p class="official-form-code">ปปท. 1-01</p>
    </article>`;
    if(id==='n103')return `<div class="document-page-set official-n103-set" id="activePaper">
      <article class="a4-paper template-memo official-n103-page">
        <p class="official-page-label">หน้าที่ 4</p>
        <p class="official-sample-title">ตัวอย่างบันทึกการตรวจสอบเรื่องร้องเรียน</p>
        <aside class="memo-receipt-box"><strong>ศูนย์รับเรื่องร้องเรียน</strong><span>เลขรับ ..........</span><span>วันที่ ...............</span></aside>
        <div class="memo-heading"><img class="memo-garuda" src="${GARUDA_IMAGE}" alt="ตราครุฑ"><h2>บันทึกข้อความ</h2></div>
        <div class="memo-metadata"><p><strong>ส่วนราชการ</strong> กองบริหารคดี ศูนย์รับเรื่องร้องเรียน <strong>โทร.</strong> ๑๙๐๕</p><p><strong>ที่</strong> ${outgoingAt(state,id)||'ปป ๐๐ ........................................'} <strong>วันที่</strong> ........................................</p></div>
        <div class="official-subject"><strong>เรื่อง</strong><span>การตรวจสอบเรื่องร้องเรียน เรื่องที่ <span class="doc-editable" data-editable="documentSubject" contenteditable="true" spellcheck="false">${escapeHtml(d.documentSubject||c.subject)}</span>${d.caseNumber?' '+escapeHtml(d.caseNumber):''}</span><strong>เรียน</strong><span>เลขาธิการคณะกรรมการ ป.ป.ท.</span></div>
        <div class="official-body n103-body">
          <p>ตามที่พระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริตในภาครัฐ พ.ศ. 2551 และที่แก้ไขเพิ่มเติม ตามมาตรา 18/1 ในการดำเนินงานเกี่ยวกับเรื่องที่ได้รับมอบหมายจากคณะกรรมการ ป.ป.ช. และมาตรา 18/4 เมื่อความปรากฏต่อคณะกรรมการ ป.ป.ท. หรือสำนักงาน ว่าจะมีการกล่าวหาหรือไม่ ว่ามีเจ้าหน้าที่ของรัฐผู้ใดประพฤติมิชอบให้พนักงาน ป.ป.ท. มีอำนาจดำเนินการไต่สวนตามพระราชบัญญัตินี้ การไต่สวนดังกล่าวให้อยู่ภายใต้การกำกับดูแลของคณะกรรมการ ป.ป.ท. ซึ่งสำนักงาน ป.ป.ช. ประจำจังหวัด ............................. มีหนังสือ ลับ ที่ ปช .......................... ลงวันที่ ...................................... ส่งเรื่องตามเลขติดตามที่ ต1 .......................... ให้สำนักงาน ป.ป.ท. พิจารณาดำเนินการ กรณีคณะกรรมการ ป.ป.ช. มีมติในการประชุม ครั้งที่ ............... เมื่อวันที่ ..................................... มอบหมายให้คณะกรรมการ ป.ป.ท. ดำเนินการแทน ตามพระราชบัญญัติประกอบรัฐธรรมนูญว่าด้วยการป้องกันและปราบปรามการทุจริต พ.ศ. 2561 มาตรา 62</p>
          <p>๑. ผู้กล่าวหา/ร้องเรียน : ${escapeHtml(c.complainant||'......................................................................................................................')}${d.anonymous?' (ปกปิดตัวตน)':''}</p>
          <p>๒. ผู้ถูกร้องเรียน : ${escapeHtml(c.agency||'............................................................................................................................')}</p>
          <p>๓. สถานที่เกิดเหตุ : ${escapeHtml(c.place||'..............................................................................................................')}</p>
          <p>๔. ข้อพิจารณา/ข้อเสนอ : เห็นควรพิจารณา ดังนี้</p>
          <p>๔.๑ กรณีดำเนินการเกี่ยวกับสำนวนที่มีการกล่าวหาเจ้าหน้าที่ของรัฐกระทำการประพฤติมิชอบ ตามมาตรา 18/4 (2) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. 2551 และที่แก้ไขเพิ่มเติม มีผลบังคับใช้เมื่อวันที่ 19 กุมภาพันธ์ 2568 ได้บัญญัติให้คณะกรรมการ ป.ป.ท. มีอำนาจพิจารณากรณีกล่าวหาเจ้าหน้าที่ของรัฐกระทำการประพฤติมิชอบ และคณะกรรมการ ป.ป.ท. มีมติในการประชุมครั้งที่ 12/2568 เมื่อวันที่ 19 กุมภาพันธ์ 2568 เห็นชอบให้ใช้ระเบียบและประกาศคณะกรรมการ ป.ป.ท. ที่เกี่ยวข้องไปพลางก่อนจนกว่าจะมีการแก้ไขเพิ่มเติมให้สอดคล้องกับพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต และที่แก้ไขเพิ่มเติม</p>
          <p>๔.๒ กรณีดำเนินการเกี่ยวกับสำนวนที่รับมาจากสำนักงาน ป.ป.ช. คณะกรรมการ ป.ป.ท. มีมติการประชุมครั้งที่ 82/2561 เมื่อวันที่ 6 พฤศจิกายน 2561 กำหนดแนวทางดำเนินการเกี่ยวกับสำนวนที่ได้รับจากสำนักงาน ป.ป.ช. โดยมีมติว่า “ให้สำนักงาน ป.ป.ท. ดำเนินการตามระเบียบคณะกรรมการ ป.ป.ท. ว่าด้วยหลักเกณฑ์ วิธีการและเงื่อนไขเกี่ยวกับการแสวงหาข้อเท็จจริงและรวบรวมพยานหลักฐาน พ.ศ. 2559 และกฎหมายที่เกี่ยวข้องต่อไป”</p>
          <p>ทั้งนี้ ตามข้อ ๔.๑ – ๔.๒ ให้ดำเนินการตามที่บัญญัติไว้ตามกฎกระทรวงแบ่งส่วนราชการสำนักงาน ป.ป.ท. พ.ศ. 2560 ข้อ ๑๑, ข้อ 14, ข้อ 16 และข้อ ๑7 ประกอบกับประกาศสำนักนายกรัฐมนตรี เรื่อง กำหนดเขตพื้นที่ของสำนักงานป้องกันและปราบปรามการทุจริตในภาครัฐ เขต ๑ - ๙ และประกาศสำนักงาน ป.ป.ท. เรื่อง กำหนดส่วนราชการและหน่วยงานภาครัฐที่อยู่ในอำนาจและความรับผิดชอบของ กปท. ๑ – ๕ และหนังสือกองบริหารคดี ที่ ปป 0004/ว 315 ลงวันที่ 1 พฤศจิกายน 2567 ซึ่งเลขาธิการ</p>
        </div>
        <p class="official-form-code">ปปท. 1-03</p>
      </article>
      <article class="a4-paper template-memo official-n103-page">
        <p class="official-page-label">หน้าที่ 5</p>
        <p class="memo-continuation">- ๒ -</p>
        <div class="official-body n103-body n103-continuation">
          <p>คณะกรรมการ ป.ป.ท. ได้เห็นชอบและอนุมัติเมื่อวันที่ 18 ตุลาคม 2567 ให้มีการรับสำนวนคดีที่อยู่ในความรับผิดชอบของ ปปท. เขต 3 ปปท. เขต 4 ปปท. เขต ๕ และ ปปท. เขต ๖ โดยให้ กปท. 1 – 4 และ กอท. รับสำนวนที่คณะกรรมการ ป.ป.ช. มอบหมายให้คณะกรรมการ ป.ป.ท. ดำเนินการแทน ตามมาตรา ๖๒ แห่งพระราชบัญญัติประกอบรัฐธรรมนูญว่าด้วยการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๖๑ ไปดำเนินการตามอำนาจหน้าที่ ตั้งแต่วันที่ ๑ ตุลาคม 2567 เป็นต้นไป ต่อมา กบค. ได้หนังสือ ด่วนที่สุด ที่ ปป 0004/2306 ลงวันที่ 5 มีนาคม 2568 ซึ่งเลขาธิการคณะกรรมการ ป.ป.ท. ได้เห็นชอบและอนุมัติเมื่อวันที่ 3 มีนาคม 2568 ให้ระงับการจ่ายสำนวนคดีตามมาตรา 62 ที่อยู่ในความรับผิดชอบของ ปปท. เขต 6 ให้กับ กปท. 4 ตั้งแต่วันที่ 1 มีนาคม 2568 เป็นต้นไป และให้ กบค. จ่ายสำนวนคดีตามมาตรา 62 ที่อยู่ในอำนาจให้ ปปท. เขต 6 ดำเนินการตามอำนาจหน้าที่ต่อไป และคำสั่งสำนักงาน ป.ป.ท. ที่ 529/2560 เรื่อง มอบอำนาจในการพิจารณาเรื่องร้องเรียนกล่าวหา มอบหมายให้ผู้อำนวยการกองบริหารคดีมีอำนาจพิจารณามอบหมายเรื่องร้องเรียนกล่าวหา ซึ่งเรื่องร้องเรียนที่ ${escapeHtml(registryReceiptNumber(c)||'....................')} อยู่ในอำนาจของสำนักงาน ปปท. เขต ${escapeHtml(d.proposedRegion||'......')} จึงเห็นควรมอบหมายให้สำนักงาน ปปท. เขต ${escapeHtml(d.proposedRegion||'......')} ดำเนินการตามอำนาจหน้าที่ต่อไป และแจ้งผู้เกี่ยวข้องทราบ ทั้งนี้ ได้จัดส่งสำนวนคดีพร้อมเอกสาร จำนวน ${packTotal(state)} แผ่น และเอกสารชื่อผู้ใช้งานและรหัสผ่านสำหรับรายงานผลการติดตามเรื่องกล่าวหาตามมาตรา 65 จำนวน 1 แผ่น มาพร้อมนี้</p>
          <p>จึงเรียนมาเพื่อโปรดพิจารณา</p>
        </div>
        <div class="official-signature n103-signature">${signer(d.officerSignature?.signed?assignedOfficerName(d):'')}<p>เจ้าหน้าที่ ป.ป.ท./พนักงาน ป.ป.ท.</p></div>
        <div class="memo-opinion"><p><strong>ความเห็นผู้บังคับบัญชาชั้นต้น</strong> เห็นควรมอบหมายให้สำนักงานป้องกันและปราบปรามการทุจริตในภาครัฐ เขต ${escapeHtml(d.proposedRegion||'........')} ดำเนินการตามอำนาจหน้าที่ และแจ้งผู้เกี่ยวข้องทราบ</p>${signer('')}<p>เจ้าหน้าที่ ป.ป.ท./พนักงาน ป.ป.ท.<br>ผู้อำนวยการศูนย์รับเรื่องร้องเรียน</p></div>
        <div class="memo-opinion"><p><strong>ความเห็นผู้อำนวยการกอง</strong> เรื่องที่ ............................. เห็นควรดำเนินการตามเสนอ (ส่งสำนักงาน ปปท. เขต .....)</p>${signer('')}<p>ผู้อำนวยการกองบริหารคดี</p></div>
        <div class="memo-opinion"><p><strong>ความเห็นเลขาธิการคณะกรรมการ ป.ป.ท.</strong> เรื่องที่ ........................</p><p>- เห็นชอบ/ดำเนินการตามเสนอ</p><p>- ลงนามแล้ว</p>${signer('')}<p>ผู้อำนวยการกองบริหารคดี ปฏิบัติราชการแทน<br>เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</p></div>
        <p class="official-form-code">ปปท. 1-03</p>
      </article>
    </div>`;
    if(id==='n103Legacy')return `<article class="a4-paper template-memo" id="activePaper">
      <div class="memo-heading"><img class="memo-garuda" src="${GARUDA_IMAGE}" alt="ตราครุฑ"><h2>บันทึกข้อความ</h2></div>
      <div class="memo-metadata"><p><strong>ส่วนราชการ</strong> ศูนย์รับเรื่องร้องเรียน กองบริหารคดี <strong>โทร.</strong> ....................</p><p><strong>ที่</strong> ${outgoingAt(state,id)||'ปป ๐๐ ....../.........'} <strong>วันที่</strong> ${escapeHtml(c.received||todayTH())}</p></div>
      <div class="official-subject"><strong>เรื่อง</strong><span>การตรวจสอบเรื่องร้องเรียน เรื่องที่ <span class="doc-editable" data-editable="documentSubject" contenteditable="true" spellcheck="false">${escapeHtml(d.documentSubject||c.subject)}</span>${d.caseNumber?' '+escapeHtml(d.caseNumber):''}</span><strong>เรียน</strong><span>เลขาธิการคณะกรรมการ ป.ป.ท.</span></div>
      <div class="official-body">
        <p>ตามที่พระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริตในภาครัฐ พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม ตามมาตรา ๑๘/๑ ในการดำเนินงานเกี่ยวกับเรื่องที่ได้รับมอบหมายจากคณะกรรมการ ป.ป.ช. และมาตรา ๑๘/๔ เมื่อความปรากฏต่อคณะกรรมการ ป.ป.ท. หรือสำนักงาน ว่าจะมีการกล่าวหาหรือไม่ ว่ามีเจ้าหน้าที่ของรัฐผู้ใดประพฤติมิชอบให้พนักงาน ป.ป.ท. มีอำนาจดำเนินการไต่สวนตามพระราชบัญญัตินี้ การไต่สวนดังกล่าวให้อยู่ภายใต้การกำกับดูแลของคณะกรรมการ ป.ป.ท. ซึ่งสำนักงาน ป.ป.ช. ประจำจังหวัด .......................... มีหนังสือ ลับ ที่ ปช .......................... ลงวันที่ ...................................... ส่งเรื่องตามเลขติดตามที่ ต๑ .......................... ให้สำนักงาน ป.ป.ท. พิจารณาดำเนินการ กรณีคณะกรรมการ ป.ป.ช. มีมติในการประชุม ครั้งที่ ............... เมื่อวันที่ ..................................... มอบหมายให้คณะกรรมการ ป.ป.ท. ดำเนินการแทน ตามพระราชบัญญัติประกอบรัฐธรรมนูญว่าด้วยการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๖๑ มาตรา ๖๒</p>
        <p>• ผู้กล่าวหา/ร้องเรียน : ${escapeHtml(c.complainant||'......................................................')}${d.anonymous?' (ปกปิดตัวตน)':''}</p>
        <p>๒. ผู้ถูกร้องเรียน : ${escapeHtml(c.agency||'...............................................................................................')}</p>
        <p>๓. สถานที่เกิดเหตุ : ${escapeHtml(c.place||'..............................................................................................................')}</p>
        <p>๔. ข้อพิจารณา/ข้อเสนอ : เห็นควรพิจารณา ดังนี้</p>
        <p>๔.๑ กรณีดำเนินการเกี่ยวกับสำนวนที่มีการกล่าวหาเจ้าหน้าที่ของรัฐกระทำการประพฤติมิชอบ ตามมาตรา ๑๘/๔ (๒) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม มีผลบังคับใช้เมื่อวันที่ ๑๙ กุมภาพันธ์ ๒๕๖๘ ได้บัญญัติให้คณะกรรมการ ป.ป.ท. มีอำนาจพิจารณากรณีกล่าวหาเจ้าหน้าที่ของรัฐกระทำการประพฤติมิชอบ และคณะกรรมการ ป.ป.ท. มีมติในการประชุมครั้งที่ ๑๒/๒๕๖๘ เมื่อวันที่ ๑๙ กุมภาพันธ์ ๒๕๖๘ เห็นชอบให้ใช้ระเบียบและประกาศคณะกรรมการ ป.ป.ท. ที่เกี่ยวข้องไปพลางก่อนจนกว่าจะมีการแก้ไขเพิ่มเติมให้สอดคล้องกับพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต และที่แก้ไขเพิ่มเติม พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม</p>
        <p>๔.๒ กรณีดำเนินการเกี่ยวกับสำนวนที่รับมาจากสำนักงาน ป.ป.ช. คณะกรรมการ ป.ป.ท. มีมติการประชุมครั้งที่ ๘๒/๒๕๖๑ เมื่อวันที่ ๖ พฤศจิกายน ๒๕๖๑ กำหนดแนวทางดำเนินการเกี่ยวกับสำนวนที่ได้รับจากสำนักงาน ป.ป.ช. โดยมีมติว่า "ให้สำนักงาน ป.ป.ท. ดำเนินการตามระเบียบคณะกรรมการ ป.ป.ท. ว่าด้วยหลักเกณฑ์ วิธีการและเงื่อนไขเกี่ยวกับการแสวงหาข้อเท็จจริงและรวบรวมพยานหลักฐาน พ.ศ. ๒๕๕๙ และกฎหมายที่เกี่ยวข้องต่อไป"</p>
        <p>ทั้งนี้ ตามข้อ ๔.๑ – ๔.๒ ให้ดำเนินการตามที่บัญญัติไว้ตามกฎกระทรวงแบ่งส่วนราชการสำนักงาน ป.ป.ท. พ.ศ. ๒๕๖๐ ข้อ ๑๑, ข้อ ๑๔, ข้อ ๑๖ และข้อ ๑๗ ประกอบกับประกาศสำนักนายกรัฐมนตรี เรื่อง กำหนดเขตพื้นที่ ของสำนักงานป้องกันและปราบปรามการทุจริตในภาครัฐ เขต ๑ - ๙ และประกาศสำนักงาน ป.ป.ท. เรื่อง กำหนดส่วนราชการและหน่วยงานภาครัฐที่อยู่ในอำนาจและความรับผิดชอบของ กปท. ๑ – ๕ และหนังสือกองบริหารคดี ที่ ปป 0004/ว 315 ลงวันที่ ๑ พฤศจิกายน ๒๕๖๗ ซึ่งเลขาธิการคณะกรรมการ ป.ป.ท. ได้เห็นชอบและอนุมัติเมื่อวันที่ ๑๘ ตุลาคม ๒๕๖๗ ให้มีการรับสำนวนคดีที่อยู่ในความรับผิดชอบของ ปปท. เขต ๓ ปปท. เขต ๔ ปปท. เขต ๕ และ ปปท. เขต ๖ โดยให้ กปท. ๑ – ๔ และ กอท. รับสำนวนที่คณะกรรมการ ป.ป.ช. มอบหมายให้คณะกรรมการ ป.ป.ท. ดำเนินการแทน ตามมาตรา ๖๒ แห่งพระราชบัญญัติประกอบรัฐธรรมนูญว่าด้วยการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๖๑ ไปดำเนินการตามอำนาจหน้าที่ ตั้งแต่วันที่ ๑ ตุลาคม ๒๕๖๗ เป็นต้นไป ต่อมา กบค. ได้หนังสือ ด่วนที่สุด ที่ ปป 0004/2306 ลงวันที่ ๕ มีนาคม ๒๕๖๘ ซึ่งเลขาธิการคณะกรรมการ ป.ป.ท. ได้เห็นชอบและอนุมัติเมื่อวันที่ ๓ มีนาคม ๒๕๖๘ ให้ระงับการจ่ายสำนวนคดีตามมาตรา ๖๒ ที่อยู่ในความรับผิดชอบของ ปปท. เขต ๖ ให้กับ กปท. ๔ ตั้งแต่วันที่ ๑ มีนาคม ๒๕๖๘ เป็นต้นไป และให้ กบค. จ่ายสำนวนคดีตามมาตรา ๖๒ ที่อยู่ในอำนาจให้ ปปท. เขต ๖ ดำเนินการตามอำนาจหน้าที่ต่อไป และคำสั่งสำนักงาน ป.ป.ท. ที่ 529/2560 เรื่อง มอบอำนาจในการพิจารณาเรื่องร้องเรียนกล่าวหา มอบหมายให้ผู้อำนวยการกองบริหารคดีมีอำนาจพิจารณามอบหมายเรื่องร้องเรียนกล่าวหา ซึ่งเรื่องร้องเรียนที่ .................. อยู่ในอำนาจของ สำนักงาน ปปท. เขต ${escapeHtml(d.proposedRegion||'......')} จึงเห็นควรมอบหมายให้ สำนักงาน ปปท. เขต ${escapeHtml(d.proposedRegion||'......')} ดำเนินการตามอำนาจหน้าที่ต่อไป และแจ้งผู้เกี่ยวข้องทราบ ทั้งนี้ ได้จัดส่งสำนวนคดีพร้อมเอกสาร จำนวน ${packTotal(state)} แผ่น และเอกสาร ชื่อผู้ใช้งานและรหัสผ่านสำหรับรายงานผลการติดตามเรื่องกล่าวหาตามมาตรา ๖๕ จำนวน ๑ แผ่น มาพร้อมนี้</p>
        <p>จึงเรียนมาเพื่อโปรดพิจารณา</p>
      </div>
      <div class="official-signature">${signer(d.officerSignature?.signed?assignedOfficerName(d):'')}<p>เจ้าหน้าที่ ป.ป.ท./พนักงาน ป.ป.ท.</p></div>
      <div class="memo-opinion"><p><strong>ความเห็นผู้บังคับบัญชาชั้นต้น</strong> เห็นควรมอบหมายให้ สำนักงานป้องกันและปราบปรามการทุจริตในภาครัฐ เขต ${escapeHtml(d.proposedRegion||'........')} ดำเนินการตามอำนาจหน้าที่ และแจ้งผู้เกี่ยวข้องทราบ</p>${signer('')}<p>เจ้าหน้าที่ ป.ป.ท./พนักงาน ป.ป.ท. · ผู้อำนวยการศูนย์รับเรื่องร้องเรียน</p></div>
      <div class="memo-opinion"><p><strong>ความเห็นผู้อำนวยการกอง</strong> เรื่องที่ ............................. เห็นควรดำเนินการตามเสนอ . (ส่ง สำนักงาน ปปท. เขต .....)</p>${signer('')}<p>ผู้อำนวยการกองบริหารคดี</p></div>
      <div class="memo-opinion"><p><strong>ความเห็นเลขาธิการคณะกรรมการ ป.ป.ท.</strong> เรื่องที่ ........................</p><p>- เห็นชอบ/ดำเนินการตามเสนอ</p><p>- ลงนามแล้ว</p>${signer('')}<p>ผู้อำนวยการกองบริหารคดี ปฏิบัติราชการแทน<br>เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</p></div>
      <p class="official-form-code">ปปท. 1-03</p>
    </article>`;
    if(id==='f104')return `<article class="a4-paper template-memo" id="activePaper">
      <div class="memo-heading"><img class="memo-garuda" src="${GARUDA_IMAGE}" alt="ตราครุฑ"><h2>บันทึกข้อความ</h2></div>
      <div class="memo-metadata"><p><strong>ส่วนราชการ</strong> สำนัก/กอง ........................................................ <strong>โทร.</strong> ........................</p><p><strong>ที่</strong> ${outgoingAt(state,id)||'ปป ๐๐ ....../........'} <strong>วันที่</strong> ${escapeHtml(todayTH())}</p></div>
      <div class="official-subject"><strong>เรื่อง</strong><span>ส่งสำนวนเรื่องกล่าวหาร้องเรียนที่อยู่ในความรับผิดชอบ (คดีประพฤติมิชอบ)</span><strong>เรียน</strong><span>ผอ. สำนัก/กอง</span></div>
      <div class="official-body"><p>ตามที่พระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต ในภาครัฐ พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม ตามมาตรา ๑๘/๔ (๒) กำหนดให้ ในกรณีที่เป็นเรื่องที่อยู่ในหน้าที่และอำนาจของคณะกรรมการ ป.ป.ท. ตามพระราชบัญญัตินี้และมิใช่เป็นกรณีที่ปรากฏว่าการกระทำของเจ้าหน้าที่ของรัฐเป็นความผิดฐานทุจริตต่อหน้าที่ ให้คณะกรรมการ ป.ป.ท. มีหนังสือแจ้งให้หน่วยงานที่เกี่ยวข้องดำเนินการตามอำนาจหน้าที่ นั้น</p>
        <p>ในการนี้ (สำนัก/กอง) ............ ได้ตรวจสอบแล้ว พบว่าเป็นเรื่องร้องเรียนซึ่งอยู่ในอำนาจหน้าที่ ของ (สำนัก/กอง) จึงขอส่งเรื่องร้องเรียนกรณีประพฤติมิชอบให้ท่านดำเนินการ คือ เรื่องที่ ${escapeHtml(registryReceiptNumber(c)||'....................')} (เลขรับเรื่องที่ .................. ลงวันที่ .........................) จำนวน ${packTotal(state)} แผ่น ทั้งนี้ เมื่อได้รับเรื่องแล้ว ให้ (สำนัก/กอง) พิจารณามอบหมายผู้รับผิดชอบสำนวนดำเนินการตามอำนาจหน้าที่พร้อมสรุปพฤติการณ์โดยย่อ ระบุชื่อเจ้าของสำนวนลงในระบบไต่สวนด้วย รายละเอียดตามเอกสารที่แนบมาพร้อมนี้</p>
        <p>จึงเรียนมาเพื่อโปรดพิจารณา</p></div>
      <div class="official-signature">${signer('')}<p>ผอ. สำนัก/กอง</p></div>
      <p class="official-form-code">ปปท. 1-04</p>
    </article>`;
    if(id==='f105')return `<article class="a4-paper template-memo" id="activePaper">
      <div class="memo-heading"><img class="memo-garuda" src="${GARUDA_IMAGE}" alt="ตราครุฑ"><h2>บันทึกข้อความ</h2></div>
      <div class="memo-metadata"><p><strong>ส่วนราชการ</strong> สำนัก/กอง ........................................................ <strong>โทร.</strong> ........................</p><p><strong>ที่</strong> ${outgoingAt(state,id)||'ปป ๐๐ ....../........'} <strong>วันที่</strong> ${escapeHtml(todayTH())}</p></div>
      <div class="official-subject"><strong>เรื่อง</strong><span>ส่งสำนวนเรื่องกล่าวหาร้องเรียนที่อยู่ในความรับผิดชอบ (คดีรับจาก ป.ป.ช. ตามมาตรา 62)</span><strong>เรียน</strong><span>ผอ. สำนัก/กอง</span></div>
      <div class="official-body"><p>ด้วย สำนักงาน ป.ป.ท. ได้รับเรื่องร้องเรียนกล่าวหาจากสำนักงาน ป.ป.ช. กรณีคณะกรรมการ ป.ป.ช. มีมติในการประชุมให้ส่งเรื่องให้คณะกรรมการ ป.ป.ท. ดำเนินการแทน ตามพระราชบัญญัติประกอบรัฐธรรมนูญว่าด้วยการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๖๑ มาตรา ๖๒ ประกอบกับคณะกรรมการ ป.ป.ท. มีมติในการประชุมครั้งที่ ๘๒/๒๕๖๑ เมื่อวันที่ ๖ พฤศจิกายน ๒๕๖๑ กำหนดแนวทางในการดำเนินการเกี่ยวกับสำนวนคดีที่ได้รับมาจากสำนักงาน ป.ป.ช. โดยมีมติว่าให้ "สำนักงาน ป.ป.ท. ดำเนินการตามระเบียบคณะกรรมการ ป.ป.ท. ว่าด้วยหลักเกณฑ์ วิธีการ และเงื่อนไขเกี่ยวกับการแสวงหาข้อเท็จจริงและรวบรวมพยานหลักฐาน พ.ศ. ๒๕๕๙ และกฎหมายที่เกี่ยวข้องต่อไป" ตามหนังสือกลุ่มงานคณะกรรมการ กองบริหารคดี ที่ ปป ๐๐๐๔/ว ๑๐๕ ลงวันที่ ๑๒ พฤศจิกายน ๒๕๖๑</p>
        <p>ในการนี้ (สำนัก/กอง) พิจารณาแล้วเห็นว่ากรณีการร้องเรียนดังกล่าวอยู่ในความรับผิดชอบของ (สำนัก/กอง) จึงขอส่งเรื่องให้ท่านดำเนินการ จำนวน ......... เรื่อง คือ เรื่องที่ ${escapeHtml(registryReceiptNumber(c)||'....................')} (เลขรับศูนย์รับเรื่องร้องเรียน ............. วันที่ ..........................) พร้อมเอกสารประกอบ จำนวน ${packTotal(state)} แผ่น ทั้งนี้ สำนักงาน ป.ป.ช. ประจำจังหวัด .................. (ได้/มิได้ ส่งข้อมูลผู้ใช้งาน ชื่อผู้ใช้งาน และรหัสผ่าน สำหรับรายงานผลการติดตามเรื่องกล่าวหาตามมาตรา 65 ด้วยแล้ว/มาให้แต่อย่างใด) ดังนั้น เมื่อได้รับเรื่องแล้วขอให้ (สำนัก/กอง) พิจารณามอบหมายเจ้าหน้าที่ผู้รับผิดชอบสำนวนดำเนินการตามอำนาจหน้าที่ พร้อมสรุปพฤติการณ์โดยย่อ ระบุชื่อเจ้าของสำนวนลงในระบบไต่สวน ทั้งนี้ หากปรากฎว่าสำนักงาน ป.ป.ช. มิได้ส่งข้อมูลผู้ใช้งาน และรหัสผ่านมาพร้อมกับสำนวนคดี ให้เจ้าของสำนวนคดีประสานขอข้อมูลผู้ใช้งาน และรหัสผ่าน สำหรับรายงานผลการติดตามเรื่องกล่าวหาตามมาตรา 65 ไปยังสำนักงาน ป.ป.ช. ประจำจังหวัด ..................... โดยตรง รายละเอียดตามเอกสารที่ส่งมาพร้อมนี้</p>
        <p>จึงเรียนมาเพื่อโปรดพิจารณา</p></div>
      <div class="official-signature">${signer('')}<p>ผอ. สำนัก/กอง</p></div>
      <p class="official-form-code">ปปท. 1-05</p>
    </article>`;
    if(id==='f106')return `<article class="a4-paper template-official-letter" id="activePaper">
      <div class="official-letter-head"><p><strong>ที่</strong> ปป ๐๐...../.........</p><p>สำนักงาน ป.ป.ท.<br>อาคารซอฟต์แวร์ปาร์ค ถนนแจ้งวัฒนะ<br>อำเภอปากเกร็ด จังหวัดนนทบุรี ๑๑๑๒๐</p></div>
      <p class="official-date">${escapeHtml(todayTH())}</p>
      <div class="official-subject"><strong>เรื่อง</strong><span>การรับเรื่องร้องเรียน</span><strong>เรียน</strong><span>${escapeHtml(c.complainant||'...................(ผู้ร้องเรียน).............................................')}</span><strong>อ้างถึง</strong><span>หนังสือร้องเรียนของท่าน ฉบับลงวันที่ .....................................</span></div>
      <div class="official-body"><p>ตามที่อ้างถึง ท่านได้ร้องเรียนกล่าวหาต่อสำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ (สำนักงาน ป.ป.ท.) กรณีเจ้าหน้าที่ของรัฐกระทำการทุจริตในภาครัฐ ความละเอียดแจ้งแล้ว นั้น</p>
        <p>บัดนี้ สำนักงาน ป.ป.ท. ได้รับเรื่องดังกล่าวไว้ดำเนินการแล้ว เป็นเรื่องที่ <span class="doc-editable" data-editable="documentSubject" contenteditable="true" spellcheck="false">${escapeHtml(d.documentSubject||c.subject)}</span> (เลขรับเรื่องที่ ${escapeHtml(registryReceiptNumber(c)||'....................')} วันที่ ............................) โดยได้มอบหมายให้ (ระบุสำนัก/กอง) ทั้งนี้ หากท่านประสงค์จะทราบรายละเอียดความคืบหน้าผลการดำเนินงาน ท่านสามารถติดต่อสอบถามข้อมูลได้ที่ (สำนัก/กอง/ที่ตั้ง)</p>
        <p>จึงเรียนมาเพื่อทราบ</p>
        <p class="official-thanks">ขอแสดงความนับถือ</p></div>
      <div class="official-signature">${signer('')}<p>เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</p><p>หรือผู้ที่ได้รับมอบหมาย</p></div>
      <div class="official-contact"><p>กอง/สำนัก ........................................</p><p>โทร. ........................................ โทรสาร ........................................</p><p>${escapeHtml(d.assignedOfficer?'(นาย/นาง/นางสาว '+d.assignedOfficer+' เจ้าของสำนวน)':'(นาย/นาง/นางสาว .................................. เจ้าของสำนวน)')}</p></div>
      <p class="official-form-code">ปปท. 1-06</p>
    </article>`;
    if(id==='f107')return `<article class="a4-paper template-official-letter official-letter-107" id="activePaper">
      <div class="official-letter-head"><p><strong>ที่</strong> ปป ๐๐...../.........</p><p>สำนักงาน ป.ป.ท.<br>อาคารซอฟต์แวร์ปาร์ค ถนนแจ้งวัฒนะ<br>อำเภอปากเกร็ด จังหวัดนนทบุรี ๑๑๑๒๐</p></div>
      <p class="official-date">${escapeHtml(todayTH())}</p>
      <div class="official-subject"><strong>เรื่อง</strong><span>การรับเรื่องร้องเรียน</span><strong>เรียน</strong><span>${escapeHtml(c.complainant||'............................................................')}</span><strong>อ้างถึง</strong><span>หนังสือร้องเรียนของท่าน ฉบับลงวันที่ ..........................................................</span></div>
      <div class="official-body"><p>ตามที่อ้างถึง ท่านได้ร้องเรียนไว้ต่อคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ (คณะกรรมการ ป.ป.ช.) กรณีกล่าวหาร้องเรียนเจ้าหน้าที่ของรัฐ สังกัด ${escapeHtml(c.agency||'...............................................')} มีพฤติการณ์ ${escapeHtml(c.detail||'..............................................................')} นั้น</p>
        <p>บัดนี้ คณะกรรมการ ป.ป.ช. ได้มอบหมายเรื่องดังกล่าวให้คณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ (คณะกรรมการ ป.ป.ท.) ดำเนินการแทนตามพระราชบัญญัติประกอบรัฐธรรมนูญว่าด้วยการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๖๑ มาตรา ๖๒ โดยให้คณะกรรมการ ป.ป.ท. ดำเนินการตามอำนาจหน้าที่ที่กำหนดไว้ในพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม ซึ่งสำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ ได้รับเรื่องร้องเรียนดังกล่าวไว้ดำเนินการในส่วนที่เกี่ยวข้องแล้ว ตามเลขรับศูนย์รับเรื่องร้องเรียนที่ ${escapeHtml(registryReceiptNumber(c)||'....................')} ลงวันที่ ..................... (เรื่องที่ ...............) ซึ่งเรื่องร้องเรียนดังกล่าว อยู่ในอำนาจหน้าที่ของ (กอง/สำนัก) ทั้งนี้ หากประสงค์จะทราบรายละเอียดความคืบหน้าผลการดำเนินงาน ท่านสามารถติดต่อสอบถามข้อมูลได้ที่ (สำนัก/กอง/ที่ตั้ง)</p>
        <p>จึงเรียนมาเพื่อทราบ</p>
        <p class="official-thanks">ขอแสดงความนับถือ</p></div>
      <div class="official-signature">${signer('')}<p>เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</p><p>หรือผู้ที่ได้รับมอบหมาย</p></div>
      <div class="official-contact official-contact-107"><p>กอง/สำนัก ........................................</p><p>โทร. ........................................ โทรสาร ........................................</p><p>${escapeHtml(d.assignedOfficer?'(นาย/นาง/นางสาว '+d.assignedOfficer+' เจ้าของสำนวน)':'(นาย/นาง/นางสาว .................................. เจ้าของสำนวน)')}</p></div>
      <p class="official-form-code official-form-code-107">ปปท. 1-07</p>
    </article>`;
    if(id==='pcms')return form3Paper(state);
    if(id==='paklap')return `<div class="document-placeholder" id="activePaper"><strong>ปกหน้า (แบบ 1-01)</strong><p>เอกสารนี้เป็นปกหน้าของชุดสำนวน — แบบพิมพ์จริงใช้แบบ 1-01 (ปกสำนวนการไต่สวน) ไม่มีปกหลังแยกต่างหาก</p></div>`;
    return '<div class="document-placeholder">ยังไม่มีเอกสารนี้ในชุดของกรณีนี้</div>';
  }
  function renderWalkin(){
    const params=new URLSearchParams(location.search);
    const intakeRole=params.get('role')||'';
    const requestedRegion=params.get('region')||'';
    const regionalIntake=intakeRole==='regional-officer';
    const regionalRegion=REGIONAL_REGIONS.includes(requestedRegion)?requestedRegion:'เขต 1';
    document.body.classList.add('walkin-mode');
    const shell=document.createElement('div');shell.className='a4-walkin-shell';shell.innerHTML=`${header(false)}<main class="ws-container"><div class="ws-page-head"><div><p class="ws-kicker">ช่องทางรับเรื่อง</p><h1>บันทึกข้อมูลเรื่องร้องเรียน</h1><p>กรอกข้อมูล ตรวจสอบเอกสาร และลงรับเรื่องเพื่อออกใบแจ้งเลขติดตาม</p></div></div><div class="document-workspace"><section class="ws-card ws-editor"><header class="ws-editor-head"><div><p class="ws-kicker">1-02 / แบบแจ้งการร้องเรียน/เบาะแส</p><h2>ข้อมูลเรื่องร้องเรียน</h2></div><span class="ws-status">กำลังจัดทำ</span></header><div class="ws-editor-body"><div class="ws-section"><h3>ข้อมูลผู้ร้อง</h3><div class="ws-grid-2"><div class="ws-field"><label>ชื่อ-นามสกุลผู้ร้อง</label><input id="wiComplainant" value="นายสมชาย ใจดี"></div><div class="ws-field"><label>เลขบัตรประชาชน</label><input id="wiCitizen" value="1-1001-00123-45-6"></div><div class="ws-field"><label>โทรศัพท์</label><input id="wiPhone" value="0812345678"></div><div class="ws-field"><label>อีเมล</label><input id="wiEmail" value="somchai@example.com"></div></div></div><div class="ws-section"><h3>รายละเอียดคำร้อง</h3><div class="ws-grid-2"><div class="ws-field ws-field-full"><label>ชื่อเรื่องร้องเรียน</label><input id="wiSubject" value="ร้องเรียนการจัดซื้อวัสดุสำนักงานไม่เป็นไปตามระเบียบ"></div><div class="ws-field"><label>ชื่อผู้ถูกร้อง/หน่วยงาน</label><input id="wiAccused" value="สำนักงานจัดการทรัพย์สินภาครัฐ"></div><div class="ws-field"><label>ตำแหน่ง/สังกัด</label><input id="wiPosition" value="เจ้าหน้าที่ผู้รับผิดชอบโครงการ"></div><div class="ws-field ws-field-full"><label>รายละเอียดพฤติการณ์</label><textarea id="wiDetail">ผู้ถูกร้องมีพฤติการณ์จัดซื้อวัสดุสำนักงานโดยไม่ปฏิบัติตามระเบียบและอาจเอื้อประโยชน์แก่ผู้เสนอราคารายหนึ่ง</textarea><small>ระบุบุคคล การกระทำ วันเวลา สถานที่ และความเกี่ยวข้องกับผู้ร้องให้ชัดเจน</small></div><div class="ws-field ws-field-full"><label>วัน–เวลาเกิดเหตุ</label><div class="incident-datetime"><div class="thai-date-field"><button type="button" class="thai-date-display" id="wiIncidentDateTrigger"><span id="wiIncidentDateDisplayText">เลือกวันที่เกิดเหตุ</span></button><input type="hidden" id="wiIncidentDate"><div class="thai-calendar-popover ws-hidden" id="wiThaiCalendarPopover" role="dialog" aria-label="เลือกวันที่เกิดเหตุ (ปฏิทินไทย)"><div class="tc-header"><button type="button" class="tc-nav" id="wiTcPrevMonth" aria-label="เดือนก่อนหน้า">‹</button><div class="tc-title-selects"><select class="tc-select" id="wiTcMonthSelect" aria-label="เลือกเดือน"></select><select class="tc-select" id="wiTcYearSelect" aria-label="เลือกปี พ.ศ."></select></div><button type="button" class="tc-nav" id="wiTcNextMonth" aria-label="เดือนถัดไป">›</button></div><div class="tc-weekdays"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div><div class="tc-days" id="wiTcDays"></div><div class="tc-footer"><button type="button" class="tc-today-btn" id="wiTcToday">วันนี้</button></div></div></div><div class="thai-time-field"><button type="button" class="thai-time-trigger" id="wiIncidentTimeTrigger"><span id="wiIncidentTimeDisplayText">เลือกเวลา</span><span class="thai-time-badge">24 ชม.</span></button><div class="time-picker-popover ws-hidden" id="wiTimePickerPopover" role="dialog" aria-label="เลือกเวลา (24 ชั่วโมง)"><div class="tp-title">เลือกเวลาที่เกิดเหตุ <span class="tp-24-badge">24 ชม.</span></div><div class="tp-manual-entry"><input type="text" inputmode="numeric" maxlength="2" class="tp-manual-input" id="wiTpHourInput" aria-label="พิมพ์ชั่วโมง"><span class="tp-manual-colon">:</span><input type="text" inputmode="numeric" maxlength="2" class="tp-manual-input" id="wiTpMinuteInput" aria-label="พิมพ์นาที"><span class="tp-manual-unit">น.</span></div><div class="tp-wheels"><div class="tp-wheel-highlight"></div><div class="tp-wheel-wrap"><div class="tp-wheel-col" id="wiTpHourWheel"><div class="tp-wheel-track" id="wiTpHourTrack"></div></div><div class="tp-wheel-fade tp-wheel-fade-top"></div><div class="tp-wheel-fade tp-wheel-fade-bottom"></div></div><div class="tp-wheel-colon">:</div><div class="tp-wheel-wrap"><div class="tp-wheel-col" id="wiTpMinuteWheel"><div class="tp-wheel-track" id="wiTpMinuteTrack"></div></div><div class="tp-wheel-fade tp-wheel-fade-top"></div><div class="tp-wheel-fade tp-wheel-fade-bottom"></div></div><div class="tp-wheel-unit">น.</div></div><div class="tp-actions"><button type="button" class="tp-btn tp-btn-ghost" id="wiTpDismiss">ปิดตัวเลือก</button><button type="button" class="tp-btn tp-btn-ghost" id="wiTpClear">ล้างค่า</button><button type="button" class="tp-btn tp-btn-primary" id="wiTpConfirm">ยืนยันการเลือก</button></div></div></div></div><button type="button" class="wi-clear-datetime" id="wiClearDateTime">ล้างค่า</button></div><div class="ws-field ws-field-full"><label>สถานที่เกิดเหตุ</label><input id="wiPlace" value="สำนักงานจัดการทรัพย์สินภาครัฐ"></div><div class="ws-field"><label>จังหวัด</label><input id="wiProvince" list="wiProvinceOptions" autocomplete="off" placeholder="ระบุจังหวัด"><datalist id="wiProvinceOptions"></datalist></div><div class="ws-field"><label>อำเภอ/เขต</label><input id="wiDistrict" list="wiDistrictOptions" autocomplete="off" placeholder="ระบุอำเภอ/เขต"><datalist id="wiDistrictOptions"></datalist></div><div class="ws-field"><label>ตำบล/แขวง</label><input id="wiSubdistrict" list="wiSubdistrictOptions" autocomplete="off" placeholder="ระบุตำบล/แขวง"><datalist id="wiSubdistrictOptions"></datalist></div><div class="ws-field"><label>รหัสไปรษณีย์</label><input id="wiPostcode" readonly placeholder="รหัสไปรษณีย์"></div><div class="ws-field"><label>ความเสียหาย/ความเดือดร้อน</label><textarea id="wiDamage">เกิดความเสียหายต่องบประมาณของหน่วยงาน</textarea></div><div class="ws-field"><label>ความประสงค์ของผู้ร้อง</label><textarea id="wiRequest">ขอให้ตรวจสอบกระบวนการจัดซื้อและผู้เกี่ยวข้อง</textarea></div></div></div><div class="ws-section"><h3>เอกสารและเจ้าหน้าที่ผู้รับเรื่อง</h3><div class="ws-grid-2"><div class="ws-field"><label>เอกสารแนบ</label><input id="wiFiles" type="file" multiple></div><div class="ws-field"><label>เจ้าหน้าที่ผู้รับเรื่อง</label><select id="wiOfficer">${OFFICERS.map(x=>`<option>${x}</option>`).join('')}</select></div></div></div></div></section><aside class="ws-doc-pane"><div class="ws-doc-toolbar"><div class="ws-doc-tabs"><button class="ws-doc-tab active" data-wi-tab="complaint">แบบคำร้องเรียน</button><button class="ws-doc-tab" data-wi-tab="receipt">58/2-02 ใบติดตาม</button></div><span class="ws-status" id="wiDocStatus">ยังไม่ลงรับ</span></div><div class="ws-paper-stage" id="wiPreview"></div></aside></div></main><div class="ws-actions"><button class="ws-button secondary" id="wiDraft">บันทึกร่าง</button><button class="ws-button secondary" id="wiPrint">พิมพ์เอกสาร</button><button class="ws-button primary" id="wiReceive">ลงรับและออกเอกสารติดตาม</button></div>`;document.body.appendChild(shell);
    [['wiSubject','ผู้ช่วยอัจฉริยะสำหรับหัวข้อเรื่อง'],['wiDetail','ผู้ช่วยอัจฉริยะสำหรับรายละเอียดพฤติการณ์'],['wiDamage','ผู้ช่วยอัจฉริยะสำหรับความเสียหาย'],['wiRequest','ผู้ช่วยอัจฉริยะสำหรับความประสงค์ของผู้ร้อง']].forEach(([id,label])=>attachIntelligentSuggestion(id,label));
    let tab='complaint',receipt=null;const val=id=>$(id.startsWith('#')?id:'#'+id)?.value||'';
    const intakeChannels=regionalIntake?REGIONAL_CHANNELS:['Walk-In','สายด่วน 1206','เบอร์โทร ปปท. เขต 1-9','Email','สปน. 1111','Traffy Fondue','ศปท. ป.ป.ท.','การข่าวภายใน ป.ป.ท.','ศนธ. / กนป.','เครือข่ายภาคประชาชน','ข้อสั่งการ','หนังสือจากหน่วยงานอื่น','จดหมาย','ม.62 (ป.ป.ช.)'];
    const channelSection=document.createElement('div');channelSection.className='ws-section';channelSection.innerHTML=`<h3>ช่องทางรับเรื่อง</h3><div class="ws-grid-2"><div class="ws-field"><label for="wiChannel">ช่องทางที่ได้รับเรื่องร้องเรียน</label><select id="wiChannel">${intakeChannels.map(channel=>`<option>${channel}</option>`).join('')}</select></div><div class="ws-field" id="wiIntakeRegionField"><label for="wiIntakeRegion">เขตที่รับเรื่อง</label><select id="wiIntakeRegion"><option value="">โปรดระบุเขตที่รับเรื่อง</option>${REGIONS.map(region=>`<option value="${region}" ${regionalIntake&&region===regionalRegion?'selected':''}>${region}</option>`).join('')}</select></div></div>`;$('.ws-editor-body',shell).prepend(channelSection);$('.ws-kicker',shell).textContent=regionalIntake?`ช่องทางรับเรื่อง · ${regionalRegion}`:'ช่องทางรับเรื่อง';
    const toggleIntakeRegion=()=>{const visible=regionalIntake||['Walk-In','จดหมาย'].includes($('#wiChannel',shell).value);$('#wiIntakeRegionField',shell).classList.toggle('ws-hidden',!visible);$('#wiIntakeRegion',shell).disabled=regionalIntake||!visible;if(regionalIntake)$('#wiIntakeRegion',shell).value=regionalRegion;else if(!visible)$('#wiIntakeRegion',shell).value=''};$('#wiChannel',shell).addEventListener('change',toggleIntakeRegion);toggleIntakeRegion();
    const officeField=document.createElement('div');officeField.className='ws-field ws-field-full ws-hidden';officeField.id='wiOfficeRegNoField';officeField.innerHTML='<label for="wiOfficeRegNo">เลขสารบรรณกลาง (ถ้ามี)</label><input id="wiOfficeRegNo" placeholder="เช่น 0123/2569" autocomplete="off"><small>เลขที่หน่วยงานสารบรรณกลาง (ชั้น 14) ออกให้ — เฉพาะช่องทาง จดหมาย / หนังสือราชการ / ม.62 (ส่วนกลาง) ระบบไม่ออกเลขนี้ให้เอง</small>';channelSection.querySelector('.ws-grid-2')?.appendChild(officeField);
    const toggleOfficeField=()=>{const ch=String($('#wiChannel',shell)?.value||'');const reg=String($('#wiIntakeRegion',shell)?.value||'');const central=!reg.includes('เขต');const visible=central&&!/หน่วยงานอื่น/.test(ch)&&/จดหมาย|หนังสือ|62/.test(ch);officeField.classList.toggle('ws-hidden',!visible);if(!visible)$('#wiOfficeRegNo',shell).value=''};
    $('#wiChannel',shell).addEventListener('change',toggleOfficeField);
    const anonymousField=document.createElement('div');anonymousField.className='ws-field ws-field-full';anonymousField.innerHTML='<label class="ws-choice"><input type="checkbox" id="wiAnonymous"><span><strong>ยื่นเป็นบัตรสนเท่ห์</strong><small>ปกปิดข้อมูลผู้ร้อง</small></span></label>';$('#wiEmail',shell).closest('.ws-field').after(anonymousField);
    const receiptTab=$('[data-wi-tab="receipt"]',shell);receiptTab.disabled=true;receiptTab.textContent='58/2-02 ใบแจ้งเลขติดตาม';
    const citizenInput=$('#wiCitizen',shell);
    if(citizenInput){
      citizenInput.addEventListener('input',()=>{
        const digits=citizenInput.value.replace(/\D/g,'').slice(0,13);
        let out='';
        for(let idx=0;idx<digits.length;idx++){
          if(idx===1||idx===5||idx===10||idx===12)out+='-';
          out+=digits[idx];
        }
        citizenInput.value=out;
      });
    }
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
    const complaintPaper=()=>{
      const fullName=val('wiComplainant').trim();
      const prefix=(fullName.match(/^(นาย|นางสาว|นาง|เด็กชาย|เด็กหญิง)/)||[])[1]||'';
      const nameWithoutPrefix=fullName.slice(prefix.length).trim();
      const nameParts=nameWithoutPrefix.split(/\s+/).filter(Boolean);
      const firstName=nameParts.length>1?nameParts.slice(0,-1).join(' '):nameWithoutPrefix;
      const lastName=nameParts.length>1?nameParts.at(-1):'';
      const accused=val('wiAccused');
      const isAgency=/สำนักงาน|กรม|กระทรวง|เทศบาล|องค์การ|หน่วยงาน|มหาวิทยาลัย|โรงพยาบาล/.test(accused);
      const attachments=[...($('#wiFiles',shell)?.files||[])].map(file=>({name:file.name,type:file.type?file.type.split('/')[1].toUpperCase():'ไฟล์',size:file.size?formatFileSize(file.size):'',pages:1}));
      const field=value=>escapeHtml(value||'................................................................');
      return `<article class="a4-paper template-petition" id="activePaper">
        <header class="petition-header"><p>“ตัวอย่างแจ้งการร้องเรียน-เบาะแส”</p><img src="${PACC_LOGO}" alt="ตราสำนักงาน ป.ป.ท."><div><strong>เขียนที่</strong> ................................................<br><strong>วันที่</strong> ......... เดือน .................. พ.ศ. .......</div></header>
        <div class="doc-heading"><h2>แจ้งการร้องเรียน/เบาะแส<br>สำนักงาน ป.ป.ท.</h2></div>
        <div class="official-subject"><strong>เรียน</strong><span>เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</span></div>
        <section class="petition-section"><h3>ข้อมูลผู้ร้องเรียน</h3>
          <p>${checkMark($('#wiAnonymous',shell).checked)} ขอปกปิดชื่อและไม่ประสงค์จะเปิดเผยตัวตน</p>
          <p>คำนำหน้านาม ${field(prefix)} ชื่อ ${field(firstName)} นามสกุล ${field(lastName)} หมายเลขบัตรประชาชน ${field(val('wiCitizen'))}</p>
          <p>ที่อยู่ปัจจุบัน ................................................................ ซอย ........................................................ หมู่ที่ .................... ตำบล/แขวง ........................................................</p>
          <p>อำเภอ/เขต ........................................................ จังหวัด ........................................................ รหัสไปรษณีย์ ....................................</p>
          <p>หมายเลขโทรศัพท์ที่ติดต่อได้ ${field(val('wiPhone'))} EMAIL ${field(val('wiEmail'))}</p>
          <p>ท่านเป็นเครือข่ายของสำนักงาน ป.ป.ท. ${checkMark(false)} ไม่ได้เป็นเครือข่าย&nbsp;&nbsp;&nbsp; ${checkMark(true)} เป็นเครือข่าย ${field('')}</p>
        </section>
        <section class="petition-section"><h3>ข้อมูลบุคคล/หน่วยงานที่ร้องเรียน</h3>
          <p>${checkMark(!isAgency)} ร้องเรียนเจ้าหน้าที่ของรัฐ (กรณีมากกว่า 1 รายให้เพิ่มในรายละเอียดการร้องเรียน/เบาะแส)</p>
          <p>คำนำหน้านาม ${field('')} ชื่อ ${field(isAgency?'':accused)} นามสกุล ${field('')}</p>
          <p>ตำแหน่ง ${field(val('wiPosition'))} สังกัด ${field(isAgency?'':accused)}</p>
          <p>กรม ${field('')} กระทรวง ${field('')}</p>
          <p>${checkMark(isAgency)} ร้องเรียนหน่วยงาน กรม ${field(isAgency?accused:'')} กระทรวง/อื่น ๆ ${field('')}</p>
          <p>ชื่อโครงการที่ต้องการร้องเรียน (ถ้ามี) ${field(val('wiSubject'))}</p>
          <h3>รายละเอียดการร้องเรียน/แจ้งเบาะแส</h3><div class="petition-detail">${escapeHtml(val('wiDetail'))}</div>
          <p class="petition-inline-sign">ลงชื่อ...(ผู้ร้อง)....................................................</p>
        </section>
        <section class="petition-section petition-followup">
          <p><strong>วันเวลาเกิดเหตุ</strong>&nbsp;&nbsp; วันที่ ${field(formatThaiBEDateWi(val('wiIncidentDate')))} เวลาเกิดเหตุ ${field(wiIncidentTimeText())}</p>
          <p><strong>สถานที่เกิดเหตุ</strong>&nbsp;&nbsp; ตำบล ${field(val('wiSubdistrict'))} อำเภอ ${field(val('wiDistrict'))} จังหวัด ${field(val('wiProvince'))}</p>
          <p><strong>ความเดือดร้อนเสียหายที่ได้รับ</strong> ${field(val('wiDamage'))}</p>
          <p><strong>มีความประสงค์ให้สำนักงาน ป.ป.ท. ดำเนินการ</strong> ${field(val('wiRequest'))}</p>
          <p><strong>ในกรณีเดียวกันมีการร้องเรียนไปที่หน่วยงานอื่นใดหรือไม่ ผลดำเนินการเป็นประการใด</strong> ................................................................................................................................................................</p>
          <p><strong>ได้มอบเอกสารประกอบเรื่องร้องเรียน ดังนี้</strong></p>
          <div class="petition-attachments">${attachments.length?attachments.map((a,index)=>`<p>${index+1}. ${escapeHtml(attachmentName(a))}${escapeHtml(attachmentDetails(a))}</p>${attachmentDesc(a)?`<p class="petition-attachment-desc">${escapeHtml(attachmentDesc(a))}</p>`:''}`).join(''):'<p>............................................................................................................................................................</p><p>............................................................................................................................................................</p><p>............................................................................................................................................................</p>'}</div>
        </section>
        <div class="petition-signature"><p>ลงชื่อ .....................................................................</p><p>(${escapeHtml(fullName||'.................................................................')})</p><p>ผู้ร้องเรียน</p></div>
      </article>`;
    };
    const render=()=>{$('#wiPreview').innerHTML=tab==='receipt'&&receipt?receiptPaper(receipt,receipt.qr):complaintPaper()};$$('input,textarea,select',shell).forEach(x=>x.addEventListener('input',render));$$('[data-wi-tab]',shell).forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.wiTab;$$('[data-wi-tab]',shell).forEach(x=>x.classList.toggle('active',x===b));render()}));

    // --- incident date/time: Thai Buddhist-Era calendar + 24-hour wheel time picker (matches public complaint form) ---
    const WI_THAI_MONTH_NAMES=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    const wiPad2=n=>String(n).padStart(2,'0');
    const wiIsoOf=(y,m,d)=>`${y}-${wiPad2(m+1)}-${wiPad2(d)}`;
    const wiTodayISO=()=>{const t=new Date();return wiIsoOf(t.getFullYear(),t.getMonth(),t.getDate())};
    function formatThaiBEDateWi(isoDate){
      if(!isoDate)return '';
      const [y,m,d]=isoDate.split('-').map(Number);
      return `${d} ${WI_THAI_MONTH_NAMES[m-1]} พ.ศ. ${y+543}`;
    }
    const wiIncidentDateInput=$('#wiIncidentDate',shell);
    function updateWiIncidentDateDisplay(){
      const formatted=formatThaiBEDateWi(wiIncidentDateInput.value);
      $('#wiIncidentDateDisplayText',shell).textContent=formatted||'เลือกวันที่เกิดเหตุ';
    }
    const wiCalView={year:new Date().getFullYear(),month:new Date().getMonth()};
    function wiInitCalendarSelects(){
      const monthSel=$('#wiTcMonthSelect',shell);
      monthSel.replaceChildren(...WI_THAI_MONTH_NAMES.map((name,i)=>{const opt=document.createElement('option');opt.value=String(i);opt.textContent=name;return opt}));
      const yearSel=$('#wiTcYearSelect',shell);
      const currentBEYear=new Date().getFullYear()+543;
      const yearOptions=[];for(let beYear=currentBEYear;beYear>=currentBEYear-100;beYear--)yearOptions.push(beYear);
      yearSel.replaceChildren(...yearOptions.map(beYear=>{const opt=document.createElement('option');opt.value=String(beYear-543);opt.textContent=String(beYear);return opt}));
      monthSel.addEventListener('change',()=>{wiCalView.month=Number(monthSel.value);wiRenderCalendar()});
      yearSel.addEventListener('change',()=>{wiCalView.year=Number(yearSel.value);wiRenderCalendar()});
    }
    function wiRenderCalendar(){
      $('#wiTcMonthSelect',shell).value=String(wiCalView.month);
      $('#wiTcYearSelect',shell).value=String(wiCalView.year);
      const daysWrap=$('#wiTcDays',shell);
      daysWrap.replaceChildren();
      const firstWeekday=new Date(wiCalView.year,wiCalView.month,1).getDay();
      const daysInMonth=new Date(wiCalView.year,wiCalView.month+1,0).getDate();
      const selectedISO=wiIncidentDateInput.value;
      const nowISO=wiTodayISO();
      for(let i=0;i<firstWeekday;i++){const empty=document.createElement('div');empty.className='tc-day tc-day-empty';daysWrap.appendChild(empty)}
      for(let d=1;d<=daysInMonth;d++){
        const iso=wiIsoOf(wiCalView.year,wiCalView.month,d);
        const btn=document.createElement('button');
        btn.type='button';btn.className='tc-day';btn.textContent=String(d);
        if(iso===nowISO)btn.classList.add('tc-day-today');
        if(iso===selectedISO)btn.classList.add('tc-day-selected');
        btn.addEventListener('click',()=>wiSelectDate(iso));
        daysWrap.appendChild(btn);
      }
    }
    function wiSelectDate(iso){
      wiIncidentDateInput.value=iso;
      updateWiIncidentDateDisplay();
      wiCloseDatePicker();
      render();
    }
    function wiChangeCalMonth(delta){
      wiCalView.month+=delta;
      if(wiCalView.month<0){wiCalView.month=11;wiCalView.year--}
      if(wiCalView.month>11){wiCalView.month=0;wiCalView.year++}
      wiRenderCalendar();
    }
    $('#wiTcPrevMonth',shell).addEventListener('click',()=>wiChangeCalMonth(-1));
    $('#wiTcNextMonth',shell).addEventListener('click',()=>wiChangeCalMonth(1));
    $('#wiTcToday',shell).addEventListener('click',()=>{const t=new Date();wiCalView.year=t.getFullYear();wiCalView.month=t.getMonth();wiSelectDate(wiTodayISO())});
    function wiOnDocClickCloseCalendar(evt){if(!evt.target.closest('.thai-date-field'))wiCloseDatePicker()}
    function wiOpenDatePicker(){
      const existing=wiIncidentDateInput.value;
      const base=existing?new Date(existing):new Date();
      wiCalView.year=base.getFullYear();wiCalView.month=base.getMonth();
      wiRenderCalendar();
      $('#wiThaiCalendarPopover',shell).classList.remove('ws-hidden');
      document.addEventListener('click',wiOnDocClickCloseCalendar);
    }
    function wiCloseDatePicker(){
      $('#wiThaiCalendarPopover',shell).classList.add('ws-hidden');
      document.removeEventListener('click',wiOnDocClickCloseCalendar);
    }
    function wiToggleDatePicker(){$('#wiThaiCalendarPopover',shell).classList.contains('ws-hidden')?wiOpenDatePicker():wiCloseDatePicker()}
    $('#wiIncidentDateTrigger',shell).addEventListener('click',evt=>{evt.stopPropagation();wiToggleDatePicker()});
    wiInitCalendarSelects();
    updateWiIncidentDateDisplay();

    const WI_WHEEL_ITEM_HEIGHT=38;
    const wiTimePickerState={hour:null,minute:null,confirmedHour:null,confirmedMinute:null};
    function updateWiIncidentTimeDisplay(){
      const {confirmedHour:h,confirmedMinute:m}=wiTimePickerState;
      $('#wiIncidentTimeDisplayText',shell).textContent=(h!==null&&m!==null)?`${wiPad2(h)} : ${wiPad2(m)} น.`:'เลือกเวลา';
    }
    function wiIncidentTimeText(){
      const {confirmedHour:h,confirmedMinute:m}=wiTimePickerState;
      return (h!==null&&m!==null)?`${wiPad2(h)}:${wiPad2(m)} น.`:'';
    }
    function wiInitWheel(colEl,trackEl,count,formatter,onChange){
      trackEl.replaceChildren();
      for(let i=0;i<count;i++){
        const item=document.createElement('div');
        item.className='tp-wheel-item';item.textContent=formatter(i);item.dataset.value=String(i);
        trackEl.appendChild(item);
      }
      const items=trackEl.children;
      let dragging=false,moved=false,startY=0,startScroll=0,scrollEndTimer=null;
      function nearestIndex(){return Math.max(0,Math.min(count-1,Math.round(colEl.scrollTop/WI_WHEEL_ITEM_HEIGHT)))}
      function highlightActive(){const idx=nearestIndex();for(let i=0;i<items.length;i++)items[i].classList.toggle('active',i===idx);return idx}
      function snapTo(index,smooth){colEl.scrollTo({top:Math.max(0,Math.min(count-1,index))*WI_WHEEL_ITEM_HEIGHT,behavior:smooth?'smooth':'auto'})}
      colEl.addEventListener('scroll',()=>{
        onChange(highlightActive(),false);
        if(dragging)return;
        clearTimeout(scrollEndTimer);
        scrollEndTimer=setTimeout(()=>{const idx=nearestIndex();snapTo(idx,true);onChange(idx,true)},120);
      });
      colEl.addEventListener('pointerdown',evt=>{
        dragging=true;moved=false;startY=evt.clientY;startScroll=colEl.scrollTop;
        colEl.classList.add('dragging');colEl.setPointerCapture(evt.pointerId);
      });
      colEl.addEventListener('pointermove',evt=>{
        if(!dragging)return;
        const dy=evt.clientY-startY;if(Math.abs(dy)>2)moved=true;
        colEl.scrollTop=startScroll-dy;
      });
      function endDrag(){
        if(!dragging)return;dragging=false;colEl.classList.remove('dragging');
        const idx=nearestIndex();snapTo(idx,true);onChange(idx,true);
      }
      colEl.addEventListener('pointerup',endDrag);
      colEl.addEventListener('pointercancel',endDrag);
      colEl.addEventListener('click',evt=>{
        if(moved)return;
        const item=evt.target.closest('.tp-wheel-item');if(!item)return;
        const idx=Number(item.dataset.value);snapTo(idx,true);onChange(idx,true);
      });
      return {setValue(idx,smooth){snapTo(idx,!!smooth);highlightActive()}};
    }
    const wiTpHourInput=$('#wiTpHourInput',shell);
    const wiTpMinuteInput=$('#wiTpMinuteInput',shell);
    const wiHourWheelApi=wiInitWheel($('#wiTpHourWheel',shell),$('#wiTpHourTrack',shell),24,wiPad2,idx=>{wiTimePickerState.hour=idx;wiTpHourInput.value=wiPad2(idx)});
    const wiMinuteWheelApi=wiInitWheel($('#wiTpMinuteWheel',shell),$('#wiTpMinuteTrack',shell),60,wiPad2,idx=>{wiTimePickerState.minute=idx;wiTpMinuteInput.value=wiPad2(idx)});
    function wiWireManualTimeInput(inputEl,max,wheelApi,setter){
      inputEl.addEventListener('input',()=>{inputEl.value=inputEl.value.replace(/\D/g,'').slice(0,2)});
      inputEl.addEventListener('change',()=>{
        const n=parseInt(inputEl.value,10);
        if(isNaN(n)){inputEl.value=wiPad2(setter(null)??0);return}
        const clamped=Math.max(0,Math.min(max,n));
        setter(clamped);inputEl.value=wiPad2(clamped);wheelApi.setValue(clamped,true);
      });
      inputEl.addEventListener('keydown',evt=>{if(evt.key==='Enter')inputEl.blur()});
    }
    wiWireManualTimeInput(wiTpHourInput,23,wiHourWheelApi,v=>{if(v!==null)wiTimePickerState.hour=v;return wiTimePickerState.hour});
    wiWireManualTimeInput(wiTpMinuteInput,59,wiMinuteWheelApi,v=>{if(v!==null)wiTimePickerState.minute=v;return wiTimePickerState.minute});
    function wiOnDocClickCloseTimePicker(evt){if(!evt.target.closest('.thai-time-field'))wiCloseTimePickerPopover()}
    function wiToggleTimePicker(){$('#wiTimePickerPopover',shell).classList.contains('ws-hidden')?wiOpenTimePicker():wiCloseTimePickerPopover()}
    function wiOpenTimePicker(){
      const now=new Date();
      const h=wiTimePickerState.confirmedHour!==null?wiTimePickerState.confirmedHour:now.getHours();
      const m=wiTimePickerState.confirmedMinute!==null?wiTimePickerState.confirmedMinute:now.getMinutes();
      wiTimePickerState.hour=h;wiTimePickerState.minute=m;
      wiTpHourInput.value=wiPad2(h);wiTpMinuteInput.value=wiPad2(m);
      $('#wiTimePickerPopover',shell).classList.remove('ws-hidden');
      document.addEventListener('click',wiOnDocClickCloseTimePicker);
      requestAnimationFrame(()=>{wiHourWheelApi.setValue(h);wiMinuteWheelApi.setValue(m)});
    }
    function wiCloseTimePickerPopover(){
      $('#wiTimePickerPopover',shell).classList.add('ws-hidden');
      document.removeEventListener('click',wiOnDocClickCloseTimePicker);
    }
    $('#wiIncidentTimeTrigger',shell).addEventListener('click',evt=>{evt.stopPropagation();wiToggleTimePicker()});
    $('#wiTpDismiss',shell).addEventListener('click',()=>wiCloseTimePickerPopover());
    $('#wiTpClear',shell).addEventListener('click',()=>{
      wiTimePickerState.hour=null;wiTimePickerState.minute=null;
      wiTimePickerState.confirmedHour=null;wiTimePickerState.confirmedMinute=null;
      updateWiIncidentTimeDisplay();
      wiCloseTimePickerPopover();
      render();
    });
    $('#wiTpConfirm',shell).addEventListener('click',()=>{
      wiTimePickerState.confirmedHour=wiTimePickerState.hour;
      wiTimePickerState.confirmedMinute=wiTimePickerState.minute;
      updateWiIncidentTimeDisplay();
      wiCloseTimePickerPopover();
      render();
    });
    updateWiIncidentTimeDisplay();
    $('#wiClearDateTime',shell).addEventListener('click',()=>{
      wiIncidentDateInput.value='';
      updateWiIncidentDateDisplay();
      wiTimePickerState.hour=null;wiTimePickerState.minute=null;
      wiTimePickerState.confirmedHour=null;wiTimePickerState.confirmedMinute=null;
      updateWiIncidentTimeDisplay();
      wiCloseDatePicker();wiCloseTimePickerPopover();
      render();
    });

    $('#wiDraft').onclick=()=>{localStorage.setItem('ecmis-walkin-draft',JSON.stringify({subject:val('wiSubject'),complainant:val('wiComplainant'),detail:val('wiDetail'),channel:val('wiChannel'),region:regionalIntake?regionalRegion:val('wiIntakeRegion')}));notify('success','บันทึกร่างแล้ว','ข้อมูลยังไม่ถูกลงรับและยังไม่ออกเลขติดตาม')};
    $('#wiPrint').onclick=()=>window.print();
    $('#wiReceive').onclick=async()=>{
      const selectedChannel=val('wiChannel');
      const selectedRegion=regionalIntake?regionalRegion:val('wiIntakeRegion');
      const citizenDigits=normalizeCitizenId(val('wiCitizen'));
      const phoneDigits=String(val('wiPhone')).replace(/\D/g,'');
      const personalFields=['wiComplainant','wiCitizen','wiPhone','wiEmail'].map(val);
      const anonymousDetected=personalFields.every(value=>!value.trim());
      const identityLast4=isValidThaiCitizenId(citizenDigits)?citizenDigits.slice(-4):(phoneDigits.length>=4?phoneDigits.slice(-4):'');
      if(!val('wiSubject')||!val('wiDetail'))return notify('warning','ข้อมูลไม่ครบ','กรอกชื่อเรื่องร้องเรียนและรายละเอียดพฤติการณ์ก่อนลงรับ');
      if(!anonymousDetected&&!identityLast4)return notify('warning','ข้อมูลยืนยันตัวตนสำหรับติดตามเรื่องไม่ครบ','กรอกเลขบัตรประชาชนที่ถูกต้อง หรือหมายเลขโทรศัพท์อย่างน้อย 4 หลัก เพื่อใช้ยืนยันตัวตนเมื่อติดตามเรื่อง');
      if(regionalIntake&&(!isRegionalChannel(selectedChannel)||!REGIONAL_REGIONS.includes(selectedRegion)))return notify('warning','ข้อมูลรับเรื่องไม่ถูกต้อง','เจ้าหน้าที่เขตรับเรื่องได้เฉพาะ Walk-In จดหมาย หรือเบอร์โทร ปปท. เขต 1-9 และต้องบันทึกในเขตของตน');
      if(['Walk-In','จดหมาย'].includes(selectedChannel)&&!selectedRegion)return notify('warning','ยังไม่ได้ระบุเขต','เลือกเขตที่รับเรื่องก่อนลงรับ');
      const ok=await confirmDo('ยืนยันการลงรับเรื่อง','เมื่อกดลงรับ เรื่องจะถูกบันทึกและรอจัดสรรเลขติดตามหลังการกลั่นกรองเรื่องซ้ำ — ระบบไม่ออกเลขใหม่จนกว่าเจ้าหน้าที่จะตัดสินใจ','ลงรับเรื่อง');
      if(!ok.isConfirmed)return;
      const pair=window.ECMIS?.createPendingReference?.()||{allocationStatus:'pending',pendingReference:`PENDING-${String(new Date().getFullYear()+543).slice(-2)}-${Date.now().toString(36).toUpperCase()}`};
      const pendingAllocation=true;
      const pendingReference=pair.pendingReference||'';
      let qr='';
      const caseId=`ECMIS-${pendingReference}`;
      receipt={id:caseId,trackingYear:'',trackingCode:'',pendingReference,allocationStatus:'pending',received:now(),receivingOfficer:val('wiOfficer'),subject:val('wiSubject'),complainant:val('wiComplainant'),citizenId:val('wiCitizen'),identityLast4,id4:isValidThaiCitizenId(citizenDigits)?citizenDigits.slice(-4):'',phone:phoneDigits,anonymousDetected,agency:val('wiAccused'),channel:selectedChannel,province:val('wiProvince'),region:selectedRegion||'ส่วนกลาง',place:val('wiPlace'),incidentDate:val('wiIncidentDate'),incidentTime:wiIncidentTimeText(),detail:val('wiDetail'),damage:val('wiDamage'),request:val('wiRequest'),attachments:[],qr};
      receipt.registry=issueRegistry(selectedChannel,selectedRegion);
      const officeRegNo=val('wiOfficeRegNo');
      if(officeRegNo)receipt.registry.office=officeRegNo;
      const state=initialState(receipt);
      state.workflow.status='รอลงรับและมอบหมาย';state.workflow.owner='admin';state.workflow.stage='admin';
      saveState(receipt.id,state);
      $('#wiDocStatus').textContent='ลงรับแล้ว (รอจัดสรรเลขรับบริการหลังกลั่นกรองเรื่องซ้ำ)';
      $('#wiDocStatus').classList.add('success');
      receiptTab.disabled=true;
      tab='complaint';
      $$('[data-wi-tab]',shell).forEach(x=>x.classList.toggle('active',x.dataset.wiTab===tab));
      render();
      return notify('success','ลงรับเรื่องแล้ว','เรื่องถูกลงรับและมอบหมายต่อให้ธุรการ ศรร. — เลขติดตามจะออกเมื่อเจ้าหน้าที่ตัดสินใจกลั่นกรองเรื่องซ้ำ (เรื่องใหม่) หรือใช้เลขเดิม (เรื่องซ้ำ)');
    };
    render();
    const receiveComplaint=$('#wiReceive').onclick;
    $('#wiReceive').onclick=async()=>{
      await receiveComplaint();
      if(!receipt)return;
      if(receipt.allocationStatus==='pending'){
        receiptTab.disabled=true;
        tab='complaint';
        $$('[data-wi-tab]',shell).forEach(item=>item.classList.toggle('active',item.dataset.wiTab==='complaint'));
        render();
        return;
      }
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
    const root=$('#staffApp');if(!root)return;const params=new URLSearchParams(location.search);let selectedRole=params.get('role')||sessionStorage.getItem('ecmis-a4-role')||'admin';let activeRole=selectedRole==='regional-officer'?'officer':selectedRole;let activeRegion=REGIONAL_REGIONS.includes(params.get('region'))?params.get('region'):(sessionStorage.getItem('ecmis-a4-regional-region')||'เขต 1');if(!REGIONAL_REGIONS.includes(activeRegion))activeRegion='เขต 1';let selectedId=params.get('case')||null;let adminQueue=['unassigned','assigned'].includes(params.get('queue'))?params.get('queue'):'unassigned';let filters={};
    root.innerHTML=`${header(true)}<main class="ws-container"><section id="caseListView"><div class="ws-page-head"><div><p class="ws-kicker">งานรับเรื่องร้องเรียน</p><h1>รายการเรื่องร้องเรียน</h1><p>ค้นหาจากทุกช่องทางและพื้นที่เกิดเหตุ ก่อนเปิดโต๊ะทำสำนวน</p></div><a class="ws-button primary" href="complaint-form.html?mode=walkin">เพิ่มเรื่องร้องเรียน</a></div><section class="ws-dashboard" aria-label="ภาพรวมเรื่องร้องเรียน"><article class="ws-dashboard-card overview"><span>ภาพรวมทั้งหมด</span><strong id="dashboardTotal">0</strong><p>เรื่องทั้งหมด</p><small>รวมทุกช่องทางรับเรื่อง</small></article><article class="ws-dashboard-card pending"><span>รอดำเนินการ</span><strong id="dashboardPending">0</strong><p>รอลงรับและมอบหมาย</p><small>อยู่ในความรับผิดชอบของธุรการ</small></article><article class="ws-dashboard-card reviewing"><span>กำลังพิจารณา</span><strong id="dashboardReview">0</strong><p>อยู่ระหว่างพิจารณา</p><small>เจ้าหน้าที่หรือผู้มีอำนาจกำลังดำเนินการ</small></article><article class="ws-dashboard-card completed"><span>ผลดำเนินการ</span><strong id="dashboardDone">0</strong><p>ดำเนินการเสร็จสิ้น</p><small>มีผลการพิจารณาเรียบร้อยแล้ว</small></article></section><section class="ws-card ws-filters"><div class="ws-filter-grid"><div class="ws-field"><label>คำค้น</label><input id="filterSearch" placeholder="เลขรับเรื่อง ผู้ร้อง ชื่อเรื่อง หรือหน่วยงาน"></div><div class="ws-field"><label>ช่องทาง</label><select id="filterChannel"><option value="">ทุกช่องทาง</option>${['Website','Walk-in','สายด่วน 1206','หนังสือราชการ'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="ws-field"><label>เขตพื้นที่</label><select id="filterRegion"><option value="">ทุกเขต</option>${['ส่วนกลาง','เขต 1','เขต 2','เขต 3','เขต 4','เขต 5','เขต 6','เขต 7','เขต 8','เขต 9'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="ws-field"><label>จังหวัดเกิดเหตุ</label><select id="filterProvince"><option value="">ทุกจังหวัด</option>${['กรุงเทพมหานคร','ชลบุรี','นครราชสีมา','ขอนแก่น','นนทบุรี'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="ws-field"><label>ประเภทเรื่อง</label><select id="filterType"><option value="">ทุกประเภท</option>${['การจัดซื้อจัดจ้าง','ใช้อำนาจโดยมิชอบ','เบิกจ่ายงบประมาณ','เรียกรับผลประโยชน์'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="ws-field"><label>สถานะ</label><select id="filterStatus"><option value="">ทุกสถานะ</option><option>รอลงรับและมอบหมาย</option><option>รอเจ้าหน้าที่กลั่นกรองเรื่องซ้ำ</option><option>รอเจ้าหน้าที่พิจารณา</option><option>รอ ผู้อำนวยการศูนย์รับเรื่องร้องเรียน</option><option>รอ ผู้อำนวยการกองบริหารคดี</option><option>ดำเนินการเสร็จสิ้น</option><option>เรื่องซ้ำ — รวมกับเรื่องเดิม</option></select></div><div class="ws-field"><label>ความเสี่ยงเรื่องซ้ำ</label><select id="filterDuplicate"><option value="">ทั้งหมด</option><option value="high">ควรตรวจสอบ</option><option value="low">ยังไม่พบสัญญาณ</option></select></div><div class="ws-field"><label>วันที่ลงรับ</label><div class="thai-date-field"><button type="button" class="thai-date-display" id="filterDateTrigger"><span id="filterDateDisplayText">ทุกวันที่</span></button><input type="hidden" id="filterDate"><div class="thai-calendar-popover ws-hidden" id="filterDateCalendarPopover" role="dialog" aria-label="เลือกวันที่ลงรับ (ปฏิทินไทย)"><div class="tc-header"><button type="button" class="tc-nav" id="filterDateTcPrev" aria-label="เดือนก่อนหน้า">‹</button><div class="tc-title-selects"><select class="tc-select" id="filterDateTcMonth" aria-label="เลือกเดือน"></select><select class="tc-select" id="filterDateTcYear" aria-label="เลือกปี พ.ศ."></select></div><button type="button" class="tc-nav" id="filterDateTcNext" aria-label="เดือนถัดไป">›</button></div><div class="tc-weekdays"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div><div class="tc-days" id="filterDateTcDays"></div><div class="tc-footer"><button type="button" class="tc-today-btn" id="filterDateTcToday">วันนี้</button><button type="button" class="tc-today-btn" id="filterDateTcClear">ล้างค่า</button></div></div></div></div></div></section><nav id="adminQueueTabs" class="admin-queue-tabs ws-hidden" aria-label="คิวมอบหมายงาน"><button type="button" class="admin-queue-tab" data-queue="unassigned">ยังไม่มอบหมาย (0)</button><button type="button" class="admin-queue-tab" data-queue="assigned">มอบหมายแล้ว (0)</button></nav><section class="ws-card"><div class="ws-table-wrap"><table class="ws-table"><thead><tr><th>เลขรับเรื่อง/วันที่</th><th>ผู้ร้องเรียน</th><th>ประเภทผู้ร้อง</th><th>ชื่อเรื่อง/หน่วยงาน</th><th>สถานที่เกิดเหตุ</th><th>ช่องทาง</th><th>สถานะ</th><th>เรื่องซ้ำ</th><th class="mini-toggle-col" aria-label="ขยายดูสถานะ"></th></tr></thead><tbody id="caseRows"></tbody></table></div></section></section><section id="caseDetailView" class="ws-hidden"></section></main>`;
    const updateIntakeLink=()=>root.querySelector('a[href^="staff-intake.html"],a[href="complaint-form.html?mode=walkin"]')?.setAttribute('href',selectedRole==='regional-officer'?`staff-intake.html?role=regional-officer&region=${encodeURIComponent(activeRegion)}`:'staff-intake.html');
    updateIntakeLink();
    const roleSelect=$('#wsRole');
    if(roleSelect&&!roleSelect.querySelector('option[value="anonymous"]'))roleSelect.insertAdjacentHTML('beforeend','<option value="anonymous">กล่องบัตรสนเท่ห์</option>');
    const regionalRegionField=$('#wsRegionalRegionField'),regionalRegionSelect=$('#wsRegionalRegion');
    const syncUrl=()=>{
      const next=new URL(location.href);
      next.searchParams.set('role',selectedRole);
      if(selectedRole==='regional-officer')next.searchParams.set('region',activeRegion);else next.searchParams.delete('region');
      if(selectedRole==='admin')next.searchParams.set('queue',adminQueue);else next.searchParams.delete('queue');
      if(selectedId)next.searchParams.set('case',selectedId);else next.searchParams.delete('case');
      history.replaceState(null,'',`${next.pathname}${next.search}${next.hash}`);
    };
    const updateRoleControls=()=>{
      const regional=selectedRole==='regional-officer';
      $$('.ws-admin-tool').forEach(button=>button.classList.toggle('ws-hidden',selectedRole!=='admin'));
      $('#adminQueueTabs')?.classList.toggle('ws-hidden',selectedRole!=='admin');
      regionalRegionField?.classList.toggle('ws-hidden',!regional);
      if(regionalRegionSelect)regionalRegionSelect.value=activeRegion;
      const channelFilter=$('#filterChannel');
      if(channelFilter)channelFilter.innerHTML=`<option value="">ทุกช่องทาง</option>${(regional?REGIONAL_CHANNELS:['Website','Walk-in','สายด่วน 1206','หนังสือราชการ']).map(channel=>`<option>${channel}</option>`).join('')}`;
      const regionFilter=$('#filterRegion');
      if(regionFilter){regionFilter.disabled=regional;regionFilter.value=regional?activeRegion:''}
      updateIntakeLink();
    };
    $('#wsRole').value=selectedRole;updateRoleControls();$('#wsRole').onchange=e=>{selectedRole=e.target.value;activeRole=selectedRole==='regional-officer'?'officer':selectedRole;sessionStorage.setItem('ecmis-a4-role',selectedRole);updateRoleControls();delete $('#caseListView').dataset.anonymousReady;if(selectedId&&!canRegionalAccess(getState(selectedId).caseData))selectedId=null;syncUrl();if(selectedId)renderDetail();else{$('#caseDetailView').classList.add('ws-hidden');$('#caseListView').classList.remove('ws-hidden')}renderList()};

    const searchInput=$('#wsSearchInput'),searchResults=$('#wsSearchResults');
    if(searchInput){
      let searchTimer=null;
      const norm=s=>String(s||'').toLowerCase();
      const closeSearch=()=>{searchResults.classList.add('ws-hidden');searchResults.innerHTML=''};
      searchInput.addEventListener('input',()=>{
        clearTimeout(searchTimer);
        searchTimer=setTimeout(()=>{
          const q=searchInput.value.trim().toLowerCase();
          if(!q){closeSearch();return}
          const storeCases=Object.values(readStore());const seedCases=(typeof CASES!=='undefined'?CASES:[]).filter(sc=>!storeCases.some(cc=>cc.caseData?.id===sc.id));const caseHits=[...storeCases,...seedCases].filter(st=>{const c=st.caseData||st,d=st.documentData||{},w=st.workflow||{};const hay=[c.id,c.trackingYear,c.trackingCode,c.subject,c.complainant,c.agency,c.channel,w.status,d.caseNumber,(c.registry||{}).srr,(c.registry||{}).kbk,d.documentSubject].map(norm).join(' ');return hay.includes(q)});
          const docHits=Object.entries(OFFICIAL_DOCUMENTS).filter(([id,doc])=>norm(id+' '+doc.name).includes(q));
          const actionHits=SEARCH_ACTIONS.filter(a=>norm(a.label+' '+a.kw).includes(q));
          let html='';
          if(caseHits.length){html+=`<div class="ws-search-group">คดี (${caseHits.length})</div>`+caseHits.slice(0,6).map(st=>{const c=st.caseData||st;return`<button type="button" class="ws-search-item" data-search-case="${c.id}"><span>${escapeHtml(c.subject||c.id)}</span><small>เลขรับเรื่อง ${escapeHtml(registryReceiptNumber(c)||c.trackingYear||c.id)} · เลขรับบริการ ${escapeHtml(c.trackingYear)} · PIN ${escapeHtml(c.trackingCode)} · ${escapeHtml(c.channel)}</small></button>`}).join('')}
          if(docHits.length){html+=`<div class="ws-search-group">เอกสาร (${docHits.length})</div>`+docHits.slice(0,6).map(([id,doc])=>`<button type="button" class="ws-search-item" data-search-doc="${id}"><span>ปปท. ${id} ${escapeHtml(doc.name)}</span></button>`).join('')}
          if(actionHits.length){html+=`<div class="ws-search-group">ฟังก์ชัน (${actionHits.length})</div>`+actionHits.slice(0,6).map(a=>`<button type="button" class="ws-search-item" data-search-action="${a.action}"><span>${a.label}</span></button>`).join('')}
          if(!html)html='<div class="ws-search-empty">ไม่พบสิ่งที่ค้นหา</div>';
          searchResults.innerHTML=html;
          searchResults.classList.remove('ws-hidden');
        },180);
      });
      searchResults.addEventListener('click',e=>{
        const caseBtn=e.target.closest('[data-search-case]');
        if(caseBtn){selectedId=caseBtn.dataset.searchCase;syncUrl();renderDetail();closeSearch();searchInput.blur();return}
        const docBtn=e.target.closest('[data-search-doc]');
        if(docBtn){if(!selectedId){selectedId=Object.values(readStore())[0]?.caseData?.id||(typeof CASES!=='undefined'&&CASES[0]?CASES[0].id:'ECMIS-2569-000184');syncUrl();renderDetail()}const tab=document.querySelector(`[data-doc="${docBtn.dataset.searchDoc}"]`);if(tab)tab.click();closeSearch();searchInput.blur();return}
        const actBtn=e.target.closest('[data-search-action]');
        if(actBtn){const button=[...document.querySelectorAll('button')].find(b=>b.dataset.action===actBtn.dataset.searchAction&&!b.disabled);if(button)button.click();closeSearch();searchInput.blur()}
      });
      document.addEventListener('click',e=>{if(!e.target.closest('.ws-search'))closeSearch()});
    }

    if(regionalRegionSelect)regionalRegionSelect.onchange=e=>{activeRegion=e.target.value;sessionStorage.setItem('ecmis-a4-regional-region',activeRegion);updateRoleControls();selectedId=null;syncUrl();$('#caseDetailView').classList.add('ws-hidden');$('#caseListView').classList.remove('ws-hidden');renderList()};
    const duplicateObserver=new MutationObserver(()=>{
      enhanceActivity5Dispatch();
      enhanceNaccDispatch();
      enhanceNaccTransferReasons();
      enhanceSmartInputs();
      enhanceReviewRoute();
      enhanceCaseIssuance();
      enhanceAnonymousSuboption();
      enhanceAnonymousList();
      enhanceAnonymousBox();
      const focusDuplicateNote=$('[data-focus-target="adminNote"]');
      if(focusDuplicateNote&&!focusDuplicateNote.dataset.bound){focusDuplicateNote.dataset.bound='true';focusDuplicateNote.onclick=()=>{const note=$('#adminNote');note?.scrollIntoView({behavior:'smooth',block:'center'});note?.focus()}}
      const result=$('.duplicate-auto-result[data-level="high"]');
      if(!result||result.dataset.alerted||activeRole!=='admin'||!selectedId)return;
      result.dataset.alerted='true';
      const warningKey=`ecmis-duplicate-warning-${selectedId}`;
      if(sessionStorage.getItem(warningKey)==='shown')return;
      if(window.Swal&&$('#adminNote')){sessionStorage.setItem(warningKey,'shown');setTimeout(()=>Swal.fire({icon:'warning',title:'ระบบพบเรื่องที่อาจซ้ำ',html:`<div class="duplicate-alert-card"><span>ความใกล้เคียง</span><strong>${escapeHtml(result.dataset.score)}%</strong><p>พบความเชื่อมโยงกับ <b>${escapeHtml(result.dataset.caseDisplay||result.dataset.caseId)}</b></p><p>โปรดบันทึกความเห็นประกอบก่อนมอบหมายงาน</p></div>`,width:680,confirmButtonText:'รับทราบ',confirmButtonColor:'#082b50'}),0);}
    });
    duplicateObserver.observe(root,{childList:true,subtree:true});
    $$('.admin-queue-tab').forEach(tab=>tab.onclick=()=>{adminQueue=tab.dataset.queue;selectedId=null;syncUrl();$('#caseDetailView').classList.add('ws-hidden');$('#caseListView').classList.remove('ws-hidden');renderList()});
    ['Search','Channel','Region','Province','Type','Status','Duplicate','Date'].forEach(x=>{$(`#filter${x}`).addEventListener(x==='Search'?'input':'change',renderList)});
    // --- filter: วันที่ลงรับ — Thai Buddhist-Era calendar popover (matches complaint-form.html / staff-intake.html) ---
    const FILTER_THAI_MONTH_NAMES=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    const filterDatePad2=n=>String(n).padStart(2,'0');
    const filterDateIsoOf=(y,m,d)=>`${y}-${filterDatePad2(m+1)}-${filterDatePad2(d)}`;
    const filterDateTodayISO=()=>{const t=new Date();return filterDateIsoOf(t.getFullYear(),t.getMonth(),t.getDate())};
    function formatThaiBEDateFilter(isoDate){
      if(!isoDate)return '';
      const [y,m,d]=isoDate.split('-').map(Number);
      return `${d} ${FILTER_THAI_MONTH_NAMES[m-1]} พ.ศ. ${y+543}`;
    }
    const filterDateInput=$('#filterDate');
    function updateFilterDateDisplay(){
      const formatted=formatThaiBEDateFilter(filterDateInput.value);
      $('#filterDateDisplayText').textContent=formatted||'ทุกวันที่';
    }
    const filterDateCalView={year:new Date().getFullYear(),month:new Date().getMonth()};
    function filterDateInitSelects(){
      const monthSel=$('#filterDateTcMonth');
      monthSel.replaceChildren(...FILTER_THAI_MONTH_NAMES.map((name,i)=>{const opt=document.createElement('option');opt.value=String(i);opt.textContent=name;return opt}));
      const yearSel=$('#filterDateTcYear');
      const currentBEYear=new Date().getFullYear()+543;
      const yearOptions=[];for(let beYear=currentBEYear;beYear>=currentBEYear-100;beYear--)yearOptions.push(beYear);
      yearSel.replaceChildren(...yearOptions.map(beYear=>{const opt=document.createElement('option');opt.value=String(beYear-543);opt.textContent=String(beYear);return opt}));
      monthSel.addEventListener('change',()=>{filterDateCalView.month=Number(monthSel.value);filterDateRenderCalendar()});
      yearSel.addEventListener('change',()=>{filterDateCalView.year=Number(yearSel.value);filterDateRenderCalendar()});
    }
    function filterDateRenderCalendar(){
      $('#filterDateTcMonth').value=String(filterDateCalView.month);
      $('#filterDateTcYear').value=String(filterDateCalView.year);
      const daysWrap=$('#filterDateTcDays');
      daysWrap.replaceChildren();
      const firstWeekday=new Date(filterDateCalView.year,filterDateCalView.month,1).getDay();
      const daysInMonth=new Date(filterDateCalView.year,filterDateCalView.month+1,0).getDate();
      const selectedISO=filterDateInput.value;
      const nowISO=filterDateTodayISO();
      for(let i=0;i<firstWeekday;i++){const empty=document.createElement('div');empty.className='tc-day tc-day-empty';daysWrap.appendChild(empty)}
      for(let d=1;d<=daysInMonth;d++){
        const iso=filterDateIsoOf(filterDateCalView.year,filterDateCalView.month,d);
        const btn=document.createElement('button');
        btn.type='button';btn.className='tc-day';btn.textContent=String(d);
        if(iso===nowISO)btn.classList.add('tc-day-today');
        if(iso===selectedISO)btn.classList.add('tc-day-selected');
        btn.addEventListener('click',()=>filterDateSelect(iso));
        daysWrap.appendChild(btn);
      }
    }
    function filterDateSelect(iso){
      filterDateInput.value=iso;
      updateFilterDateDisplay();
      filterDateClosePicker();
      filterDateInput.dispatchEvent(new Event('change'));
    }
    function filterDateChangeMonth(delta){
      filterDateCalView.month+=delta;
      if(filterDateCalView.month<0){filterDateCalView.month=11;filterDateCalView.year--}
      if(filterDateCalView.month>11){filterDateCalView.month=0;filterDateCalView.year++}
      filterDateRenderCalendar();
    }
    $('#filterDateTcPrev').addEventListener('click',()=>filterDateChangeMonth(-1));
    $('#filterDateTcNext').addEventListener('click',()=>filterDateChangeMonth(1));
    $('#filterDateTcToday').addEventListener('click',()=>{const t=new Date();filterDateCalView.year=t.getFullYear();filterDateCalView.month=t.getMonth();filterDateSelect(filterDateTodayISO())});
    $('#filterDateTcClear').addEventListener('click',()=>{
      filterDateInput.value='';
      updateFilterDateDisplay();
      filterDateClosePicker();
      filterDateInput.dispatchEvent(new Event('change'));
    });
    function filterDateOnDocClick(evt){if(!evt.target.closest('.thai-date-field'))filterDateClosePicker()}
    function filterDateOpenPicker(){
      const existing=filterDateInput.value;
      const base=existing?new Date(existing):new Date();
      filterDateCalView.year=base.getFullYear();filterDateCalView.month=base.getMonth();
      filterDateRenderCalendar();
      $('#filterDateCalendarPopover').classList.remove('ws-hidden');
      document.addEventListener('click',filterDateOnDocClick);
    }
    function filterDateClosePicker(){
      $('#filterDateCalendarPopover').classList.add('ws-hidden');
      document.removeEventListener('click',filterDateOnDocClick);
    }
    function filterDateTogglePicker(){$('#filterDateCalendarPopover').classList.contains('ws-hidden')?filterDateOpenPicker():filterDateClosePicker()}
    $('#filterDateTrigger').addEventListener('click',evt=>{evt.stopPropagation();filterDateTogglePicker()});
    filterDateInitSelects();
    updateFilterDateDisplay();
    function caseSortTime(caseData){
      const receivedAt=Date.parse(caseData?.receivedAt||"");
      if(Number.isFinite(receivedAt))return receivedAt;
      return Number(String(caseData?.id||"").match(/(\d+)$/)?.[1]||0);
    }
    function allCases(){
      const stored=readStore();
      const merged=new Map(CASES.map(caseData=>[caseData.id,caseData]));
      Object.values(stored).forEach(entry=>{
        const caseData=entry?.caseData;
        if(!caseData?.id)return;
        merged.set(caseData.id,{...(merged.get(caseData.id)||{}),...caseData});
      });
      return [...merged.values()]
        .filter(canRegionalAccess)
        .sort((a,b)=>caseSortTime(b)-caseSortTime(a)||String(b.id).localeCompare(String(a.id),"th",{numeric:true}));
    }
    function canRegionalAccess(caseData){return selectedRole!=='regional-officer'||(caseData?.region===activeRegion&&isRegionalChannel(caseData?.channel))}
    function enhanceReviewRoute(){
      const planner=$('.route-planner');
      if(!isOfficerRole(activeRole)||!selectedId||!planner||planner.dataset.routeRestored)return;
      const d=getState(selectedId).documentData;
      const route=d.reviewRoute||'center';
      const panel=$('#absenceBox');
      const impact=$('.route-impact',planner);
      if(panel&&impact&&!$('#actingOfficer',panel))impact.insertAdjacentHTML('beforebegin',`<div class="ws-field" style="margin-top:.7rem"><label>ผู้พิจารณา *</label><select id="actingOfficer"><option value="">เลือกผู้พิจารณา</option><option value="ผู้อำนวยการกองบริหารคดี" ${d.actingOfficer==='ผู้อำนวยการกองบริหารคดี'?'selected':''}>ผู้อำนวยการกองบริหารคดี</option><option value="ผอ.กลุ่มมติ" ${d.actingOfficer==='ผอ.กลุ่มมติ'?'selected':''}>ผอ.กลุ่มมติ</option><option value="ผู้รักษาราชการแทนตามคำสั่ง" ${d.actingOfficer==='ผู้รักษาราชการแทนตามคำสั่ง'?'selected':''}>ผู้รักษาราชการแทนตามคำสั่ง</option></select></div>`);
      const exceptional=$('.route-option.exceptional',planner);
      if(exceptional){$('strong',exceptional).textContent='กำหนดผู้พิจารณาเป็นกรณีพิเศษ';$('small',exceptional).textContent='ใช้เมื่อผู้มีอำนาจไม่สามารถปฏิบัติหน้าที่ โดยต้องระบุเหตุผล'}
      if(impact)$('span',impact).textContent='ระบบส่งเรื่องไปยังผู้พิจารณาที่เลือก พร้อมเก็บเหตุผลและผู้ดำเนินการใน Log';
      const input=$(`input[name="route"][value="${route}"]`,planner);
      if(input)input.checked=true;
      panel?.classList.toggle('ws-hidden',route!=='division');
      planner.dataset.routeRestored='true';
    }
    function enhanceCaseIssuance(){}
    function enhanceAnonymousSuboption(){
      if(!isOfficerRole(activeRole)||!selectedId)return;
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
    function captureActivity5Dispatch(state){
      const d=state.documentData,value=id=>$(`#${id}`)?.value?.trim()||'';
      d.dispatchLetterNo=value('dispatchLetterNo')||d.dispatchLetterNo;
      d.dispatchLetterDate=value('dispatchLetterDate')||d.dispatchLetterDate;
      d.dispatchSendMethod=value('dispatchSendMethod')||d.dispatchSendMethod||'EMS';
      d.dispatchEms=value('dispatchEms')||d.dispatchEms;
      d.dispatchSentDate=value('dispatchSentDate')||d.dispatchSentDate;
      d.dispatchSentTime=value('dispatchSentTime')||d.dispatchSentTime;
      d.dispatchDestinationUnit=value('dispatchDestinationUnit')||d.dispatchDestinationUnit;
      d.dispatchNote=value('dispatchNote')||d.dispatchNote;
      d.dispatchProofName=$('#dispatchProof')?.files?.[0]?.name||d.dispatchProofName;
      return state;
    }
    function enhanceActivity5Dispatch(){
      if(!isOfficerRole(selectedRole)||!selectedId)return;
      const state=getState(selectedId),d=state.documentData;
      if(!['officer-dispatch','activity5-dispatch'].includes(state.workflow.stage))return;
      const body=$('.ws-editor-body');if(!body||body.dataset.activity5Dispatch)return;
      body.dataset.activity5Dispatch='true';
      const autoLetterNo=outgoingAt(state,'1-03')||Object.values(d.outgoingNumbers||{})[0]||'';
      body.innerHTML=`<section class="nacc-dispatch-hero"><p>ขั้นตอนหลัง ผู้อำนวยการกองบริหารคดี ลงนาม</p><h2>บันทึกข้อมูลจัดส่งไปยังเขตผู้รับผิดชอบ</h2><span>เจ้าหน้าที่รับเรื่อง ศรร. ตรวจสอบปลายทาง กรอกข้อมูลหนังสือและหลักฐานการจัดส่ง ก่อนยืนยันการจัดส่งไปยังเขต</span></section>${caseIssuanceCard(state)}${caseAgeCard(state)}<section class="ws-section"><h3>ข้อมูลหนังสือและการจัดส่ง</h3><div class="ws-grid-2"><div class="ws-field"><label>เลขหนังสือ *</label><input id="dispatchLetterNo" value="${escapeHtml(d.dispatchLetterNo||outgoingAt(state,'1-03')||'')}" placeholder="เช่น ปป 0004.2/0102"><small>ระบบออกเลขสารบรรณ ศรร. ขาออกให้อัตโนมัติ — แก้ไขได้ถ้าจำเป็น</small></div><div class="ws-field"><label>วันที่หนังสือ *</label>${ThaiDatePicker.html('dispatchLetterDate',{value:d.dispatchLetterDate||'',placeholder:'เลือกวันที่หนังสือ'})}</div><div class="ws-field"><label>หน่วยงานหรือเขตปลายทาง *</label><select id="dispatchDestinationUnit"><option value="">เลือกปลายทาง</option>${REGIONS.map(region=>`<option value="${region}" ${(d.dispatchDestinationUnit||d.proposedRegion||state.caseData.region)===region?'selected':''}>${region}</option>`).join('')}</select></div><div class="ws-field"><label>วิธีจัดส่ง *</label><select id="dispatchSendMethod"><option ${d.dispatchSendMethod==='EMS'?'selected':''}>EMS</option><option ${d.dispatchSendMethod==='ระบบสารบรรณอิเล็กทรอนิกส์'?'selected':''}>ระบบสารบรรณอิเล็กทรอนิกส์</option><option ${d.dispatchSendMethod==='เจ้าหน้าที่นำส่ง'?'selected':''}>เจ้าหน้าที่นำส่ง</option></select></div><div class="ws-field"><label>วันที่จัดส่ง *</label><div class="incident-datetime">${ThaiDatePicker.html('dispatchSentDate',{value:d.dispatchSentDate||'',placeholder:'เลือกวันที่จัดส่ง'})}${ThaiTimePicker.html('dispatchSentTime',{value:d.dispatchSentTime||'',placeholder:'เลือกเวลา',title:'เลือกเวลาที่จัดส่ง'})}</div></div><div class="ws-field"><label>เลข EMS / เลขติดตามการส่ง</label><input id="dispatchEms" value="${escapeHtml(d.dispatchEms||'')}" placeholder="เช่น ED123456789TH"></div><div class="ws-field"><label>หลักฐานการจัดส่ง</label><input id="dispatchProof" type="file" accept=".pdf,.jpg,.jpeg,.png"><small>${escapeHtml(d.dispatchProofName||'ยังไม่ได้แนบไฟล์')}</small></div><div class="ws-field ws-field-full"><label>หมายเหตุการจัดส่ง</label><textarea id="dispatchNote">${escapeHtml(d.dispatchNote||'')}</textarea></div></div></section><section class="ws-section"><h3>ประวัติการดำเนินการ</h3><ul class="ws-history">${state.decisionHistory.length?state.decisionHistory.map(entry=>`<li>${escapeHtml(entry.text)}<time>${entry.time}</time></li>`).join(''):'<li>ยังไม่มีประวัติ</li>'}</ul></section>`;
      ThaiDatePicker.wireAll(body);
      ThaiTimePicker.wireAll(body);
      if(state.workflow.complete)$$('input,select,textarea',body).forEach(field=>field.disabled=true);
      const actions=$('.ws-actions');if(actions)actions.innerHTML=state.workflow.complete?activity5Link(state):'<button class="ws-button secondary" data-action="activity5-dispatch-draft">บันทึกร่างข้อมูลจัดส่ง</button><button class="ws-button primary" data-action="activity5-dispatch-confirm">ยืนยันจัดส่งไปยังเขต</button>';
    }
    function enhanceNaccDispatch(){
      if(!isOfficerRole(activeRole)||!selectedId)return;
      const state=getState(selectedId),d=state.documentData;
      if(state.workflow.stage!=='nacc-dispatch')return;
      const body=$('.ws-editor-body');if(!body||body.dataset.naccDispatch)return;
      body.dataset.naccDispatch='true';
      body.innerHTML=`<section class="nacc-dispatch-hero"><p>ขั้นตอนสุดท้าย · ส่งต่อสำนักงาน ป.ป.ช.</p><h2>บันทึกการจัดส่งและแจ้งผลผู้ร้อง</h2><span>ผู้อำนวยการกองบริหารคดี อนุมัติแล้ว เจ้าหน้าที่รับเรื่องเป็นผู้บันทึกหลักฐานการส่ง</span></section><section class="ws-section"><h3>ข้อมูลหนังสือนำส่ง</h3><div class="ws-grid-2"><div class="ws-field"><label>เลขหนังสือส่ง ป.ป.ช. *</label><input id="naccLetterNo" value="${escapeHtml(d.naccLetterNo||outgoingAt(state,'1-04')||'')}" placeholder="เช่น ปป 0004/0102"><small>ระบบออกเลขหนังสือ กบค. ให้อัตโนมัติ — แก้ไขได้ถ้าจำเป็น</small></div><div class="ws-field"><label>วันที่ออกหนังสือ *</label>${ThaiDatePicker.html('naccLetterDate',{value:d.naccLetterDate||'',placeholder:'เลือกวันที่ออกหนังสือ'})}</div><div class="ws-field"><label>วิธีจัดส่ง *</label><select id="naccSendMethod"><option ${d.naccSendMethod==='EMS'?'selected':''}>EMS</option><option ${d.naccSendMethod==='ระบบสารบรรณอิเล็กทรอนิกส์'?'selected':''}>ระบบสารบรรณอิเล็กทรอนิกส์</option><option ${d.naccSendMethod==='เจ้าหน้าที่นำส่ง'?'selected':''}>เจ้าหน้าที่นำส่ง</option></select></div><div class="ws-field"><label>วันที่จัดส่ง *</label>${ThaiDatePicker.html('naccSentDate',{value:d.naccSentDate||'',placeholder:'เลือกวันที่จัดส่ง'})}</div><div class="ws-field"><label>เลข EMS / เลขติดตามการส่ง</label><input id="naccEms" value="${escapeHtml(d.naccEms||'')}" placeholder="เช่น ED123456789TH"></div><div class="ws-field"><label>หลักฐานการจัดส่ง</label><input id="naccProof" type="file" accept=".pdf,.jpg,.jpeg,.png"><small>${escapeHtml(d.naccProofName||'ยังไม่ได้แนบไฟล์')}</small></div></div></section><section class="ws-section"><h3>ข้อมูลมติบอร์ด</h3><div class="ws-grid-2"><div class="ws-field"><label>เลขที่มติ/ครั้งที่ประชุม *</label><input id="naccBoardNo" value="${escapeHtml(d.naccBoardNo||'')}" placeholder="เช่น มติครั้งที่ 18/2569"></div><div class="ws-field"><label>วันที่มีมติ *</label>${ThaiDatePicker.html('naccBoardDate',{value:d.naccBoardDate||'',placeholder:'เลือกวันที่มีมติ'})}</div><div class="ws-field ws-field-full"><label>ข้อความแจ้งมติบอร์ดแก่ผู้ร้อง</label><textarea id="naccBoardNote">${escapeHtml(d.naccBoardNote||'สำนักงานได้ส่งเรื่องของท่านไปยังสำนักงาน ป.ป.ช. เพื่อดำเนินการตามอำนาจหน้าที่แล้ว')}</textarea></div></div><label class="ws-choice nacc-notify-choice"><input type="checkbox" id="naccNotifyComplainant" ${d.naccNotified===false?'':'checked'}><span><strong>แจ้งผู้ร้องหลังยืนยันการจัดส่ง</strong><small>ผู้ร้องจะเห็นเลขหนังสือ วันที่ส่ง และเลข EMS ในหน้าติดตาม</small></span></label></section><section class="public-result-preview"><span>ข้อมูลที่ผู้ร้องจะเห็น</span><div><p><small>สถานะ</small><strong>ส่งสำนักงาน ป.ป.ช. แล้ว</strong></p><p><small>เลขหนังสือ</small><strong>${escapeHtml(d.naccLetterNo||'รอบันทึก')}</strong></p><p><small>เลข EMS</small><strong>${escapeHtml(d.naccEms||'รอบันทึก')}</strong></p></div></section><section class="ws-section"><h3>ประวัติการดำเนินการ</h3><ul class="ws-history">${state.decisionHistory.length?state.decisionHistory.map(entry=>`<li>${escapeHtml(entry.text)}<time>${entry.time}</time></li>`).join(''):'<li>ยังไม่มีประวัติ</li>'}</ul></section>`;
      ThaiDatePicker.wireAll(body);
      const refreshDispatchPreview=()=>{const working=captureNaccDispatch(getState(selectedId));const previewValues=$$('.public-result-preview strong');if(previewValues[1])previewValues[1].textContent=working.documentData.naccLetterNo||'รอบันทึก';if(previewValues[2])previewValues[2].textContent=working.documentData.naccEms||'รอบันทึก';renderDocumentInto($('#paperStage'),documentPaper(working,'1-11',activeRole))};
      $$('input,select,textarea',body).forEach(field=>field.addEventListener('input',refreshDispatchPreview));
      if(state.workflow.complete)$$('input,select,textarea',body).forEach(field=>field.disabled=true);
      const actions=$('.ws-actions');if(actions)actions.innerHTML=state.workflow.complete?'<button class="ws-button secondary" data-action="print">พิมพ์หนังสือ ปปท. 1-11</button>':'<button class="ws-button ghost" data-action="reset">ล้างข้อมูลและเริ่มใหม่</button><button class="ws-button secondary" data-action="nacc-draft">บันทึกร่างการจัดส่ง</button><button class="ws-button secondary" data-action="print">พิมพ์หนังสือ ปปท. 1-11</button><button class="ws-button primary" data-action="nacc-dispatch-confirm">ยืนยันส่งและแจ้งผู้ร้อง</button>';
      const naccTab=$('[data-doc="1-11"]');if(naccTab){$$('[data-doc]').forEach(tab=>tab.classList.toggle('active',tab===naccTab));renderDocumentInto($('#paperStage'),documentPaper(state,'1-11',activeRole))}
      attachIntelligentSuggestion('naccBoardNote','ผู้ช่วยอัจฉริยะสำหรับข้อความแจ้งมติบอร์ด');
    }
    function enhanceNaccTransferReasons(){
      const box=$('#naccReasonBox'),grid=$('.ws-choice-grid',box);if(!box||!grid||grid.dataset.exactNaccReasons)return;
      const state=getState(selectedId);grid.dataset.exactNaccReasons='true';
      grid.innerHTML=NACC_TRANSFER_REASONS.map(reason=>`<label class="ws-choice"><input type="checkbox" name="naccReason" value="${escapeHtml(reason)}" ${state.documentData.reasons.includes(reason)?'checked':''}><span><strong>${escapeHtml(reason)}</strong></span></label>`).join('');
      grid.addEventListener('change',()=>{const working=capture(getState(selectedId));renderDocumentInto($('#paperStage'),documentPaper(working,$('[data-doc].active')?.dataset.doc||REVIEW_RECORD_ID,activeRole))});
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
      [
        ['adminNote','ผู้ช่วยอัจฉริยะสำหรับความเห็นธุรการเกี่ยวกับผลตรวจเรื่องซ้ำ'],
        ['officerOpinion','ผู้ช่วยอัจฉริยะสำหรับความเห็นเจ้าหน้าที่'],
        ['absenceNote','ผู้ช่วยอัจฉริยะสำหรับเหตุผลการลาและผู้รักษาการ'],
        ['centerOpinion','ผู้ช่วยอัจฉริยะสำหรับความเห็น ผู้อำนวยการศูนย์รับเรื่องร้องเรียน'],
        ['divisionOpinion','ผู้ช่วยอัจฉริยะสำหรับคำสั่ง ผู้อำนวยการกองบริหารคดี'],
      ].forEach(([id,label])=>attachIntelligentSuggestion(id,label));
      const currentState=selectedId?getState(selectedId):null;
      const currentData=currentState?.documentData;
      const otherReasonControl=(checkboxId,inputId,checked,value,placeholder)=>`<div class="reason-other"><label class="ws-choice"><input type="checkbox" id="${checkboxId}" ${checked?'checked':''}><span><strong>อื่น ๆ</strong></span></label><div class="ws-field"><label for="${inputId}">ระบุเหตุผลอื่น ๆ</label><input id="${inputId}" value="${escapeHtml(value||'')}" placeholder="${placeholder}"></div></div>`;
      const naccReasonBox=$('#naccReasonBox');
      if(naccReasonBox&&currentData&&!$('#naccOtherChecked'))naccReasonBox.insertAdjacentHTML('beforeend',otherReasonControl('naccOtherChecked','naccOtherReason',currentData.naccOtherChecked,currentData.naccOtherReason,'ระบุเหตุผลหรือประเภทเรื่องเพิ่มเติม'));
      const notAcceptReason=$('#notAcceptReason');
      const notAcceptLabel=notAcceptReason?.parentElement.querySelector('label');
      if(notAcceptLabel&&!notAcceptLabel.dataset.notAcceptRequired){notAcceptLabel.dataset.notAcceptRequired='true';notAcceptLabel.setAttribute('for','notAcceptReason');notAcceptLabel.textContent='เหตุผลที่ไม่รับไว้ดำเนินการ *'}
      const refreshOtherReasonPaper=()=>{
        const paper=$('#paperStage');
        if(!paper||!selectedId)return;
        const activeDoc=$('[data-doc].active')?.dataset.doc||firstDocumentId(state,activeRole);
        renderDocumentInto(paper,documentPaper(capture(getState(selectedId)),activeDoc,activeRole));
      };
      ['naccOtherChecked','naccOtherReason'].forEach(id=>{const el=$('#'+id);if(el&&!el.dataset.otherReasonBound){el.dataset.otherReasonBound='true';el.addEventListener('input',refreshOtherReasonPaper)}});
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
    function receivedMatchesFilterDate(received,isoDate){
      const ts=parseThaiReceived(received);
      if(ts==null)return false;
      const dt=new Date(ts);
      const[fy,fm,fd]=isoDate.split('-').map(Number);
      return dt.getFullYear()===fy&&dt.getMonth()===fm-1&&dt.getDate()===fd;
    }
    function renderList(){
      const q=$('#filterSearch').value.trim().toLowerCase(),channel=$('#filterChannel').value,region=$('#filterRegion').value,province=$('#filterProvince').value,type=$('#filterType').value,status=$('#filterStatus').value,dup=$('#filterDuplicate').value,date=$('#filterDate').value;
      const cases=allCases(),states=cases.map(c=>getState(c.id));
      $('#dashboardTotal').textContent=cases.length;
      $('#dashboardPending').textContent=states.filter(s=>s.workflow.stage==='admin'&&!s.workflow.complete).length;
      $('#dashboardReview').textContent=states.filter(s=>s.workflow.stage!=='admin'&&!s.workflow.complete).length;
      $('#dashboardDone').textContent=states.filter(s=>s.workflow.complete).length;
      const unassignedCount=states.filter(state=>state.assignmentHistory.length===0).length;
      const assignedCount=states.filter(state=>state.assignmentHistory.length>0).length;
      $$('.admin-queue-tab').forEach(tab=>{
        const assigned=tab.dataset.queue==='assigned';
        tab.textContent=`${assigned?'มอบหมายแล้ว':'ยังไม่มอบหมาย'} (${assigned?assignedCount:unassignedCount})`;
        tab.classList.toggle('active',tab.dataset.queue===adminQueue);
        tab.setAttribute('aria-current',tab.dataset.queue===adminQueue?'page':'false');
      });
      const queueCases=selectedRole==='admin'?cases.filter(c=>(getState(c.id).assignmentHistory.length>0)===(adminQueue==='assigned')):cases;
      const rows=queueCases.filter(c=>{const s=getState(c.id);const searchable=[c.id,registryReceiptNumber(c)||'....................',c.complainant,c.subject,c.agency].join(' ').toLowerCase();const risk=analyzeDuplicateCase(c).level==='low'?'low':'high';return(!q||searchable.includes(q))&&(!channel||c.channel===channel)&&(!region||c.region===region)&&(!province||c.province===province)&&(!type||c.type===type)&&(!status||s.workflow.status===status)&&(!dup||risk===dup)&&(!date||receivedMatchesFilterDate(c.received,date))});
      $('#caseRows').innerHTML=rows.map(c=>{const s=getState(c.id),analysis=analyzeDuplicateCase(c),risk=analysis.level!=='low',anonymous=s.documentData.anonymous;return `<tr data-case="${c.id}" class="${risk?'duplicate-risk-row':''}" tabindex="0"><td><strong>${registryReceiptNumber(c)||'....................'}</strong><small>${c.received}</small></td><td><strong>${escapeHtml(c.complainant)}</strong><small>${anonymous?'ไม่มีข้อมูลระบุตัวผู้ร้อง':`เลขบัตร •••••••••${c.id4||'ไม่ระบุ'}`}</small></td><td><span class="ws-status ${anonymous?'danger':'success'}">${anonymous?'บัตรสนเท่ห์':'ไม่ใช่บัตรสนเท่ห์'}</span>${c.confidentialityRequested?'<small>ขอปกปิดข้อมูลผู้ร้อง</small>':'<small>ไม่ได้ขอปกปิดข้อมูล</small>'}</td><td><strong>${escapeHtml(c.subject)}</strong><small>${escapeHtml(c.agency)}</small></td><td><strong>${escapeHtml(c.province)}</strong><small>${escapeHtml(c.region)}</small></td><td>${c.channel}</td><td><span class="ws-status ${s.workflow.complete?'success':''}">${s.workflow.status}</span><small>ผู้รับผิดชอบ: ${ROLE_LABELS[s.workflow.owner]||s.workflow.owner}</small></td><td><span class="ws-status ${risk?'danger':'success'}">${risk?`ควรตรวจสอบ ${analysis.score}%`:'ยังไม่พบสัญญาณ'}</span></td><td><button type="button" class="case-mini-toggle" data-case="${c.id}" aria-expanded="false" aria-controls="mini-${c.id}" title="ดูสถานะแบบย่อ"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button></td></tr><tr id="mini-${c.id}" class="case-mini-row ws-hidden" data-mini-for="${c.id}"><td colspan="9">${miniStagebar(s)}</td></tr>`}).join('')||'<tr><td colspan="9" class="ws-empty">ไม่พบรายการตามเงื่อนไข</td></tr>';
      $$('[data-case]').forEach(r=>{const open=()=>{selectedId=r.dataset.case;syncUrl();renderDetail()};r.onclick=open;r.onkeydown=e=>{if(e.key==='Enter')open()}});
      $$('.case-mini-toggle').forEach(btn=>{
        btn.onclick=e=>{
          e.stopPropagation();
          const row=document.getElementById(`mini-${btn.dataset.case}`);
          if(!row)return;
          const open=row.classList.toggle('ws-hidden')===false;
          btn.setAttribute('aria-expanded',String(open));
        };
        btn.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();btn.click()}};
      });
    }
    function screeningAnalysisCard(c){
      const analysis=analyzeDuplicateCase(c);
      const levelLabel=analysis.level==='high'?'ความเสี่ยงสูง':analysis.level==='review'?'ต้องตรวจสอบ':'ยังไม่พบสัญญาณ';
      const displayId=caseDisplayId(findOriginalCase(analysis.caseId)?.caseData)||analysis.caseId||'';
      return `<div class="duplicate-auto-result ${analysis.level==='high'?'duplicate-critical':analysis.level==='review'?'duplicate-review':''}" data-level="${analysis.level}" data-case-id="${escapeHtml(analysis.caseId)}" data-case-display="${escapeHtml(displayId)}" data-score="${analysis.score}"><div class="duplicate-score"><span>ความใกล้เคียง</span><strong>${analysis.score}<small>%</small></strong><b>${levelLabel}</b></div><div class="duplicate-result-detail"><span>ระบบตรวจสอบอัตโนมัติ (คำแนะนำ)</span><strong>${analysis.level==='high'?'พบความเสี่ยงเรื่องซ้ำระดับสูง':analysis.level==='review'?'พบเรื่องที่ควรตรวจสอบเพิ่มเติม':'ยังไม่พบเรื่องที่มีความใกล้เคียงอย่างมีนัยสำคัญ'}</strong>${analysis.caseId?`<p>เชื่อมโยงกับเรื่องเดิม <b>${escapeHtml(displayId)}</b></p>`:''}<div class="duplicate-signal-list">${analysis.signals.map(signal=>`<small>${escapeHtml(signal)}</small>`).join('')}</div></div></div>`;
    }
    function screeningDecisionForm(state,{withAdditionalInfo=false}={}){
      const analysis=analyzeDuplicateCase(state.caseData);
      const candidates=duplicateCandidateOptions(state).slice(0,10);
      const otherComplainant=analysis.signals.find(s=>s.includes('ผู้ร้องรายอื่น'));
      return `<div class="screening-options">
        <label class="ws-choice screening-choice"><input type="radio" name="screeningDecision" value="new"><span><strong>เรื่องใหม่ — ดำเนินการปกติ</strong><small>ออกเลขติดตามใหม่และเข้าสู่การพิจารณา (18/1, 58/2, ส่ง ป.ป.ช. ฯลฯ)</small></span></label>
        <label class="ws-choice screening-choice"><input type="radio" name="screeningDecision" value="duplicate"><span><strong>เรื่องซ้ำ — รวมกับเรื่องเดิม</strong><small>ไม่ออกเลขใหม่ ระบบดึงเลขติดตามของเรื่องเดิมและปิดเรื่องนี้</small></span></label>
      </div>
      ${otherComplainant?`<div class="screening-warning">⚠ ${escapeHtml(otherComplainant)} — หากเป็นผู้ร้องคนละคน เจ้าหน้าที่สามารถเลือก "เรื่องใหม่" เพื่อแยกกันดำเนินการได้</div>`:''}
      <div id="screeningDuplicateBox" class="ws-hidden">
        <div class="ws-field"><label>เลือกเรื่องเดิม *</label><select id="screeningLinkedCase"><option value="">— เลือกเรื่องเดิม —</option>${candidates.map(cd=>`<option value="${escapeHtml(cd.id)}" ${cd.id===analysis.caseId?'selected':''}>${escapeHtml(caseDisplayId(cd))} · ${escapeHtml(cd.complainant)} · ${escapeHtml(cd.subject)}</option>`).join('')}</select></div>
        <div class="ws-field"><label>หมายเหตุเรื่องซ้ำซ้อน *</label><textarea id="screeningNote" placeholder="บันทึกเหตุผลที่สรุปว่าเป็นเรื่องเดียวกันหรือเรื่องซ้ำซ้อน"></textarea></div>
        ${withAdditionalInfo?`<div class="ws-field"><label>ข้อมูลเพิ่มเติมที่ส่งเข้าเรื่องเดิม (ถ้ามี)</label><textarea id="screeningAdditionalInfo" placeholder="เอกสารหรือข้อมูลใหม่ที่ผู้ร้องนำมาเพิ่มเติม — จะบันทึกเข้ากับเรื่องเดิม"></textarea></div>`:''}
      </div>`;
    }
    function screeningSection(state){
      const d=state.documentData,c=state.caseData;
      const decided=d.screening?.decision;
      if(decided==='duplicate'){
        const original=findOriginalCase(d.screening.linkedCaseId);
        return `<div class="ws-section screening-box screening-decided"><h3>ผลการกลั่นกรองเรื่องซ้ำ</h3><div class="screening-summary"><span class="ws-status danger">เรื่องซ้ำ — รวมกับเรื่องเดิม</span><dl><div><dt>เรื่องเดิม</dt><dd>${escapeHtml(caseDisplayId(original?.caseData)||d.screening.linkedCaseId||'—')}${original?` · ${escapeHtml(original.caseData.complainant)} · ${escapeHtml(original.caseData.subject)}`:''}</dd></div><div><dt>เลขติดตามเดิม</dt><dd>${escapeHtml(d.screening.linkedTracking||'—')}</dd></div><div><dt>ตัดสินใจโดย</dt><dd>${escapeHtml(d.screening.decidedBy||'—')} · ${escapeHtml(d.screening.decidedAt||'—')}</dd></div><div><dt>หมายเหตุซ้ำซ้อน</dt><dd>${escapeHtml(d.screening.note||'—')}</dd></div>${d.screening.additionalInfo?`<div><dt>ข้อมูลเพิ่มเติมที่ส่งเข้าเรื่องเดิม</dt><dd>${escapeHtml(d.screening.additionalInfo)}</dd></div>`:''}${d.screening.reportedToSupervisor?`<div><dt>รายงานผู้บังคับบัญชา</dt><dd>${escapeHtml(d.screening.reportedToSupervisor.note)} — ${escapeHtml(d.screening.reportedToSupervisor.by)} · ${escapeHtml(d.screening.reportedToSupervisor.at)}</dd></div>`:''}</dl></div><div class="screening-actions"><button type="button" class="ws-button secondary" data-action="print-duplicate-receipt">พิมพ์ใบแจ้ง (เลขเดิม)</button><button type="button" class="ws-button ghost" data-action="screening-undo">ยกเลิกการตัดสินใจ</button></div></div>`;
      }
      if(decided==='new'){
        return `<div class="ws-section screening-box screening-decided"><h3>ผลการกลั่นกรองเรื่องซ้ำ</h3><div class="screening-summary"><span class="ws-status success">เรื่องใหม่ — ดำเนินการปกติ</span><p>ตัดสินใจโดย ${escapeHtml(d.screening.decidedBy||'—')} · ${escapeHtml(d.screening.decidedAt||'—')}</p>${d.screening.reportedToSupervisor?`<p class="screening-report-line">📌 รายงานผู้บังคับบัญชา: ${escapeHtml(d.screening.reportedToSupervisor.note)} (${escapeHtml(d.screening.reportedToSupervisor.by)} · ${escapeHtml(d.screening.reportedToSupervisor.at)})</p>`:''}<div class="screening-actions"><button type="button" class="ws-button ghost" data-action="screening-undo">เปลี่ยนการตัดสินใจ</button><button type="button" class="ws-button secondary" data-action="screening-report">รายงานผู้บังคับบัญชา (พบเรื่องซ้ำกับสำนวนระหว่างดำเนินการ)</button></div>${d.mergedDuplicates?.length?`<div class="screening-merged-list"><h4>เรื่องซ้ำที่รวมเข้ามา</h4><ul>${d.mergedDuplicates.map(m=>`<li>${escapeHtml(caseDisplayId(findOriginalCase(m.caseId)?.caseData)||m.caseId)} · ${escapeHtml(m.at)}${m.note?` — ${escapeHtml(m.note)}`:''}</li>`).join('')}</ul></div>`:''}</div></div>`;
      }
      return `<div class="ws-section screening-box"><h3>1. กลั่นกรองเรื่องซ้ำ <span class="screening-required">*ต้องตัดสินใจก่อนดำเนินการ</span></h3>${screeningAnalysisCard(c)}${screeningDecisionForm(state,{withAdditionalInfo:true})}<div class="screening-actions"><button type="button" class="ws-button secondary" data-action="screening-report">รายงานผู้บังคับบัญชา (พบเรื่องซ้ำกับสำนวนระหว่างดำเนินการ)</button><button type="button" class="ws-button primary" data-action="screening-confirm">ยืนยันการกลั่นกรอง</button></div><p class="duplicate-policy-note">ระบบเป็นเพียงคำแนะนำ (คะแนน สัญญาณ เรื่องที่ใกล้เคียง) — เจ้าหน้าที่เป็นผู้ตัดสินใจ ระบบไม่ตัดสินใจแทน</p></div>`;
    }
    function adminScreeningBlock(state){
      const d=state.documentData,c=state.caseData;
      const decided=d.screening?.decision;
      const original=findOriginalCase(d.screening.linkedCaseId)?.caseData;
      const decidedSummary=decided==='duplicate'
        ?`<div class="screening-summary"><span class="ws-status danger">เรื่องซ้ำ — รวมกับเรื่องเดิม ${escapeHtml(caseDisplayId(original)||d.screening.linkedCaseId||'')}</span><p>ตัดสินใจโดย ${escapeHtml(d.screening.decidedBy||'—')} · ${escapeHtml(d.screening.decidedAt||'—')}</p><p>หมายเหตุ: ${escapeHtml(d.screening.note||'—')}</p></div>`
        :decided==='new'
          ?`<div class="screening-summary"><span class="ws-status success">เรื่องใหม่ — ดำเนินการปกติ</span><p>ตัดสินใจโดย ${escapeHtml(d.screening.decidedBy||'—')} · ${escapeHtml(d.screening.decidedAt||'—')}</p></div>`
          :'';
      return `${screeningAnalysisCard(c)}${decidedSummary}<p class="duplicate-policy-note">ธุรการ ศรร. มีหน้าที่ตรวจสอบเบื้องต้นและให้ความเห็นเท่านั้น — การตัดสินใจเรื่องใหม่/เรื่องซ้ำเป็นของเจ้าหน้าที่รับเรื่อง ระบบไม่ตัดสินใจแทน</p><div class="ws-field screening-admin-opinion"><label>ความเห็นธุรการ (ตรวจเบื้องต้น — ส่งต่อให้เจ้าหน้าที่รับเรื่อง)</label><textarea id="adminNote" placeholder="บันทึกข้อสังเกตหรือความเห็นเบื้องต้นเพื่อส่งต่อให้เจ้าหน้าที่รับเรื่องตัดสินใจ">${escapeHtml(d.adminNote)}</textarea></div>${d.mergedDuplicates?.length?`<div class="screening-merged-list"><h4>เรื่องซ้ำที่รวมเข้ามา</h4><ul>${d.mergedDuplicates.map(m=>`<li>${escapeHtml(caseDisplayId(findOriginalCase(m.caseId)?.caseData)||m.caseId)} · ${escapeHtml(m.at)}${m.note?` — ${escapeHtml(m.note)}`:''}</li>`).join('')}</ul></div>`:''}`;
    }
    function editorFor(state){const d=state.documentData,c=state.caseData,w=state.workflow;if(activeRole==='officer'&&!['officer','admin'].includes(w.owner)&&!w.complete)return `<div class="ws-section"><h3>ข้อมูลจากขั้นตอนก่อนหน้า</h3>${caseReadonly(c)}</div><div class="ws-callout" style="margin:.4rem 0 .9rem">ส่งให้ ${escapeHtml(ROLE_LABELS[w.owner]||w.owner)} พิจารณาแล้ว — ข้อมูลถูกล็อค รอผลการพิจารณา</div><div class="ws-section"><h3>ผลการพิจารณาที่ส่งไปแล้ว</h3><div class="ws-readonly"><dl><div><dt>ผลการพิจารณา</dt><dd>${({'18/1ก':'รับไว้ดำเนินการ 18/1 (ก)','18/1ข':'รับไว้ดำเนินการ 18/1 (ข)','18/4':'รับไว้ดำเนินการ 18/4','58/2':'ดำเนินการตาม 58/2','send-nacc':'ส่งสำนักงาน ป.ป.ช.','not-accept':'ไม่รับไว้ดำเนินการ'})[d.decision]||d.decision}</dd></div><div><dt>ชื่อเรื่องสำหรับเอกสาร</dt><dd><span class="doc-editable" data-editable="documentSubject" contenteditable="true" spellcheck="false">${escapeHtml(d.documentSubject||c.subject)}</span></dd></div><div><dt>เขตที่เสนอให้มอบหมาย</dt><dd>${escapeHtml(d.proposedRegion||c.region||'ไม่ระบุ')}</dd></div><div><dt>ความเห็นเจ้าหน้าที่</dt><dd>${escapeHtml(d.officerOpinion||'ไม่ระบุ')}</dd></div>${d.reasons.length?`<div><dt>เหตุผลส่ง ป.ป.ช.</dt><dd>${d.reasons.map(escapeHtml).join(', ')}</dd></div>`:''}${d.naccOtherChecked&&d.naccOtherReason?`<div><dt>อื่น ๆ (ส่ง ป.ป.ช.)</dt><dd>${escapeHtml(d.naccOtherReason)}</dd></div>`:''}${d.notAcceptReason?`<div><dt>เหตุผลไม่รับไว้ดำเนินการ</dt><dd>${escapeHtml(d.notAcceptReason)}</dd></div>`:''}${d.notAcceptOtherChecked&&d.notAcceptOtherReason?`<div><dt>อื่น ๆ (ไม่รับฯ)</dt><dd>${escapeHtml(d.notAcceptOtherReason)}</dd></div>`:''}${d.anonymous?`<div><dt>บัตรสนเท่ห์</dt><dd>ใช่</dd></div>`:''}${d.reviewRoute==='division'?`<div><dt>เส้นทาง</dt><dd>ส่งตรง ผู้อำนวยการกองบริหารคดี${d.absenceReasonType?` (${escapeHtml(d.absenceReasonType)})`:''}</dd></div>`:''}</dl></div></div>`;if(activeRole==='admin'){
      const duplicate=analyzeDuplicateCase(c);
      const duplicateDisplayId=caseDisplayId(findOriginalCase(duplicate.caseId)?.caseData)||duplicate.caseId||'';
      const duplicateCard=duplicate.level==='low'
        ?`<div class="duplicate-auto-result duplicate-auto-clear" data-level="low"><div><span>ตรวจสอบอัตโนมัติแล้ว</span><strong>ยังไม่พบเรื่องที่มีความใกล้เคียงอย่างมีนัยสำคัญ</strong><p>ระบบเปรียบเทียบข้อมูลผู้ร้อง เนื้อหา พื้นที่ และช่วงเวลารับเรื่องแล้ว</p></div></div>`
        :`<div class="duplicate-auto-result ${duplicate.level==='high'?'duplicate-critical':''}" data-level="${duplicate.level}" data-case-id="${escapeHtml(duplicate.caseId)}" data-case-display="${escapeHtml(duplicateDisplayId)}" data-score="${duplicate.score}"><div class="duplicate-score"><span>ความใกล้เคียง</span><strong>${duplicate.score}<small>%</small></strong><b>${duplicate.level==='high'?'ความเสี่ยงสูง':'ต้องตรวจสอบ'}</b></div><div class="duplicate-result-detail"><span>ระบบตรวจสอบอัตโนมัติ</span><strong>${duplicate.level==='high'?'พบความเสี่ยงเรื่องร้องเรียนซ้ำระดับสูง':'พบเรื่องที่ควรตรวจสอบเพิ่มเติม'}</strong><p>เชื่อมโยงกับเรื่องเดิม <b>${escapeHtml(duplicateDisplayId)}</b></p><div class="duplicate-signal-list">${duplicate.signals.map(signal=>`<small>${escapeHtml(signal)}</small>`).join('')}</div></div><button type="button" class="duplicate-focus-action" data-focus-target="adminNote">บันทึกความเห็น</button></div><div class="duplicate-opinion-suggestions"><span>คำแนะนำสำหรับความเห็นธุรการ</span><div><button type="button" data-suggestion-target="adminNote" data-suggestion-text="${escapeHtml(`มีความเป็นไปได้ว่าเป็นเรื่องเดียวกับ ${duplicateDisplayId} เนื่องจากข้อมูลมีความใกล้เคียง ${duplicate.score}%`)}">น่าจะเป็นเรื่องเดียวกัน</button><button type="button" data-suggestion-target="adminNote" data-suggestion-text="${escapeHtml(`เรื่องนี้อาจเกี่ยวข้องกับ ${duplicateDisplayId} ควรให้เจ้าหน้าที่ผู้รับผิดชอบตรวจสอบข้อเท็จจริงเพิ่มเติม`)}">อาจเป็นเรื่องที่เกี่ยวข้องกัน</button><button type="button" data-suggestion-target="adminNote" data-suggestion-text="ผลตรวจอัตโนมัติพบความเชื่อมโยง แต่ข้อมูลยังไม่เพียงพอที่จะสรุปว่าเป็นเรื่องซ้ำ">ยังสรุปไม่ได้</button></div></div>`;
      const assignmentFields=`<div class="ws-grid-2"><div class="ws-field"><label>เจ้าหน้าที่รับผิดชอบหลัก</label><select id="adminAssignee"><option value="">เลือกเจ้าหน้าที่</option>${OFFICERS.map(x=>`<option ${d.assignedOfficer===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="ws-field"><label>ผู้ปฏิบัติงานแทน</label><select id="adminBackup"><option value="">ไม่กำหนด</option>${OFFICERS.map(x=>`<option ${d.backupOfficer===x?'selected':''}>${x}</option>`).join('')}</select></div></div>`;
      const assignmentHistory=`<h3 style="margin-top:1rem">ประวัติการมอบหมาย</h3><ul class="ws-history">${state.assignmentHistory.length?state.assignmentHistory.map(x=>`<li>${escapeHtml(x.text)}<time>${escapeHtml(x.time||'')}</time></li>`).join(''):'<li>ยังไม่มีประวัติการมอบหมาย</li>'}</ul>`;
      if(state.assignmentHistory.length>0)return `<div class="ws-section"><h3>1. ข้อมูลเรื่องร้องเรียน</h3>${adminCaseSummary(c)}</div><div class="ws-section"><h3>2. การมอบหมายงาน</h3><div class="ws-callout">ผู้รับผิดชอบหลัก: ${escapeHtml(d.assignedOfficer||'รอมอบหมายใหม่')}<br>ผู้ปฏิบัติงานแทน: ${escapeHtml(d.backupOfficer||'ไม่ได้กำหนด')}<br>ความเห็นธุรการ: ${escapeHtml(d.adminNote||'ไม่มี')}</div>${assignmentFields}${assignmentHistory}</div>`;
      return `<div class="ws-section"><h3>1. ข้อมูลเรื่องร้องเรียน</h3>${adminCaseSummary(c)}</div><div class="ws-section"><h3>2. ผลตรวจเรื่องซ้ำและการกลั่นกรอง</h3>${adminScreeningBlock(state)}</div><div class="ws-section"><h3>3. ลงรับและมอบหมายเจ้าหน้าที่</h3>${assignmentFields}${assignmentHistory}</div>`;
    }
      if(activeRole==='officer'){if(isOfficerRole(activeRole)&&!['officer','admin'].includes(w.owner)&&!w.complete)return `<div class="ws-section"><h3>ข้อมูลจากขั้นตอนก่อนหน้า</h3>${caseReadonly(c)}</div><div class="ws-callout" style="margin:.4rem 0 .9rem">ส่งให้ ${escapeHtml(ROLE_LABELS[w.owner]||w.owner)} พิจารณาแล้ว — ข้อมูลถูกล็อค รอผลการพิจารณา</div><div class="ws-section"><h3>ผลการพิจารณาที่ส่งไปแล้ว</h3><div class="ws-readonly"><dl><div><dt>ผลการพิจารณา</dt><dd>${({'18/1ก':'รับไว้ดำเนินการ 18/1 (ก)','18/1ข':'รับไว้ดำเนินการ 18/1 (ข)','18/4':'รับไว้ดำเนินการ 18/4','62':'ดำเนินการตามมาตรา 62','58/2':'ดำเนินการตาม 58/2','send-nacc':'ส่งสำนักงาน ป.ป.ช.','not-accept':'ไม่รับไว้ดำเนินการ'})[d.decision]||d.decision}</dd></div><div><dt>ชื่อเรื่องสำหรับเอกสาร</dt><dd><span class="doc-editable" data-editable="documentSubject" contenteditable="true" spellcheck="false">${escapeHtml(d.documentSubject||c.subject)}</span></dd></div><div><dt>เขตที่เสนอให้มอบหมาย</dt><dd>${escapeHtml(d.proposedRegion||c.region||'ไม่ระบุ')}</dd></div><div><dt>ความเห็นเจ้าหน้าที่</dt><dd>${escapeHtml(d.officerOpinion||'ไม่ระบุ')}</dd></div>${d.reasons.length?`<div><dt>เหตุผลส่ง ป.ป.ช.</dt><dd>${d.reasons.map(escapeHtml).join(', ')}</dd></div>`:''}${d.naccOtherChecked&&d.naccOtherReason?`<div><dt>อื่น ๆ (ส่ง ป.ป.ช.)</dt><dd>${escapeHtml(d.naccOtherReason)}</dd></div>`:''}${d.notAcceptReason?`<div><dt>เหตุผลไม่รับไว้ดำเนินการ</dt><dd>${escapeHtml(d.notAcceptReason)}</dd></div>`:''}${d.anonymous?`<div><dt>บัตรสนเท่ห์</dt><dd>ใช่</dd></div>`:''}</dl></div></div>`;if(d.screening?.decision==='duplicate')return `${screeningSection(state)}`;return `${screeningSection(state)}<div class="ws-section"><h3>ข้อมูลเรื่องร้องเรียน</h3>${officerSubjectFields(state)}${workingCopySection(state)}<div class="ws-callout" style="margin-top:.7rem">ผู้รับผิดชอบหลัก: ${escapeHtml(d.assignedOfficer||'ยังไม่ระบุ')}<br>ผู้ปฏิบัติงานแทน: ${escapeHtml(d.backupOfficer||'ไม่ได้กำหนด')}<br>หมายเหตุธุรการ: ${escapeHtml(d.adminNote||'ไม่มี')}</div></div><div class="ws-section"><h3>${REVIEW_RECORD_NAME}</h3><div class="ws-choice-grid">${[['18/1ก','รับไว้ดำเนินการ 18/1 (ก)'],['18/1ข','รับไว้ดำเนินการ 18/1 (ข)'],['18/4','รับไว้ดำเนินการ 18/4'],['62','ดำเนินการตามมาตรา 62'],['58/2','ดำเนินการตาม 58/2'],['send-nacc','ส่งสำนักงาน ป.ป.ช.'],['not-accept','ไม่รับไว้ดำเนินการ']].map(([v,l])=>`<label class="ws-choice"><input type="radio" name="decision" value="${v}" ${d.decision===v?'checked':''}><span><strong>${l}</strong></span></label>`).join('')}</div><div class="ws-field" style="margin-top:.8rem"><label>เขตที่เสนอให้มอบหมาย *</label><select id="proposedRegion"><option value="">เลือกเขตที่เสนอ</option>${REGIONS.map(region=>`<option value="${region}" ${(d.proposedRegion||c.region)===region?'selected':''}>${region}</option>`).join('')}</select></div><div id="naccReasonBox" class="${d.decision==='send-nacc'?'':'ws-hidden'}" style="margin-top:.8rem"><h3>เหตุผลส่งต่อ เลือกได้หลายข้อ</h3><div class="ws-choice-grid">${NACC_TRANSFER_REASONS.map(x=>`<label class="ws-choice"><input type="checkbox" name="naccReason" value="${escapeHtml(x)}" ${d.reasons.includes(x)?'checked':''}><span><strong>${escapeHtml(x)}</strong></span></label>`).join('')}</div></div><div id="notAcceptBox" class="${d.decision==='not-accept'?'':'ws-hidden'}" style="margin-top:.8rem"><div class="ws-field"><label>เหตุผลที่ไม่รับไว้ดำเนินการ</label><textarea id="notAcceptReason">${escapeHtml(d.notAcceptReason)}</textarea></div><label class="ws-choice" style="margin-top:.6rem"><input type="checkbox" id="anonymous" ${d.anonymous?'checked':''}><span><strong>เป็นบัตรสนเท่ห์</strong></span></label></div><div class="ws-field" style="margin-top:.8rem"><label>ความเห็นเจ้าหน้าที่รับเรื่อง</label><textarea id="officerOpinion">${escapeHtml(d.officerOpinion)}</textarea></div><section class="route-planner"><header><div><span>เส้นทางการพิจารณา</span><h3>กำหนดผู้รับพิจารณาลำดับถัดไป</h3></div><small>ใช้ลำดับปกติเป็นค่าเริ่มต้น</small></header><div class="route-options"><label class="route-option standard"><input type="radio" name="route" value="center" ${d.reviewRoute!=='division'?'checked':''}><div class="route-flow"><span>เจ้าหน้าที่รับเรื่อง</span><i>→</i><span>ผอ.ศรร.</span><i>→</i><span>ผอ.กบค.</span></div><strong>ดำเนินการตามลำดับปกติ</strong><small>ส่งให้ ผอ.ศรร. พิจารณาก่อนเสนอ ผอ.กบค.</small></label><label class="route-option exceptional"><input type="radio" name="route" value="division" ${d.reviewRoute==='division'?'checked':''}><div class="route-flow"><span>เจ้าหน้าที่รับเรื่อง</span><i>→</i><span class="route-skipped">ผอ.ศรร.</span><i>→</i><span>ผอ.กบค.</span></div><strong>เสนอข้ามขั้นตอนเป็นกรณีพิเศษ</strong><small>ใช้เมื่อ ผอ.ศรร. ไม่สามารถปฏิบัติหน้าที่ และต้องบันทึกเหตุผล</small></label></div><div class="route-exception-panel ${d.reviewRoute==='division'?'':'ws-hidden'}" id="absenceBox"><div class="route-exception-head"><span>กรณีพิเศษ</span><strong>บันทึกเหตุผลประกอบการส่งตรงถึง ผอ.กบค.</strong></div><div class="ws-grid-2"><div class="ws-field"><label>ประเภทเหตุผล *</label><select id="absenceReasonType"><option value="">เลือกประเภทเหตุผล</option>${['ลาราชการ','ติดภารกิจราชการ','ไม่สามารถปฏิบัติหน้าที่','มีคำสั่งให้เสนอโดยตรง','อื่น ๆ'].map(reason=>`<option value="${reason}" ${d.absenceReasonType===reason?'selected':''}>${reason}</option>`).join('')}</select></div><div class="ws-field ws-field-full"><label>รายละเอียดและช่วงเวลาที่ไม่อยู่ *</label><textarea id="absenceNote" placeholder="ระบุเหตุผล วันที่หรือช่วงเวลา และข้อมูลอ้างอิงที่เกี่ยวข้อง">${escapeHtml(d.absenceNote)}</textarea></div></div><div class="route-impact"><strong>ผลของเส้นทางนี้</strong><span>เรื่องจะส่งตรงถึง ผอ.กบค. พร้อมบันทึก Log โดย ผอ.กบค. สามารถอนุมัติให้ ผอ.ศรร. กลับมาให้ความเห็นเพิ่มเติมภายหลังได้</span></div></div></section>${signatureCard(state,'officer',activeRole)}${documentPackPanel(state)}</div>`}
      if(activeRole==='center')return `<div class="ws-section"><h3>ข้อมูลจากเจ้าหน้าที่รับเรื่อง</h3>${caseReadonly(c)}<div class="ws-callout" style="margin-top:.7rem"><strong>เขตที่เสนอให้มอบหมาย: ${escapeHtml(d.proposedRegion||c.region||'ยังไม่ระบุ')}</strong><br>ผลเสนอ: ${d.decision}<br>ความเห็น: ${escapeHtml(d.officerOpinion||'ยังไม่ระบุ')}</div></div>${d.screening?.reportedToSupervisor?`<div class="ws-section screening-box"><h3>รายงานเรื่องซ้ำ (จากเจ้าหน้าที่รับเรื่อง)</h3><p>${escapeHtml(d.screening.reportedToSupervisor.note)}</p><small>รายงานโดย ${escapeHtml(d.screening.reportedToSupervisor.by)} · ${escapeHtml(d.screening.reportedToSupervisor.at)}${d.screening.reportedToSupervisor.resolved?` — ผู้บังคับบัญชาตัดสินใจแล้ว: ${escapeHtml(d.screening.reportedToSupervisor.resolved)}`:''}</small>${d.screening.reportedToSupervisor.resolved?'':`<div class="screening-actions"><button type="button" class="ws-button primary" data-action="center-merge">รวมกับเรื่องเดิม</button><button type="button" class="ws-button secondary" data-action="center-separate">แยกดำเนินการตามคำสั่ง</button></div>`}</div>`:''}<div class="ws-section"><h3>ความเห็น ผู้อำนวยการศูนย์รับเรื่องร้องเรียน</h3><div class="ws-choice-grid"><label class="ws-choice"><input type="radio" name="centerDecision" value="agree" ${d.centerDecision!=='disagree'?'checked':''}><span><strong>เห็นชอบให้มอบหมาย ${escapeHtml(d.proposedRegion||c.region||'เขตที่เสนอ')}</strong></span></label><label class="ws-choice"><input type="radio" name="centerDecision" value="disagree" ${d.centerDecision==='disagree'?'checked':''}><span><strong>ไม่เห็นชอบ/ส่งกลับแก้ไข</strong></span></label></div><div class="ws-field" style="margin-top:.7rem"><label>ความเห็นและข้อเสนอแนะ</label><textarea id="centerOpinion">${escapeHtml(d.centerOpinion)}</textarea><small>บันทึกความเห็นและข้อเท็จจริงเพิ่มเติมได้ในช่องเดียว โดยไม่แก้ไขคำร้องเดิมหรือเปลี่ยนผลเสนอของเจ้าหน้าที่อัตโนมัติ</small></div></div>${signatureCard(state,'center',activeRole)}`;
      const centerText=d.centerOpinion|| (d.absenceNote?`ข้ามขั้นตอนตามหมายเหตุ: ${d.absenceNote}`:'ยังไม่ระบุ');
      return `<div class="ws-section"><h3>ข้อมูลจากขั้นตอนก่อนหน้า</h3>${caseReadonly(c)}<div class="ws-callout" style="margin-top:.7rem">เขตที่เสนอให้มอบหมาย: ${escapeHtml(d.proposedRegion||c.region||'ยังไม่ระบุ')}<br>ความเห็นเจ้าหน้าที่: ${escapeHtml(d.officerOpinion||'ยังไม่ระบุ')}<br>ความเห็น ผู้อำนวยการศูนย์รับเรื่องร้องเรียน: ${escapeHtml(centerText)}</div></div><div class="ws-section"><h3>${activeRole==='acting'?'คำสั่งผู้รักษาราชการแทน':'คำสั่ง ผู้อำนวยการกองบริหารคดี'}</h3><div class="ws-field"><label>ความเห็นและคำสั่ง</label><textarea id="divisionOpinion">${escapeHtml(d.divisionOpinion)}</textarea><small>บันทึกคำสั่งและข้อเท็จจริงเพิ่มเติมได้ในช่องเดียว โดยไม่แก้ไขคำร้องเดิมหรือเปลี่ยนผลเสนอของเจ้าหน้าที่อัตโนมัติ</small></div></div>${signatureCard(state,'division',activeRole)}${caseIssuanceCard(state)}${caseAgeCard(state)}`}
    function actionsFor(state){const reset='<button class="ws-button ghost" data-action="reset">ล้างข้อมูลและเริ่มใหม่</button>';if(activeRole==='admin'){const hasAssignedWork=Boolean(state.documentData.assignedOfficer)&&state.assignmentHistory.some(entry=>['assign','reassign'].includes(entry.action)||/\[(มอบหมาย|มอบหมายใหม่)\]|มอบหมายให้/.test(entry.text||''));const canRecall=hasAssignedWork&&!state.workflow.complete&&!['nacc-dispatch','anonymous-box'].includes(state.workflow.stage);return `${reset}${canRecall?'<button class="ws-button danger" data-action="recall-assignment">ดึงงานกลับ</button>':''}<button class="ws-button secondary" data-action="draft">บันทึกร่าง</button><button class="ws-button primary" data-action="assign">${state.workflow.status==='รอมอบหมายใหม่'?'มอบหมายใหม่':'ลงรับและมอบหมาย'}</button>`}if(activeRole==='officer'){const officerLocked=!['officer','admin'].includes(state.workflow.owner)&&!state.workflow.complete;const duplicateClosed=state.workflow.stage==='duplicate-closed'&&state.workflow.complete;const screeningPending=state.documentData.screening?.decision!=='new'&&!duplicateClosed;if(duplicateClosed)return `${reset}<button class="ws-button secondary" data-action="print-duplicate-receipt">พิมพ์ใบแจ้ง (เลขเดิม)</button><button class="ws-button ghost" data-action="screening-undo">ยกเลิกการตัดสินใจ</button>`;return officerLocked?`<button class="ws-button secondary" data-action="print">พิมพ์แบบบันทึก</button>`:`${reset}<button class="ws-button secondary" data-action="draft">บันทึกแบบบันทึก</button><button class="ws-button secondary" data-action="print">พิมพ์แบบบันทึก</button><button class="ws-button danger" data-action="officer-refuse">ปฏิเสธรับงาน</button>${screeningPending?'':`<button class="ws-button primary" data-action="officer-send">บันทึกและส่งพิจารณา</button>`}`}if(activeRole==='center')return `${reset}<button class="ws-button danger" data-action="center-return">ส่งกลับเจ้าหน้าที่แก้ไข</button><button class="ws-button primary" data-action="center-send">บันทึกและส่ง ผู้อำนวยการกองบริหารคดี</button>`;return `${reset}${activity5Link(state)}<button class="ws-button secondary" data-action="division-center">ขอความเห็น ผู้อำนวยการศูนย์รับเรื่องร้องเรียน</button><button class="ws-button danger" data-action="division-return">ส่งกลับเจ้าหน้าที่แก้ไข</button><button class="ws-button primary" data-action="approve">อนุมัติและดำเนินการต่อ</button><button class="ws-button secondary" data-action="send-committee">ส่งเรื่องเสนอคณะกรรมการ ป.ป.ท.</button>`}
    function operationalWorkspace(state){const w=state.workflow;const editor=`<section class="ws-card ws-editor ${activeRole==='admin'?'ws-admin-workspace':''}"><header class="ws-editor-head"><div><p class="ws-kicker">งานของ ${ROLE_LABELS[activeRole]}</p><h2>${w.complete?'ตรวจสอบข้อมูลที่ดำเนินการแล้ว':'ดำเนินการเรื่องร้องเรียน'}</h2></div><span class="ws-status">${w.status}</span></header><div class="ws-editor-body">${editorFor(state)}${activeRole==='admin'?'':`<div class="ws-section"><h3>ประวัติการตัดสินใจ</h3><ul class="ws-history">${state.decisionHistory.length?state.decisionHistory.map(x=>`<li>${escapeHtml(x.text)}<time>${x.time}</time></li>`).join(''):'<li>ยังไม่มีประวัติการตัดสินใจ</li>'}</ul></div>`}</div></section>`;if(activeRole==='admin')return `<div class="ws-admin-layout">${editor}</div>`;return `<div class="document-workspace">${editor}<aside class="ws-doc-pane"><div class="ws-doc-toolbar"><div class="ws-doc-tabs">${docTabs(state,activeRole)}</div><label class="ws-doc-jump" title="ข้ามไปยังเอกสาร"><span aria-hidden="true">ไปที่</span><select id="docJump" aria-label="เลือกเอกสาร"><option value="">เอกสาร…</option>${docSelect(state,activeRole)}</select></label><button class="ws-button secondary" data-action="print">พิมพ์/PDF</button><button type="button" class="ws-button secondary ws-doc-pane-toggle" title="ย่อแผงเอกสาร" aria-label="ย่อแผงเอกสาร" aria-expanded="true" style="padding:.42rem .62rem;line-height:1">»</button></div><button type="button" class="ws-doc-pane-rail" title="ขยายแผงเอกสาร" aria-label="ขยายแผงเอกสาร">«<span>เอกสาร</span></button><div class="doc-edit-bar" aria-label="แถบจัดรูปแบบ"><select class="doc-edit-font" data-format="fontName" title="ฟอนต์"><option value="">ฟอนต์</option><option>Sarabun</option><option>TH Sarabun New</option><option>Tahoma</option><option>Times New Roman</option><option>Angsana New</option></select><select class="doc-edit-size" data-format="fontSize" title="ขนาดตัวอักษร"><option value="">ขนาด</option><option value="3">16</option><option value="4">18</option><option value="5">20</option><option value="6">24</option><option value="7">32</option></select><span class="doc-edit-bar-sep"></span><button type="button" data-format="bold" title="ตัวหนา"><b>B</b></button><button type="button" data-format="italic" title="ตัวเอียง"><i>I</i></button><button type="button" data-format="underline" title="ขีดเส้นใต้"><u>U</u></button><span class="doc-edit-bar-sep"></span><label class="doc-edit-color" title="สีตัวอักษร"><input type="color" data-format="foreColor" value="#17232e"></label><span class="doc-edit-bar-sep"></span><button type="button" data-format="justifyLeft" title="ชิดซ้าย">ซ้าย</button><button type="button" data-format="justifyCenter" title="กึ่งกลาง">กลาง</button><button type="button" data-format="justifyRight" title="ชิดขวา">ขวา</button><span class="doc-edit-bar-sep"></span><button type="button" data-format="insertUnorderedList" title="รายการหัวข้อ">•≡</button><button type="button" data-format="insertOrderedList" title="รายการลำดับเลข">1≡</button><span class="doc-edit-bar-sep"></span><button type="button" data-format="outdent" title="ลดย่อหน้า">⤺</button><button type="button" data-format="indent" title="เพิ่มย่อหน้า">⤻</button><span class="doc-edit-bar-sep"></span><button type="button" data-format="undo" title="เลิกทำ">↶</button><button type="button" data-format="redo" title="ทำซ้ำ">↷</button><span class="doc-edit-bar-sep"></span><span class="doc-edit-bar-tip">หน้าไหลอัตโนมัติ</span></div><button type="button" class="doc-edit-fab" data-action="toggle-edit" title="เปิด/ปิดโหมดแก้ไขเอกสาร"><span class="doc-edit-fab-icon" aria-hidden="true">✏️</span><span class="doc-edit-fab-label">แก้ไขเอกสาร</span></button><div class="ws-paper-stage" id="paperStage">${documentPaper(state,firstDocumentId(state,activeRole),activeRole)}</div></aside></div>`}
    function renderDetail(){const state=getState(selectedId),c=state.caseData,w=state.workflow;$('#caseListView').classList.add('ws-hidden');const view=$('#caseDetailView');view.classList.remove('ws-hidden');view.innerHTML=`<button class="ws-button ghost" id="backList" style="margin-bottom:.8rem">กลับรายการเรื่องร้องเรียน</button><section class="ws-card ws-case-head"><div><p class="ws-kicker">${escapeHtml(c.channel)} · ${escapeHtml(c.region)}</p><h1>เลขรับเรื่อง ${escapeHtml(registryReceiptNumber(c)||c.trackingYear||c.id)}</h1><div class="ws-case-meta"><span>${escapeHtml(c.subject)}</span><span>รับเรื่อง ${c.received}</span><span>เลขรับบริการ ${trackingLabel(c)}</span></div></div><div><span class="ws-status ${w.complete?'success':''}">${w.status}</span><p style="margin:.4rem 0 0;font-size:.8rem;color:#687789">ผู้รับผิดชอบ: ${ROLE_LABELS[w.owner]}</p></div></section><nav class="ws-card ws-stagebar a5" aria-label="สถานะและลำดับการดำเนินงาน">${stagebar(state)}</nav>${operationalWorkspace(state)}<div class="ws-actions">${actionsFor(state)}</div>`;$('#backList').onclick=()=>{view.classList.add('ws-hidden');$('#caseListView').classList.remove('ws-hidden');selectedId=null;syncUrl();renderList()};wireDetail(state);enhanceSmartInputs();scheduleDocumentPagination($('#paperStage'))}
    function capture(state){const d=state.documentData;const value=id=>$('#'+id)?.value?.trim()||'';if(activeRole==='admin'){d.assignedOfficer=value('adminAssignee');d.backupOfficer=value('adminBackup');if($('#adminNote'))d.adminNote=value('adminNote')}if(activeRole==='officer'){d.documentSubject=value('documentSubject')||state.caseData.subject||'';d.decision=$('input[name="decision"]:checked')?.value||d.decision;d.reasons=$$('input[name="naccReason"]:checked').map(x=>x.value);d.notAcceptReason=value('notAcceptReason');d.anonymous=$('#anonymous')?.checked||false;d.proposedRegion=value('proposedRegion')||d.proposedRegion;d.officerOpinion=value('officerOpinion');d.reviewRoute=$('input[name="route"]:checked')?.value||'center';d.absenceReasonType=value('absenceReasonType');d.absenceNote=value('absenceNote');d.actingOfficer=value('actingOfficer')||d.actingOfficer;d.actingOrder=value('actingOrder')||d.actingOrder;const wc=ensureWorkingCopy(state);WORKING_COPY_FIELDS.forEach(([key])=>{const el=$('#wc'+key[0].toUpperCase()+key.slice(1));if(el)wc[key]=el.value.trim()})}if(activeRole==='center'){d.centerDecision=$('input[name="centerDecision"]:checked')?.value||'';d.centerOpinion=value('centerOpinion')}if(activeRole==='division'||activeRole==='acting'){d.divisionOpinion=value('divisionOpinion');d.actingOrder=value('actingOrder')||d.actingOrder}if(activeRole==='admin'||activeRole==='officer'){const sc=d.screening||(d.screening={});const slc=$('#screeningLinkedCase');if(slc&&d.screening?.decision!=='duplicate')sc.linkedCaseId=slc.value;const sn=$('#screeningNote');if(sn&&d.screening?.decision!=='duplicate')sc.note=sn.value.trim();const sai=$('#screeningAdditionalInfo');if(sai&&d.screening?.decision!=='duplicate')sc.additionalInfo=sai.value.trim()}return state}
  
  function applyEditableAll(paper,on){
    if(!paper)return;
    if(on){paper.setAttribute('contenteditable','true');paper.style.outline='1px dashed #4a90d9'}else{paper.removeAttribute('contenteditable');paper.style.outline=''}
    paper.querySelectorAll('.form3-approval-signature,.signature-proof,.form3-signed-block,.doc-edit-fab,.doc-edit-bar').forEach(el=>{if(on)el.setAttribute('contenteditable','false');else el.removeAttribute('contenteditable')});
  }

  function wireDetail(state){const refreshPaper=()=>{const paper=$('#paperStage');if(!paper)return;const activeDoc=$('[data-doc].active')?.dataset.doc||firstDocumentId(state,activeRole);paper.innerHTML=documentPaper(capture(state),activeDoc,activeRole)};const applyDecision=()=>{const updated=capture(state);updated.documentData.documentPack={...(updated.documentData.documentPack||{}),caseType:packCaseTypeOf(updated)};saveState(selectedId,updated);renderDetail()};$$('input,textarea,select',$('#caseDetailView')).forEach(x=>{if(x.id==='proposedRegion')return;x.addEventListener('input',refreshPaper)});
      const proposedRegionEl=$('#proposedRegion');if(proposedRegionEl&&!proposedRegionEl.dataset.regionBound){proposedRegionEl.dataset.regionBound='true';proposedRegionEl.addEventListener('change',()=>{const scrollY=window.scrollY;refreshPaper();requestAnimationFrame(()=>window.scrollTo(0,scrollY))})}$$('input[name="decision"]').forEach(x=>x.onchange=applyDecision);$$('input[name="screeningDecision"]').forEach(x=>x.onchange=()=>{$('#screeningDuplicateBox')?.classList.toggle('ws-hidden',x.value!=='duplicate')});$$('.wc-tab').forEach(button=>button.addEventListener('click',()=>{const target=button.dataset.wcTab;$$('.wc-tab').forEach(b=>{const on=b.dataset.wcTab===target;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false')});$$('.wc-panel').forEach(p=>p.classList.toggle('ws-hidden',p.dataset.wcPanel!==target))}));$('#anonymous')?.addEventListener('change',applyDecision);$$('input[name="route"]').forEach(x=>x.onchange=()=>$('#absenceBox').classList.toggle('ws-hidden',x.value!=='division'));$$('[data-doc]').forEach(b=>b.onclick=()=>{$$('[data-doc]').forEach(x=>{const selected=x===b;x.classList.toggle('active',selected);x.setAttribute('aria-selected',String(selected))});$('#paperStage').innerHTML=documentPaper(capture(state),b.dataset.doc,activeRole)});$$('[data-action]').forEach(b=>b.onclick=()=>handleAction(b.dataset.action,state));$$('.pack-open').forEach(b=>b.onclick=()=>{const tab=$$('[data-doc]').find(t=>t.dataset.doc===b.dataset.docOpen);if(tab)tab.onclick()});
      const docJump=$('#docJump');if(docJump&&!docJump.dataset.bound){docJump.dataset.bound='true';docJump.addEventListener('change',()=>{const tab=$$('[data-doc]').find(t=>t.dataset.doc===docJump.value);if(tab)tab.onclick();docJump.value=''})}
      const opinionPaper=$('#paperStage');
      if(opinionPaper&&!opinionPaper.dataset.opinionBound){
        opinionPaper.dataset.opinionBound='true';
        const editableCollect=key=>[...opinionPaper.querySelectorAll('[data-editable="'+key+'"]')].map(p=>p.textContent||'').join('');
        opinionPaper.addEventListener('input',event=>{
          const target=event.target.closest('[data-editable]');
          if(!target)return;
          const key=target.dataset.editable;
          if(!/^(documentSubject|centerOpinion|divisionOpinion|assignedOfficer)$/.test(key))return;
          const state=getState(selectedId);
          const text=editableCollect(key);
          const clean=key==='assignedOfficer'?text.replace(/^\(|\)$/g,''):text;
          if(state.documentData[key]===clean)return;
          state.documentData[key]=clean;
          const field=$('#'+key);
          if(field&&document.activeElement!==field)field.value=text;
          clearTimeout(opinionPaper._opinionTimer);
          opinionPaper._opinionTimer=setTimeout(()=>saveState(selectedId,state),500);
        });
        const editBar=document.querySelector('.doc-edit-bar');if(editBar&&!editBar.dataset.bound){editBar.dataset.bound='true';editBar.addEventListener('click',event=>{const btn=event.target.closest('[data-format]');if(!btn)return;const f=btn.dataset.format;if(f==='bold')document.execCommand('bold');else if(f==='italic')document.execCommand('italic');else if(f==='underline')document.execCommand('underline');else if(f)document.execCommand(f);});editBar.addEventListener('change',event=>{const sel=event.target.closest('select[data-format],input[data-format]');if(!sel)return;const f=sel.dataset.format;const v=sel.value;document.execCommand(f,false,v);sel.value=sel.type==='color'?sel.value:'';});
        let dragState=null;editBar.addEventListener('mousedown',e=>{if(e.target.closest('button,select,input,label'))return;if(e.target.closest('.doc-edit-bar-tip'))return;e.preventDefault();const r=editBar.getBoundingClientRect();dragState={dx:e.clientX-r.left,dy:e.clientY-r.top};editBar.style.transform='none';editBar.style.left=r.left+'px';editBar.style.top=r.top+'px';editBar.style.position='fixed';e.preventDefault()});document.addEventListener('mousemove',e=>{if(!dragState)return;editBar.style.left=Math.max(4,e.clientX-dragState.dx)+'px';editBar.style.top=Math.max(4,e.clientY-dragState.dy)+'px'});document.addEventListener('mouseup',()=>{dragState=null});}
opinionPaper.addEventListener('blur',event=>{
          const target=event.target.closest('[data-editable]');
          if(!target)return;
          scheduleDocumentPagination(opinionPaper);
        },true);
        opinionPaper.addEventListener('click',event=>{
          if(!opinionPaper.classList.contains('doc-edit-mode'))return;
          const box=event.target.closest('.doc-checkbox');
          if(!box)return;
          if(box.closest('.form3-decision-column'))return;
          box.textContent=box.textContent.trim()==='✓'?'':'✓';
        });
      }
      const docWorkspace=$('.document-workspace');
      if(docWorkspace&&!docWorkspace.dataset.paneBound){
        docWorkspace.dataset.paneBound='true';
        const setPaneCollapsed=collapsed=>{docWorkspace.classList.toggle('pane-collapsed',collapsed);const toggle=$('.ws-doc-pane-toggle');if(toggle)toggle.setAttribute('aria-expanded',String(!collapsed));try{localStorage.setItem('ecmis-a4-docpane-collapsed',collapsed?'1':'0')}catch{}};
        if(localStorage.getItem('ecmis-a4-docpane-collapsed')==='1')setPaneCollapsed(true);
        docWorkspace.addEventListener('click',e=>{const t=e.target.closest('.ws-doc-pane-toggle, .ws-doc-pane-rail');if(!t)return;if(t.classList.contains('ws-doc-pane-rail'))setPaneCollapsed(false);else setPaneCollapsed(!docWorkspace.classList.contains('pane-collapsed'))});
      }$$('[data-pack-page]').forEach(input=>input.addEventListener('input',updatePackCount));updatePackCount();const detailView=$('#caseDetailView');if(detailView&&!detailView.dataset.paginationBound){detailView.dataset.paginationBound='true';const schedule=()=>requestAnimationFrame(()=>scheduleDocumentPagination($('#paperStage')));detailView.addEventListener('input',schedule);detailView.addEventListener('change',schedule);detailView.addEventListener('click',schedule)}}
    const captureBase=capture;
    capture=state=>{
      const captured=captureBase(state),d=captured.documentData;
      if(activeRole==='officer'){
        d.naccOtherChecked=$('#naccOtherChecked')?.checked||false;
        d.naccOtherReason=$('#naccOtherReason')?.value?.trim()||'';
        const packPages={};
        $$('[data-pack-page]').forEach(input=>{packPages[input.dataset.packPage]=Number(input.value)||0});
        d.documentPack={...(d.documentPack||{}),sourceVersion:DOCUMENT_SOURCE_VERSION,caseType:packCaseTypeOf(captured),pages:packPages};
      }
      return captured;
    };
    async function handleAction(action,state){
      if(action==='toggle-edit'){const paper=$('#paperStage');if(!paper)return;const isOn=paper.classList.toggle('doc-edit-mode');const pane=paper.closest('.ws-doc-pane');pane?.querySelector('.doc-edit-fab')?.classList.toggle('active',isOn);pane?.querySelector('.doc-edit-bar')?.classList.toggle('show',isOn);applyEditableAll(paper,isOn);return}if(action==='print'){await scheduleDocumentPagination($('#paperStage'));window.print();return}
      if(action==='reset'){
        const ok=await confirmDo('ล้างข้อมูลและเริ่มใหม่','ข้อมูลกระบวนงานและประวัติของเรื่องนี้จะถูกล้าง โดยไม่กระทบเรื่องอื่น','ล้างข้อมูล');
        if(!ok.isConfirmed)return;
        const store=readStore();delete store[selectedId];writeStore(store);
        notify('success','ล้างข้อมูลแล้ว','พร้อมเริ่มดำเนินการเรื่องนี้ใหม่');renderDetail();renderList();return;
      }
      state=capture(state);
      const d=state.documentData,w=state.workflow;
      const add=text=>state.decisionHistory.push({text,time:now()});
      if(action==='officer-sign'){
        if(!d.officerOpinion)return notify('warning','ยังไม่มีความเห็นเจ้าหน้าที่','กรอกข้อเท็จจริงและความเห็นก่อนลงนาม');
        const officerName=d.assignedOfficer||'เจ้าหน้าที่รับเรื่อง';
        const confirmed=await confirmSignature(state,officerName,'เจ้าหน้าที่รับเรื่อง');
        if(!confirmed.isConfirmed)return;
        d.officerSignature=signatureRecord('เจ้าหน้าที่รับเรื่อง',officerName);
        add(`เจ้าหน้าที่รับเรื่อง ${officerName} ลงนามอิเล็กทรอนิกส์แล้ว`);
        saveState(selectedId,state);notify('success','ลงนามเรียบร้อย','ระบบบันทึกหลักฐานการลงนามของเจ้าหน้าที่รับเรื่องแล้ว');renderDetail();return;
      }
      if(action==='center-sign'){
        if(d.centerDecision==='disagree')return notify('warning','ยังไม่สามารถลงนามเห็นชอบ','กรณีไม่เห็นชอบให้ใช้คำสั่งส่งกลับเจ้าหน้าที่แก้ไข');
        if(!d.centerOpinion)return notify('warning','ยังไม่มีความเห็น ผู้อำนวยการศูนย์รับเรื่องร้องเรียน','กรอกความเห็นก่อนลงนาม');
        const confirmed=await confirmSignature(state,'ผู้อำนวยการศูนย์รับเรื่องร้องเรียน','ผู้อำนวยการศูนย์รับเรื่องร้องเรียน');
        if(!confirmed.isConfirmed)return;
        d.centerSignature=signatureRecord('ผู้อำนวยการศูนย์รับเรื่องร้องเรียน','ผู้อำนวยการศูนย์รับเรื่องร้องเรียน');
        add(`ผู้อำนวยการศูนย์รับเรื่องร้องเรียน ลงนามอิเล็กทรอนิกส์แล้ว`);
        saveState(selectedId,state);notify('success','ลงนามเรียบร้อย','ระบบบันทึกหลักฐานการลงนามของ ผู้อำนวยการศูนย์รับเรื่องร้องเรียน แล้ว');renderDetail();return;
      }
      if(action==='division-sign'){
        if(!d.divisionOpinion)return notify('warning','ยังไม่มีคำสั่ง ผู้อำนวยการกองบริหารคดี','กรอกความเห็นและคำสั่งก่อนลงนาม');
        if(d.reviewRoute!=='division'&&!d.centerSignature?.signed)return notify('warning','ยังไม่มีลายมือชื่อ ผู้อำนวยการศูนย์รับเรื่องร้องเรียน','ต้องให้ ผู้อำนวยการศูนย์รับเรื่องร้องเรียน ลงนามก่อนส่งตามลำดับปกติ');
        const signer=activeRole==='acting'?(d.actingOfficer||'ผู้รักษาราชการแทน'):'ผู้อำนวยการกองบริหารคดี';
        const confirmed=await confirmSignature(state,signer,activeRole==='acting'?'ผู้รักษาราชการแทน':'ผู้อำนวยการกองบริหารคดี');
        if(!confirmed.isConfirmed)return;
        d.divisionSignature=signatureRecord(activeRole==='acting'?'ผู้รักษาราชการแทน':'ผู้อำนวยการกองบริหารคดี',signer);
        add(`${signer} ลงนามอิเล็กทรอนิกส์แล้ว`);
        saveState(selectedId,state);notify('success','ลงนามเรียบร้อย','ระบบบันทึกหลักฐานการลงนามแล้ว พร้อมดำเนินการอนุมัติ');renderDetail();return;
      }
      if(action==='draft'){if(activeRole==='officer'&&!['officer','admin'].includes(w.owner)&&!w.complete)return notify('warning','ข้อมูลถูกล็อค','เรื่องนี้อยู่ระหว่างการพิจารณาของผู้มีอำนาจ');
        state.documentVersions.push({version:state.documentVersions.length+1,actor:ROLE_LABELS[activeRole],time:now()});
        saveState(selectedId,state);notify('success','บันทึกร่างแล้ว','ข้อมูลถูกเก็บในเรื่องนี้และจะแสดงให้ผู้ดำเนินการคนถัดไปเห็น');renderDetail();return;
      }
      if(action==='screening-confirm'){
        const screeningChoice=$('input[name="screeningDecision"]:checked')?.value;
        if(!screeningChoice)return notify('warning','ยังไม่ได้เลือกผลการกลั่นกรอง','เลือก "เรื่องใหม่" หรือ "เรื่องซ้ำ" ก่อนยืนยัน');
        const decidedIso=new Date().toISOString();
        const decider=ROLE_LABELS[activeRole]||activeRole;
        if(screeningChoice==='duplicate'){
          const linkedCaseId=$('#screeningLinkedCase')?.value||'';
          if(!linkedCaseId)return notify('warning','ยังไม่ได้เลือกเรื่องเดิม','เลือกเรื่องเดิมที่จะรวมก่อนยืนยัน');
          const screeningNote=String($('#screeningNote')?.value||'').trim();
          if(!screeningNote)return notify('warning','ยังไม่ได้บันทึกหมายเหตุ','บันทึกหมายเหตุเรื่องซ้ำซ้อนก่อนยืนยัน');
          const additionalInfo=String($('#screeningAdditionalInfo')?.value||'').trim();
          const originalState=findOriginalCase(linkedCaseId);
          const original=originalState?.caseData;
          const linkedTracking=original?`${original.trackingYear||'รอจัดสรร'} / PIN ${original.trackingCode||'—'}`:'';
          const confirmed=await confirmDo('ยืนยันเรื่องซ้ำ — รวมกับเรื่องเดิม',`เรื่องนี้จะไม่มีการออกเลขใหม่ และจะรวมกับเรื่องเดิม ${caseDisplayId(original)||linkedCaseId}${linkedTracking?` (เลขติดตามเดิม ${linkedTracking})`:''}${additionalInfo?`\nข้อมูลเพิ่มเติมจะส่งเข้าเรื่องเดิม: ${additionalInfo}`:''}`,'ยืนยันเรื่องซ้ำ');
          if(!confirmed.isConfirmed)return;
          d.screening={decision:'duplicate',decidedAt:decidedIso,decidedBy:decider,linkedCaseId,linkedTracking,note:screeningNote,additionalInfo,reportedToSupervisor:d.screening?.reportedToSupervisor||null};
          w.owner=activeRole;w.stage='duplicate-closed';w.status=`เรื่องซ้ำ — รวมกับเรื่องเดิม ${caseDisplayId(original)||linkedCaseId}`;w.complete=true;
          add(`ตัดสินใจกลั่นกรอง: เรื่องซ้ำ — รวมกับเรื่องเดิม ${caseDisplayId(original)||linkedCaseId}${linkedTracking?` (เลขติดตามเดิม ${linkedTracking})`:''}${screeningNote?` — ${screeningNote}`:''}`);
          if(originalState){
            originalState.decisionHistory=originalState.decisionHistory||[];
            originalState.decisionHistory.push({text:`มีเรื่องซ้ำรวมเข้ามา: ${caseDisplayId(state.caseData)} (${state.caseData.received})${additionalInfo?` — ข้อมูลเพิ่มเติม: ${additionalInfo}`:''}`,time:now()});
            originalState.documentData.mergedDuplicates=[...(originalState.documentData.mergedDuplicates||[]),{caseId:state.caseData.id,at:now(),note:additionalInfo||''}];
            saveState(linkedCaseId,originalState);
          }
          saveState(selectedId,state);
          notify('success','บันทึกเรื่องซ้ำแล้ว',`เรื่องถูกรวมกับเรื่องเดิม ${caseDisplayId(original)||linkedCaseId} — ไม่มีการออกเลขใหม่ และเรื่องเดิมได้รับแจ้งแล้ว`);
          renderDetail();renderList();return;
        }
        const confirmed=await confirmDo('ยืนยันเรื่องใหม่','ระบบจะออกเลขติดตามใหม่ (กรณียังไม่เคยออก) และดำเนินการตามสายพานปกติ','ยืนยันเรื่องใหม่');
        if(!confirmed.isConfirmed)return;
        if(state.caseData.allocationStatus==='pending'||!state.caseData.trackingYear){
          const pair=window.ECMIS?.createTrackingNumber?.()||{yearSequence:'690001',pin:'5424',allocationStatus:'allocated'};
          state.caseData.trackingYear=pair.yearSequence;state.caseData.trackingCode=pair.pin;state.caseData.allocationStatus=pair.allocationStatus||'allocated';state.caseData.qr=qrForTracking(pair.yearSequence);
        }
        d.screening={decision:'new',decidedAt:decidedIso,decidedBy:decider,linkedCaseId:'',linkedTracking:'',note:String($('#screeningNote')?.value||'').trim(),additionalInfo:'',reportedToSupervisor:d.screening?.reportedToSupervisor||null};
        w.status='รอเจ้าหน้าที่พิจารณา';
        add(`ตัดสินใจกลั่นกรอง: เรื่องใหม่ — ดำเนินการปกติ${state.caseData.trackingYear?` (เลขติดตาม ${state.caseData.trackingYear}/PIN ${state.caseData.trackingCode})`:''}`);
        saveState(selectedId,state);
        notify('success','ยืนยันเรื่องใหม่แล้ว',state.caseData.trackingYear?`ออกเลขติดตาม ${state.caseData.trackingYear} / PIN ${state.caseData.trackingCode} แล้ว ดำเนินการตามสายพานปกติ`:'ดำเนินการตามสายพานปกติ');
        renderDetail();renderList();return;
      }
      if(action==='screening-undo'){
        const confirmed=await confirmDo('ยกเลิกการตัดสินใจกลั่นกรอง','จะกลับไปให้เจ้าหน้าที่ตัดสินใจกลั่นกรองใหม่ ประวัติเดิมจะถูกเก็บไว้','ยกเลิกการตัดสินใจ');
        if(!confirmed.isConfirmed)return;
        const previousDecision=d.screening?.decision;
        d.screening={decision:'',decidedAt:'',decidedBy:'',linkedCaseId:'',linkedTracking:'',note:'',additionalInfo:'',reportedToSupervisor:d.screening?.reportedToSupervisor||null};
        if(w.stage==='duplicate-closed'){w.owner='officer';w.stage='officer';w.status='รอเจ้าหน้าที่กลั่นกรองเรื่องซ้ำ';w.complete=false}
        add(`ยกเลิกการตัดสินใจกลั่นกรอง (เดิม: ${previousDecision==='duplicate'?'เรื่องซ้ำ':previousDecision==='new'?'เรื่องใหม่':'ยังไม่ตัดสินใจ'}) — กลับไปรอการกลั่นกรองใหม่`);
        saveState(selectedId,state);notify('success','ยกเลิกแล้ว','กลับไปรอการตัดสินใจกลั่นกรอง');renderDetail();renderList();return;
      }
      if(action==='print-duplicate-receipt'){
        const originalState=findOriginalCase(d.screening?.linkedCaseId);
        if(!originalState?.caseData){notify('warning','ไม่พบเรื่องเดิม','ไม่สามารถพิมพ์ใบแจ้งเลขเดิมได้');return}
        const stage=$('#paperStage');
        if(stage)stage.innerHTML=duplicateReceiptPaper(state.caseData,originalState.caseData,qrForTracking(originalState.caseData.trackingYear));
        await scheduleDocumentPagination(stage);window.print();return;
      }
      if(action==='screening-report'){
        const reportResult=window.Swal?await Swal.fire({title:'รายงานผู้บังคับบัญชา — ตรวจพบเรื่องซ้ำ',text:'ระบุรายละเอียดเรื่องซ้ำกับสำนวนที่อยู่ระหว่างดำเนินการ เพื่อให้ผู้บังคับบัญชาพิจารณารวมสำนวนหรือแยกดำเนินการ',input:'textarea',inputPlaceholder:'เช่น ตรวจพบว่าเรื่องนี้ซ้ำซ้อนกับสำนวนที่อยู่ระหว่างไต่สวน',showCancelButton:true,confirmButtonText:'ส่งรายงาน',cancelButtonText:'ยกเลิก',confirmButtonColor:'#082b50',inputValidator:v=>!String(v||'').trim()?'กรุณาระบุรายละเอียด':null}):{isConfirmed:confirm('รายงานผู้บังคับบัญชาเรื่องซ้ำ?'),value:prompt('รายละเอียดเรื่องซ้ำ')||''};
        if(!reportResult.isConfirmed)return;
        const reportNote=String(reportResult.value||'').trim();if(!reportNote)return;
        d.screening={...(d.screening||{}),reportedToSupervisor:{at:now(),by:ROLE_LABELS[activeRole]||activeRole,note:reportNote}};
        add(`รายงานผู้บังคับบัญชา (เรื่องซ้ำกับสำนวนระหว่างดำเนินการ): ${reportNote}`);
        saveState(selectedId,state);notify('success','ส่งรายงานแล้ว','ผู้บังคับบัญชาจะเห็นรายงานเมื่อเปิดเรื่องนี้');renderDetail();return;
      }
      if(action==='center-merge'){
        const confirmed=await confirmDo('รวมกับเรื่องเดิม','ผู้บังคับบัญชาตัดสินใจรวมเรื่องนี้กับสำนวนเดิมที่รายงาน','รวมกับเรื่องเดิม');
        if(!confirmed.isConfirmed)return;
        d.screening.reportedToSupervisor={...(d.screening.reportedToSupervisor||{}),resolved:'รวมกับเรื่องเดิม',resolvedAt:now(),resolvedBy:ROLE_LABELS[activeRole]||activeRole};
        add('ผู้อำนวยการศูนย์รับเรื่องร้องเรียน สั่งการ: รวมกับเรื่องเดิม (ตามรายงานเรื่องซ้ำ)');
        w.owner=activeRole;w.stage='duplicate-closed';w.status='เรื่องซ้ำ — รวมกับสำนวนเดิม (ตามคำสั่ง ผอ.ศรร.)';w.complete=true;
        saveState(selectedId,state);notify('success','บันทึกคำสั่งแล้ว','เรื่องถูกรวมกับสำนวนเดิมตามคำสั่งและปิดเรื่องนี้ — ไม่มีการออกเลขสำนวน/เลขขาออก');renderDetail();return;
      }
      if(action==='center-separate'){
        const confirmed=await confirmDo('แยกดำเนินการตามคำสั่ง','ผู้บังคับบัญชาตัดสินใจแยกดำเนินการตามคำสั่ง','แยกดำเนินการ');
        if(!confirmed.isConfirmed)return;
        d.screening.reportedToSupervisor={...(d.screening.reportedToSupervisor||{}),resolved:'แยกดำเนินการตามคำสั่ง',resolvedAt:now(),resolvedBy:ROLE_LABELS[activeRole]||activeRole};
        add('ผู้อำนวยการศูนย์รับเรื่องร้องเรียน สั่งการ: แยกดำเนินการตามคำสั่ง (ตามรายงานเรื่องซ้ำ)');
        saveState(selectedId,state);notify('success','บันทึกคำสั่งแล้ว','เรื่องจะแยกดำเนินการตามคำสั่ง');renderDetail();return;
      }
      if(action==='assign'){
        if(!d.assignedOfficer)return notify('warning','ยังไม่ได้เลือกผู้รับผิดชอบ','เลือกเจ้าหน้าที่รับผิดชอบหลักก่อนลงรับและมอบหมาย');
        const ok=await confirmDo('ยืนยันการลงรับและมอบหมาย',`ส่งงานให้ ${d.assignedOfficer}`,'ลงรับและมอบหมาย');
        if(!ok.isConfirmed)return;
        const previous=state.assignmentHistory.at(-1)?.text||'';
        state.assignmentHistory.push({text:`${previous?'เปลี่ยนผู้รับผิดชอบเป็น':'มอบหมายให้'} ${d.assignedOfficer} โดยธุรการ ศรร.`,time:now()});
        adminQueue='assigned';syncUrl();
        w.owner='officer';w.stage='officer';w.status='รอเจ้าหน้าที่กลั่นกรองเรื่องซ้ำ';add(`ธุรการ ศรร. ลงรับและมอบหมายให้ ${d.assignedOfficer}`);
      }
      if(action==='officer-send'){if(!['officer','admin'].includes(w.owner)&&!w.complete)return notify('warning','ข้อมูลถูกล็อค','เรื่องนี้อยู่ระหว่างการพิจารณาของผู้มีอำนาจ');
        if(d.screening?.decision!=='new')return notify('warning','ยังไม่ได้กลั่นกรองเรื่องซ้ำ','ต้องตัดสินใจกลั่นกรอง (เรื่องใหม่) ก่อนบันทึกและส่งพิจารณา');
        if(!d.officerSignature?.signed)return notify('warning','ยังไม่ได้ลงนาม','เจ้าหน้าที่รับเรื่องต้องตรวจสอบและลงนามก่อนส่งพิจารณา');
        if(!d.proposedRegion)return notify('warning','ยังไม่ได้เลือกเขตที่เสนอ','เลือกเขตที่เสนอให้มอบหมายก่อนส่งพิจารณา');
        if(!d.officerOpinion)return notify('warning','ยังไม่มีความเห็นเจ้าหน้าที่','กรอกข้อเท็จจริงและความเห็นก่อนส่งพิจารณา');
        if(d.decision==='send-nacc'&&d.naccOtherChecked&&!d.naccOtherReason)return notify('warning','ยังไม่ได้ระบุเหตุผลอื่น ๆ','กรอกเหตุผลอื่น ๆ สำหรับส่งสำนักงาน ป.ป.ช.');
        if(d.decision==='send-nacc'&&!d.reasons.length&&!(d.naccOtherChecked&&d.naccOtherReason))return notify('warning','ยังไม่ได้เลือกเหตุผล','เลือกเหตุผลส่งสำนักงาน ป.ป.ช. อย่างน้อย 1 ข้อ');
        if(d.decision==='not-accept'&&!d.notAcceptReason)return notify('warning','ยังไม่ได้ระบุเหตุผล','กรอกเหตุผลที่ไม่รับไว้ดำเนินการก่อนส่งพิจารณา');
        const route=$('input[name="route"]:checked')?.value;
        if(route==='division'&&!d.absenceReasonType)return notify('warning','ยังไม่ได้เลือกประเภทเหตุผล','เลือกประเภทเหตุผลที่ต้องส่งข้าม ผู้อำนวยการศูนย์รับเรื่องร้องเรียน');
        if(route==='division'&&!d.absenceNote)return notify('warning','รายละเอียดเหตุผลไม่ครบ','ระบุเหตุผล ช่วงเวลา และข้อมูลอ้างอิงก่อนส่งตรงถึง ผู้อำนวยการกองบริหารคดี');
        if(route==='division'&&!d.actingOfficer)return notify('warning','ยังไม่ได้เลือกผู้พิจารณาแทน','เลือก ผู้อำนวยการกองบริหารคดี หรือผู้รักษาราชการแทนตามคำสั่ง');
        const previewPages=officerPreviewPages(state);
        const reviewResult=window.Swal?await Swal.fire({title:'ตรวจสอบชุดเอกสารก่อนส่ง ผู้อำนวยการศูนย์รับเรื่องร้องเรียน',html:officerSendReviewHtml(),customClass:{popup:'ecmis-document-preview-dialog',htmlContainer:'ecmis-document-preview-content',confirmButton:'ecmis-preview-confirm',cancelButton:'ecmis-preview-cancel'},showCancelButton:true,confirmButtonText:'ยืนยันส่งต่อ ผู้อำนวยการศูนย์รับเรื่องร้องเรียน',cancelButtonText:'กลับไปแก้ไข',confirmButtonColor:'#082b50',cancelButtonColor:'#687789',allowOutsideClick:false,didOpen:()=>{
          let current=0;
          const viewport=$('#officerPreviewViewport'),title=$('#officerPreviewTitle'),counter=$('#officerPreviewCounter'),prev=$('#officerPreviewPrev'),next=$('#officerPreviewNext'),confirmButton=Swal.getConfirmButton();
          const renderPreview=()=>{
            const page=previewPages[current];
            viewport.innerHTML=page?.html||'<p>ไม่พบเอกสารสำหรับแสดงตัวอย่าง</p>';
            title.textContent=page?`${page.name}${page.total>1?` · หน้าที่ ${page.index} จาก ${page.total}`:''}`:'ไม่พบเอกสาร';
            counter.textContent=`หน้า ${current+1} จาก ${previewPages.length}`;
            prev.disabled=current===0;
            next.disabled=current>=previewPages.length-1;
            confirmButton.disabled=current<previewPages.length-1;
            confirmButton.setAttribute('aria-disabled',String(confirmButton.disabled));
            viewport.scrollTop=0;
          };
          prev.addEventListener('click',()=>{if(current>0){current-=1;renderPreview()}});
          next.addEventListener('click',()=>{if(current<previewPages.length-1){current+=1;renderPreview()}});
          renderPreview();
        } }):{isConfirmed:confirm('ตรวจสอบชุดเอกสารครบถ้วนแล้วหรือไม่\nคลิกตกลงเพื่อส่งต่อ ผู้อำนวยการศูนย์รับเรื่องร้องเรียน')};
        if(!reviewResult.isConfirmed)return;
        const useActing=route==='division'&&d.actingOfficer!=='ผู้อำนวยการกองบริหารคดี';
        w.owner=route==='division'?(useActing?'acting':'division'):'center';w.stage=w.owner;w.status=route==='division'?`รอ ${d.actingOfficer}`:'รอ ผู้อำนวยการศูนย์รับเรื่องร้องเรียน';
        add(route==='division'?`เจ้าหน้าที่รับเรื่องเสนอให้มอบหมาย ${d.proposedRegion} เนื่องจาก ${d.absenceReasonType}: ${d.absenceNote} ส่งให้ ${d.actingOfficer}`:`เจ้าหน้าที่รับเรื่องเสนอให้มอบหมาย ${d.proposedRegion} และส่ง ผู้อำนวยการศูนย์รับเรื่องร้องเรียน`);
      }
      if(action==='center-return'){
        if(!d.centerOpinion)return notify('warning','ต้องระบุเหตุผล','กรอกประเด็นที่ต้องแก้ไขก่อนส่งกลับ');
        w.owner='officer';w.stage='officer';w.status='ส่งกลับเจ้าหน้าที่แก้ไข';d.centerDecision='disagree';d.officerSignature={signed:false,signerName:'',signerRole:'เจ้าหน้าที่รับเรื่อง',signedAt:'',signatureId:''};add(`ผู้อำนวยการศูนย์รับเรื่องร้องเรียน ไม่เห็นชอบการมอบหมาย ${d.proposedRegion||'เขตที่เสนอ'} และส่งกลับเจ้าหน้าที่รับเรื่องแก้ไข`);
      }
      if(action==='center-send'){
        if(d.centerDecision==='disagree')return notify('warning','เลือกไม่เห็นชอบ','กดส่งกลับเจ้าหน้าที่แก้ไขเพื่อดำเนินการตามความเห็น');
        if(!d.centerOpinion)return notify('warning','ยังไม่มีความเห็น ผู้อำนวยการศูนย์รับเรื่องร้องเรียน','กรอกความเห็นก่อนส่ง ผู้อำนวยการกองบริหารคดี');
        if(!d.centerSignature?.signed)return notify('warning','ยังไม่ได้ลงนาม','ผู้อำนวยการศูนย์รับเรื่องร้องเรียน ต้องตรวจสอบและลงนามก่อนส่ง ผู้อำนวยการกองบริหารคดี');
        w.owner='division';w.stage='division';w.status='รอ ผู้อำนวยการกองบริหารคดี';add(`ผู้อำนวยการศูนย์รับเรื่องร้องเรียน เห็นชอบให้มอบหมาย ${d.proposedRegion||'เขตที่เสนอ'} และส่ง ผู้อำนวยการกองบริหารคดี`);
      }
      if(action==='division-center'){w.owner='center';w.stage='center';w.status='รอ ผู้อำนวยการศูนย์รับเรื่องร้องเรียน ให้ความเห็นเพิ่มเติม';add('ผู้อำนวยการกองบริหารคดี อนุมัติให้ ผู้อำนวยการศูนย์รับเรื่องร้องเรียน กลับเข้าขั้นตอนเพื่อให้ความเห็นเพิ่มเติม')}
      if(action==='division-return'){
        if(!d.divisionOpinion)return notify('warning','ต้องระบุเหตุผล','กรอกคำสั่งหรือประเด็นที่ต้องแก้ไข');
        w.owner='officer';w.stage='officer';w.status='ส่งกลับเจ้าหน้าที่แก้ไข';d.officerSignature={signed:false,signerName:'',signerRole:'เจ้าหน้าที่รับเรื่อง',signedAt:'',signatureId:''};add('ผู้อำนวยการกองบริหารคดี ส่งกลับเจ้าหน้าที่รับเรื่องแก้ไข');
      }
      
      
      if(action==='officer-refuse'){
        const dlg=await Swal.fire({title:'ปฏิเสธรับงาน',text:'ระบุเหตุผลที่เจ้าหน้าที่ปฏิเสธรับงานนี้',input:'textarea',inputPlaceholder:'เช่น ไม่ใช่เรื่องในความรับผิดชอบ / ข้อมูลไม่ครบถ้วน / ฯลฯ',showCancelButton:true,confirmButtonText:'ยืนยันปฏิเสธ',cancelButtonText:'ยกเลิก',inputValidator:v=>!String(v||'').trim()?'กรุณาระบุเหตุผล':null});
        if(!dlg.isConfirmed)return;
        const reason=String(dlg.value||'').trim();
        w.owner='admin';w.stage='admin-assign';w.status='เจ้าหน้าที่รับเรื่องปฏิเสธงาน — รอการมอบหมายใหม่';w.complete=false;
        state.decisionHistory.push({text:`เจ้าหน้าที่รับเรื่องปฏิเสธรับงาน — เหตุผล: ${reason}`,time:new Date().toLocaleString('th-TH',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})});
        saveState(selectedId,state);
        await notify('success','ส่งกลับแล้ว','เจ้าหน้าที่ปฏิเสธรับงาน — ระบบส่งกลับไปรอการมอบหมายใหม่');
        renderDetail();
      }

      if(action==='send-committee'){
        const chain=[
          ['ส่งเรื่องไปยัง ผู้ช่วย/รองเลขาธิการ ป.ป.ท.','ผู้ช่วย/รองเลขาธิการ ป.ป.ท. รับเรื่องและพิจารณาแล้ว เห็นชอบ'],
          ['ส่งเรื่องไปยัง เลขาธิการคณะกรรมการ ป.ป.ท.','เลขาธิการ คณะกรรมการ ป.ป.ท. รับเรื่องแล้ว'],
          ['คณะกรรมการ ป.ป.ท. กำลังพิจารณาเรื่อง','พิจารณาแล้วเสร็จ รอรับมติ']
        ];
        for(const [title,done] of chain){
          await Swal.fire({title,text:done,icon:'info',allowOutsideClick:false,showConfirmButton:false,willOpen:()=>Swal.showLoading()});
          await new Promise(resolve=>setTimeout(resolve,1400));
        }
        const outcomes=[
          'คณะกรรมการ ป.ป.ท. มีมติเห็นชอบให้ดำเนินการตามที่เสนอ',
          'คณะกรรมการ ป.ป.ท. มีมติเห็นชอบ พร้อมข้อสังเกตเพิ่มเติม',
          'คณะกรรมการ ป.ป.ท. มีมติให้ทบทวนและนำเสนอใหม่'
        ];
        const outcome=outcomes[Math.floor(Math.random()*outcomes.length)];
        state.workflow.committee={status:outcome,at:new Date().toLocaleString('th-TH',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})};
        state.decisionHistory.push({text:`ส่งเรื่องเสนอคณะกรรมการ ป.ป.ท. — ${outcome}`,time:new Date().toLocaleString('th-TH',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})});
        saveState(selectedId,state);
        await Swal.fire({title:'ได้รับมติกลับมาแล้ว',html:`<div style="text-align:left;font-size:14px;line-height:1.7"><strong>ผลมติ:</strong><br>${outcome}</div>`,icon:outcome.includes('ทบทวน')?'warning':'success',confirmButtonText:'รับทราบ'});
        renderDetail();
      }

      if(action==='approve'){
        if(!d.divisionOpinion)return notify('warning','ยังไม่มีคำสั่ง','กรอกความเห็นและคำสั่งก่อนอนุมัติ');
        if(!d.divisionSignature?.signed)return notify('warning','ยังไม่ได้ลงนาม','ผู้อำนวยการกองบริหารคดี หรือผู้รักษาราชการแทนต้องลงนามก่อนอนุมัติ');
        const approvalActor=d.divisionSignature.signerName;
        d.approvedAt=d.approvedAt||d.divisionSignature.signedAt;
        d.approvedBy=d.approvedBy||approvalActor;
        const caseNumberEligible=['18/1ก','18/1ข','18/4'].includes(d.decision);
        if(caseNumberEligible&&!d.caseNumber){
          const buddhistYear=new Date().getFullYear()+543;
          const nextNumber=formatCaseSequence(currentCaseSequence(buddhistYear)+1,buddhistYear);
          const confirmed=await confirmDo('ยืนยันอนุมัติและออกเลขสำนวน',`ระบบจะออกเลขสำนวน ${nextNumber} และแจ้งสถานะรับไว้ดำเนินการแก่ผู้ร้อง`,'อนุมัติและออกเลข');
          if(!confirmed.isConfirmed)return;
          d.approvedAt=d.divisionSignature.signedAt;d.approvedBy=approvalActor;issueCaseNumber(state);issueOutgoingNumbers(state);
          d.publicStatus='สำนักงานได้รับเรื่องของท่านไว้แล้ว และจะดำเนินการเรื่องของท่านต่อไป';
        }
        const anonymousRejected=d.decision==='not-accept'&&d.anonymous;
        if(anonymousRejected){
          w.owner='anonymous';w.stage='anonymous-box';w.status='รอหัวหน้าพนักงานผู้ตรวจเสนอ';w.complete=false;
          add(`${approvalActor} อนุมัติไม่รับไว้ดำเนินการและส่งเข้ากล่องบัตรสนเท่ห์`);
        }else if(caseNumberEligible){
          d.dispatchDestinationUnit=d.proposedRegion||state.caseData.region||'';
          w.owner='officer';w.stage='officer-dispatch';w.status='อนุมัติแล้ว รอเจ้าหน้าที่รับเรื่อง ศรร. บันทึกข้อมูลการจัดส่ง';w.complete=false;
          add(`${approvalActor} ลงนามอนุมัติ${d.caseNumber?`และออกเลขสำนวน ${d.caseNumber}`:''} แล้ว ส่งงานกลับเจ้าหน้าที่รับเรื่อง ศรร. เพื่อบันทึกข้อมูลจัดส่งไปยัง ${d.proposedRegion||state.caseData.region||'เขตผู้รับผิดชอบ'}`);
        }else{
          w.stage='division-order';w.complete=true;w.status='ดำเนินการเสร็จสิ้น';add(`${approvalActor} อนุมัติผลการพิจารณา${d.caseNumber?` และออกเลขสำนวน ${d.caseNumber}`:''}`);
        }
      }
      state.documentVersions.push({version:state.documentVersions.length+1,actor:ROLE_LABELS[activeRole],time:now()});saveState(selectedId,state);
      if(w.stage==='officer-dispatch'){
        notify('success','อนุมัติและลงนามเรียบร้อยแล้ว','ระบบส่งงานกลับเจ้าหน้าที่รับเรื่อง ศรร. เพื่อบันทึกเลขหนังสือขาออก วันที่หนังสือ วิธีจัดส่ง เลข EMS และหน่วยงานหรือเขตปลายทาง');
        selectedRole='officer';activeRole='officer';sessionStorage.setItem('ecmis-a4-role',selectedRole);$('#wsRole').value=selectedRole;updateRoleControls();renderDetail();renderList();return;
      }
      notify('success','บันทึกผลการพิจารณาเรียบร้อยแล้ว',`สถานะปัจจุบัน: ${w.status}`);renderDetail();renderList();
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
      const activity5DispatchButton=event.target.closest('[data-action="activity5-dispatch-draft"],[data-action="activity5-dispatch-confirm"]');
      if(activity5DispatchButton){
        event.preventDefault();event.stopImmediatePropagation();
        const action=activity5DispatchButton.dataset.action;
        const state=captureActivity5Dispatch(getState(selectedId)),d=state.documentData;
        if(action==='activity5-dispatch-draft'){
          state.documentVersions.push({version:state.documentVersions.length+1,actor:'เจ้าหน้าที่รับเรื่อง ศรร.',time:now()});saveState(selectedId,state);
          notify('success','บันทึกร่างข้อมูลจัดส่งแล้ว','ข้อมูลยังไม่ได้รับการยืนยันจัดส่งไปยังเขตผู้รับผิดชอบ');return;
        }
        if(!d.dispatchLetterNo||!d.dispatchLetterDate||!d.dispatchSentDate||!d.dispatchDestinationUnit){notify('warning','ข้อมูลการจัดส่งยังไม่ครบ','กรอกเลขหนังสือ วันที่หนังสือ วันที่จัดส่ง และหน่วยงานหรือเขตปลายทางให้ครบ');return}
        if(d.dispatchSendMethod==='EMS'&&!d.dispatchEms){notify('warning','ยังไม่มีเลข EMS','กรอกเลข EMS ก่อนยืนยันการจัดส่ง');return}
        const confirmation=await confirmDo('ยืนยันการจัดส่งไปยังเขตผู้รับผิดชอบ',`ยืนยันว่าได้จัดส่งเรื่องไปยัง ${d.dispatchDestinationUnit} ตามข้อมูลที่บันทึกไว้`,'ยืนยันจัดส่ง');
        if(!confirmation.isConfirmed)return;
        const time=now(),dispatchedAt=new Date().toISOString();
        d.dispatchConfirmedAt=dispatchedAt;state.workflow.stage='activity5-dispatch';state.workflow.status=`จัดส่งเรื่องไปยัง ${d.dispatchDestinationUnit} แล้ว`;state.workflow.complete=true;state.workflow.owner='officer';
        state.decisionHistory.push({text:`เจ้าหน้าที่รับเรื่อง ศรร. ยืนยันจัดส่งไปยัง ${d.dispatchDestinationUnit} เลขหนังสือ ${d.dispatchLetterNo} · ${d.dispatchSendMethod}${d.dispatchEms?` ${d.dispatchEms}`:''}`,time});
        state.documentVersions.push({version:state.documentVersions.length+1,actor:'เจ้าหน้าที่รับเรื่อง ศรร.',time});
        const handoffResult=window.ECMISActivity5Handoff?.create(localStorage,state,dispatchedAt,'officer')||null;
        if(!handoffResult?.eligible){state.workflow.stage='officer-dispatch';state.workflow.status='อนุมัติแล้ว รอเจ้าหน้าที่รับเรื่อง ศรร. บันทึกข้อมูลการจัดส่ง';state.workflow.complete=false;d.dispatchConfirmedAt='';notify('error','บันทึกการจัดส่งไม่สำเร็จ','ตรวจสอบข้อมูลการจัดส่งและลองยืนยันอีกครั้ง');return}
        saveState(selectedId,state);
        notify('success','ยืนยันการจัดส่งเรียบร้อยแล้ว',`จัดส่งเรื่องไปยัง ${d.dispatchDestinationUnit} แล้ว และส่งข้อมูลเข้าสู่กระบวนงานลำดับถัดไปเรียบร้อยแล้ว`);renderDetail();renderList();return;
      }
      const approveNaccButton=event.target.closest('[data-action="approve"]');
      if(approveNaccButton&&getState(selectedId).documentData.decision==='send-nacc'){
        event.preventDefault();
        event.stopImmediatePropagation();
        const state=capture(getState(selectedId)),d=state.documentData;
        if(!d.divisionOpinion){notify('warning','ยังไม่มีคำสั่ง','กรอกความเห็นและคำสั่งก่อนอนุมัติส่ง ป.ป.ช.');return}
        const confirmation=await confirmDo('อนุมัติส่งสำนักงาน ป.ป.ช.','ส่งงานกลับเจ้าหน้าที่รับเรื่องเพื่อออกหนังสือและบันทึกหลักฐานการจัดส่ง','อนุมัติและส่งจัดทำหนังสือ');
        if(!confirmation.isConfirmed)return;
        const time=now();
        state.workflow.owner='officer';
        state.workflow.stage='nacc-dispatch';
        state.workflow.status='รอจัดส่งสำนักงาน ป.ป.ช.';
        state.workflow.complete=false;
        const approvalActor=activeRole==='acting'?(d.actingOfficer||ROLE_LABELS[activeRole]):ROLE_LABELS[activeRole];
        state.decisionHistory.push({text:`${approvalActor} อนุมัติให้ส่งสำนักงาน ป.ป.ช. และส่งงานกลับเจ้าหน้าที่รับเรื่องเพื่อจัดส่ง`,time});
        state.documentVersions.push({version:state.documentVersions.length+1,actor:ROLE_LABELS[activeRole],time});
        saveState(selectedId,state);
        notify('success','อนุมัติส่ง ป.ป.ช. แล้ว','เรื่องอยู่ในขั้นตอนรอเจ้าหน้าที่บันทึกเลขหนังสือและหลักฐานการจัดส่ง');
        selectedRole='officer';
        activeRole='officer';
        sessionStorage.setItem('ecmis-a4-role',selectedRole);
        $('#wsRole').value=selectedRole;
        updateRoleControls();
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
        if(previousOfficer&&previousOfficer!==d.assignedOfficer){
          d.officerSignature={signed:false,signerName:'',signerRole:'เจ้าหน้าที่รับเรื่อง',signedAt:'',signatureId:''};
        }
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
        adminQueue='assigned';syncUrl();
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
      const button=event.target.closest('[data-action="recall-assignment"]');
      if(!button)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const state=getState(selectedId);
      const previousOfficer=state.documentData.assignedOfficer;
      const previousBackupOfficer=state.documentData.backupOfficer||'';
      if(state.workflow.complete||['nacc-dispatch','anonymous-box'].includes(state.workflow.stage)||!previousOfficer){notify('warning','ไม่สามารถดึงงานกลับได้','เรื่องไม่ได้อยู่ในขั้นตอนที่ธุรการสามารถดึงกลับเพื่อมอบหมายใหม่');return}
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
    window.addEventListener('storage',event=>{
      if(event.key!==STORAGE_KEY)return;
      renderList();
      if(selectedId)renderDetail();
    });
    syncUrl();renderList();if(selectedId&&canRegionalAccess(getState(selectedId).caseData))renderDetail();else{selectedId=null;syncUrl()}
  }
  document.addEventListener('DOMContentLoaded',()=>{if($('#walkinApp'))renderWalkin();if($('#staffApp'))renderStaff();initFontSizeControls()});
})();
