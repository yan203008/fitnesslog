export const STORAGE_KEY = 'yuxia-movement-v1';
export const fields = {teacher:['老师','text',''],startTime:['开始时间','time',''],duration:['时长','number','分钟'],lessons:['课时','number','课时'],steps:['步数','number','步'],kcal:['消耗','number','kcal'],notes:['备注','textarea','']};
export const uid = () => crypto.randomUUID();
export function today(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return !isNaN(d)&&today(d)===s;}
export function createState(){return {schema:'movement',version:1,homeCount:4,homeIds:['strength','dance','walk','other'],types:[{id:'strength',name:'力量训练',kind:'strength',fields:['duration','notes']},{id:'dance',name:'街舞',kind:'dance',fields:['teacher','startTime','lessons','kcal']},{id:'walk',name:'散步',kind:'normal',fields:['duration','steps']},{id:'other',name:'其他',kind:'other',fields:['startTime','duration','notes']}],exercises:[],records:[]};}
export function validateState(s){
 const fail=()=>{throw new Error('备份格式不正确，请选择运动记录 V1 的 JSON 备份。');};
 if(!s||s.schema!=='movement'||s.version!==1||![4,5,6].includes(s.homeCount)||!Array.isArray(s.types)||!Array.isArray(s.exercises)||!Array.isArray(s.records)||!Array.isArray(s.homeIds))fail();
 const names=x=>typeof x==='string'&&x.trim().length>0&&x.length<=100;
 const unique=arr=>arr.every(x=>x&&names(x.id)&&/^[A-Za-z0-9_-]+$/.test(x.id))&&new Set(arr.map(x=>x.id)).size===arr.length;
 if(!unique(s.types)||!unique(s.exercises)||!unique(s.records)||s.types.length<4)fail();
 if(!s.types.every(t=>names(t.name)&&['strength','dance','normal','other'].includes(t.kind)&&Array.isArray(t.fields)&&t.fields.every(f=>Object.hasOwn(fields,f))))fail();
 for(const t of createState().types)if(!s.types.some(x=>x.id===t.id&&x.kind===t.kind))fail();
 if(s.homeIds.length!==s.homeCount||new Set(s.homeIds).size!==s.homeCount||!s.homeIds.every(id=>s.types.some(t=>t.id===id)))fail();
 if(!s.exercises.every(e=>names(e.name)))fail();
 const numeric=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 for(const r of s.records){
  if(!validDate(r.date)||!names(r.name)||!s.types.some(t=>t.id===r.typeId)||!r.values||typeof r.values!=='object'||Array.isArray(r.values)||!Array.isArray(r.exercises))fail();
  for(const [k,v] of Object.entries(r.values)){if(!Object.hasOwn(fields,k))fail();if(k==='notes'){if(typeof v!=='string'||v.length>5000)fail();}else if(k==='teacher'){if(typeof v!=='string'||v.length>100)fail();}else if(k==='startTime'){if(typeof v!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))fail();}else if(!numeric(v)||(k==='steps'&&!Number.isInteger(v)))fail();}
  for(const e of r.exercises){if(!names(e.exerciseId)||!/^[A-Za-z0-9_-]+$/.test(e.exerciseId)||!names(e.name)||!Array.isArray(e.sets)||e.sets.length>1000)fail();for(const k of ['weight','setCount','reps'])if(e[k]!==null&&e[k]!==undefined&&(!numeric(e[k])||(k!=='weight'&&!Number.isInteger(e[k]))))fail();for(const set of e.sets){if(!set||typeof set!=='object')fail();for(const k of ['weight','reps'])if(set[k]!==null&&set[k]!==undefined&&(!numeric(set[k])||(k==='reps'&&!Number.isInteger(set[k]))))fail();}}
 }
 return structuredClone(s);
}
export function makeRecord(type,date,values={},exercises=[],name=''){if(!validDate(date))throw new Error('请选择有效日期');return {id:uid(),typeId:type.id,name:name.trim()||type.name,date,values,exercises,createdAt:new Date().toISOString()};}
export function monthRecords(state,month){return state.records.filter(r=>r.date.startsWith(month+'-')).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||'').localeCompare(a.createdAt||''));}
export function monthCounts(state,month){const rs=monthRecords(state,month);return state.types.map(t=>({id:t.id,name:t.name,count:rs.filter(r=>r.typeId===t.id).length})).filter(t=>t.count);}
export function recordLabel(state,r){const t=state.types.find(t=>t.id===r.typeId);return [r.name,...(t?.kind==='dance'?[r.values.teacher?.trim(),r.values.lessons!==undefined?`${r.values.lessons}课时`:'']:[])].filter(Boolean).join(' · ');}
export function recordFields(type){return type.kind==='dance'?['teacher',...type.fields.filter(k=>k!=='teacher')]:type.fields;}
export function applyDanceUpdates(state,payload){
 if(!payload||payload.schema!=='movement-dance-updates'||payload.version!==1||!Array.isArray(payload.updates)||!payload.updates.length||payload.updates.length>1000)throw new Error('街舞补充文件格式不正确');
 const next=validateState(state),matched=[],unmatched=[],seen=new Set();
 for(const u of payload.updates){
  if(!u||!validDate(u.date)||typeof u.teacher!=='string'||!u.teacher.trim()||u.teacher.length>100||typeof u.lessons!=='number'||!Number.isFinite(u.lessons)||u.lessons<0||seen.has(u.date))throw new Error('街舞补充文件中有无效或重复的日期、老师或课时');
  seen.add(u.date);
  const candidates=next.records.filter(r=>r.date===u.date&&next.types.find(t=>t.id===r.typeId)?.kind==='dance');
  const record=candidates.find(r=>r.id===u.recordId)||(candidates.length===1?candidates[0]:null);
  if(!record){unmatched.push(u.date);continue;}
  record.values={...record.values,teacher:u.teacher.trim(),lessons:u.lessons};matched.push({date:u.date,teacher:u.teacher.trim(),lessons:u.lessons});
 }
 return {state:validateState(next),matched,unmatched};
}

export function exerciseHistory(state,id){return [...state.records].sort((a,b)=>b.date.localeCompare(a.date)).flatMap(r=>r.exercises.filter(e=>e.exerciseId===id).map(e=>({record:r,exercise:e})));}
export function exerciseSummary(e){return [e.weight!=null?`${e.weight}kg`:'',e.setCount!=null&&e.reps!=null?`${e.setCount}组 × ${e.reps}次`:e.setCount!=null?`${e.setCount}组`:e.reps!=null?`${e.reps}次`:''].filter(Boolean).join(' · ')||'未填写训练数据';}
export function buildExercise(id,name,weight,setCount,reps){const number=v=>v===''||v==null?null:Number(v);const e={exerciseId:id,name,weight:number(weight),setCount:number(setCount),reps:number(reps)};if([e.weight,e.setCount,e.reps].some(v=>v!==null&&(!Number.isFinite(v)||v<0))||[e.setCount,e.reps].some(v=>v!==null&&!Number.isInteger(v))||e.setCount>1000)throw new Error('请填写有效的重量、组数和次数（组数最多 1000）');return {...e,sets:Array.from({length:e.setCount||0},()=>({weight:e.weight,reps:e.reps}))};}
export function deleteType(s,id){if(['strength','dance','walk','other'].includes(id))throw new Error('默认运动可以改名和隐藏，不能删除');if(s.homeIds.includes(id))throw new Error('请先在首页设置中将此运动替换为其他运动');s.records.forEach(r=>{if(r.typeId===id)r.typeId='other';});s.types=s.types.filter(t=>t.id!==id);}
