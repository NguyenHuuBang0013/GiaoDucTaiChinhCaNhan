import React,{useState} from 'react';
import EntityPage from './EntityPage';
import Button from '../components/Button';
import {api} from '../services/api';
import {money} from '../utils/format';
import {sampleScenarioComparison} from '../utils/sampleFinance';
export default function ScenariosPage({data,act,onDetail,readOnly=false,samplePreview}){
 const [selected,setSelected]=useState([]),[results,setResults]=useState(null);
 const toggle=id=>setSelected(a=>a.includes(id)?a.filter(x=>x!==id):[...a,id]);
 return <><EntityPage module="scenarios" data={data} act={act} onDetail={onDetail} readOnly={readOnly}/><section><h2>So sánh các kịch bản tiết kiệm</h2><p>{readOnly?'Chọn một hoặc nhiều kịch bản mẫu để xem mức tích lũy dự kiến.':'Chọn ít nhất hai kịch bản để so sánh kết quả tích lũy.'}</p><div className="scenario-choice">{(data.scenarios||[]).map(s=><label key={s.scenario_id}><input type="checkbox" checked={selected.includes(s.scenario_id)} onChange={()=>toggle(s.scenario_id)}/> {s.name}</label>)}</div><Button disabled={selected.length<(readOnly?1:2)} onClick={()=>{if(readOnly){setResults(sampleScenarioComparison(samplePreview,selected));return;}act(async()=>{setResults(await api('/api/scenarios/compare','POST',selected));});}}>{readOnly?'Tính thử':'So sánh'} ({selected.length})</Button>{results&&<div className="table-wrap"><table><thead><tr><th>Kịch bản</th><th>Tiết kiệm mỗi kỳ</th><th>Tích lũy dự kiến</th></tr></thead><tbody>{results.map(x=><tr key={x.scenario.scenario_id}><td>{x.scenario.name}</td><td>{money(x.saving_per_period)}</td><td>{money(x.estimated_saving)}</td></tr>)}</tbody></table></div>}</section></>;
}
