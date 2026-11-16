import React,{useEffect,useState} from 'react';
import {AlertTriangle,ShieldCheck,UserRound} from 'lucide-react';
import Button from '../components/Button';
import SampleDataPanel from '../components/SampleDataPanel';
import {api} from '../services/api';
export default function ProfilePage({me,act,onSamplesChanged}){
 const [name,setName]=useState(me.display_name||'');
 useEffect(()=>setName(me.display_name||''),[me.display_name]);
 const destroy=async(path,question)=>{if(window.confirm(question))await act(()=>api(path,'DELETE'))};
 const save=async e=>{e.preventDefault();if(!name.trim())return;await act(()=>api('/api/profile','PUT',{display_name:name.trim()}))};
 return <div className="profile-workspace">
  <section className="profile-identity"><span className="profile-large-avatar" aria-hidden="true">{me.display_name?.trim()?.[0]?.toUpperCase()||'F'}</span><div><span className="section-overline">TÀI KHOẢN CỦA BẠN</span><h2>{me.display_name||'Người dùng FinanceLab'}</h2><p>{me.email}</p><div className="profile-auth"><ShieldCheck size={15}/> Đăng nhập bằng Google</div></div></section>
  <section className="profile-section"><div className="profile-section-info"><h2>Thông tin cá nhân</h2><p>Thông tin hiển thị trong FinanceLab; email Google không được chỉnh sửa tại đây.</p></div><form className="profile-edit" onSubmit={save}><label>Email Google<input type="email" value={me.email||''} readOnly aria-readonly="true"/></label><label>Tên hiển thị<input value={name} maxLength={120} required onChange={e=>setName(e.target.value)}/></label><div><Button type="submit" disabled={!name.trim()||name.trim()===(me.display_name||'').trim()}>Lưu thay đổi</Button></div></form></section>
  <SampleDataPanel onSamplesChanged={onSamplesChanged}/>
  <section className="profile-section profile-danger"><div className="profile-section-info"><h2>Quản lý dữ liệu tài chính</h2><p><AlertTriangle size={16}/> Xóa dữ liệu nghiệp vụ là thao tác không thể hoàn tác. Tài khoản Google vẫn được giữ.</p></div><div className="profile-section-actions"><Button kind="danger" onClick={async()=>{if(window.confirm('Xóa toàn bộ dữ liệu tài chính?')&&window.confirm('Xác nhận lần cuối: dữ liệu sẽ không thể khôi phục.'))await act(()=>api('/api/data/personal','DELETE'))}}>Xóa dữ liệu tài chính của tôi</Button></div></section>
 </div>;
}
