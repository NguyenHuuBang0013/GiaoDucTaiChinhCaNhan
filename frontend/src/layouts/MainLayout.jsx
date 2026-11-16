import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {ArrowRight, ChevronDown, LogOut, Menu, X} from 'lucide-react';
import {nav} from '../config/modules';
import {logout} from '../services/api';

const paths={overview:'/dashboard',start:'/start',learning:'/learning',practice:'/practice','budget-coach':'/budget-coach',transactions:'/transactions',categories:'/categories',budgets:'/budgets',goals:'/goals',recurring:'/recurring',scenarios:'/scenarios',reports:'/reports',insights:'/insights',profile:'/profile'};
const primary=['overview','learning','budgets','transactions','budget-coach','reports'];
const groups=[
 {label:'Học và thực hành',routes:['start','learning','practice','budget-coach']},
 {label:'Quản lý dòng tiền',routes:['transactions','categories','budgets','recurring','goals']},
 {label:'Phân tích và tài khoản',routes:['scenarios','reports','insights','profile']}
];
const descriptions={
 overview:'Dòng tiền, ngân sách và việc nên làm tiếp theo.',start:'Xác định mục tiêu và mức hiểu biết của bạn.',learning:'Các bài học ngắn gắn với quyết định chi tiêu.',practice:'Thử lựa chọn tài chính trong những tình huống thực tế.',
 'budget-coach':'Đối chiếu kế hoạch, thực tế và điều chỉnh.',transactions:'Ghi lại tiền vào và tiền ra theo thời gian.',categories:'Sắp xếp các khoản tiền theo mục đích.',budgets:'Thiết lập kỳ ngân sách và hạn mức phù hợp.',
 goals:'Theo dõi những điều bạn đang tiết kiệm vì chúng.',recurring:'Quản lý khoản thu chi lặp lại.',scenarios:'Thử các giả định trước khi quyết định.',reports:'Xem diễn biến và kết quả thực hiện kế hoạch.',insights:'Các điều cần chú ý từ dữ liệu tài chính.',profile:'Thông tin và thiết lập tài khoản.'
};
function NavLink({id,page,onNavigate,compact=false,onDone}){
 const item=nav.find(n=>n[0]===id);if(!item)return null;
 const [,label,Icon]=item;
 const select=e=>{if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();onNavigate(id);onDone?.();};
 return <a className={'workspace-link '+(page===id?'is-current':'')+(compact?' is-compact':'')} href={paths[id]} onClick={select} aria-current={page===id?'page':undefined}>
   {compact&&<Icon size={17} aria-hidden="true"/>}<span>{label}</span>
 </a>;
}
export default function MainLayout({me,page,onNavigate,message,onDismiss,mode,onModeChange,sampleLoading,sampleError,children}){
 const [desktopOpen,setDesktopOpen]=useState(false);
 const [mobileOpen,setMobileOpen]=useState(false);
 const [logoutError,setLogoutError]=useState('');
 const [loggingOut,setLoggingOut]=useState(false);
 const handleLogout=async()=>{if(loggingOut)return;setLoggingOut(true);setLogoutError('');try{await logout();}catch(e){setLogoutError(e.message||'Không thể đăng xuất, vui lòng thử lại.');setLoggingOut(false);}};
 const moreRef=useRef(null);
 const desktopTrigger=useRef(null);
 const mobileTrigger=useRef(null);
 const current=nav.find(n=>n[0]===page);
 const inMore=!primary.includes(page);
 const section=groups.find(g=>g.routes.includes(page))?.label||'Tổng quan';
 useEffect(()=>{setDesktopOpen(false);setMobileOpen(false)},[page]);
 useEffect(()=>{
  const onKey=e=>{if(e.key==='Escape'){if(desktopOpen)desktopTrigger.current?.focus();if(mobileOpen)mobileTrigger.current?.focus();setDesktopOpen(false);setMobileOpen(false)}};
  const onPointer=e=>{if(moreRef.current&&!moreRef.current.contains(e.target))setDesktopOpen(false)};
  window.addEventListener('keydown',onKey);document.addEventListener('pointerdown',onPointer);
  return()=>{window.removeEventListener('keydown',onKey);document.removeEventListener('pointerdown',onPointer)};
 },[desktopOpen,mobileOpen]);
 return <div className="workspace-shell">
  <a className="skip-link" href="#main-content">Chuyển đến nội dung chính</a>
  <header className="workspace-header">
   <div className="workspace-header-inner">
    <a className="workspace-brand" href="/dashboard" onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate('overview')}}} aria-label="FinanceLab, về trang Tổng quan">
     <span className="brand-symbol" aria-hidden="true">f<span>.</span></span>
     <span className="brand-wordmark">finance<span>lab</span><small>Học và làm chủ ngân sách</small></span>
    </a>
    <nav className="workspace-primary" aria-label="Các chức năng chính">
     {primary.map(id=><NavLink key={id} id={id} page={page} onNavigate={onNavigate}/>)}
    </nav>
    <div className="workspace-tools">
     <div className={"workspace-mode-select "+(mode==='sample'?'is-sample':'is-real')}><select aria-label="Chế độ dữ liệu" title="Chọn dữ liệu thật hoặc dữ liệu mẫu" value={mode} onChange={e=>onModeChange(e.target.value)}><option value="real">Dữ liệu thật</option><option value="sample">Dữ liệu mẫu</option></select></div>
     <div className="workspace-more" ref={moreRef}>
      <button ref={desktopTrigger} type="button" className={'workspace-more-trigger '+(desktopOpen?'is-open ':'')+(inMore?'has-current':'')} aria-expanded={desktopOpen} aria-haspopup="true" aria-controls="workspace-all-nav" onClick={()=>setDesktopOpen(v=>!v)}><span>{inMore?current?.[1]:'Thêm chức năng'}</span><ChevronDown size={14} aria-hidden="true"/></button>
      {desktopOpen&&<div className="workspace-menu" id="workspace-all-nav">
        {groups.map(group=><div className="workspace-menu-group" key={group.label}><span className="workspace-menu-label">{group.label}</span><div className="workspace-menu-list">{group.routes.map(id=><NavLink key={id} id={id} page={page} onNavigate={onNavigate} compact onDone={()=>setDesktopOpen(false)}/>)}</div></div>)}
      </div>}
     </div>
     <button type="button" className={'workspace-profile '+(page==='profile'?'is-current':'')} onClick={()=>onNavigate('profile')} aria-label="Mở hồ sơ cá nhân" title="Hồ sơ cá nhân"><span className="workspace-avatar">{me.display_name?.trim()?.[0]?.toUpperCase()||'F'}</span><span className="workspace-profile-name">{me.display_name?.split(' ').slice(-2).join(' ')||'Tài khoản'}</span></button>
    </div>
    <button ref={mobileTrigger} className="workspace-mobile-toggle" type="button" aria-expanded={mobileOpen} aria-controls="workspace-mobile-nav" onClick={()=>setMobileOpen(v=>!v)} aria-label={mobileOpen?'Đóng menu':'Mở menu'}>{mobileOpen?<X size={22}/>:<Menu size={22}/>}</button>
   </div>
  </header>
  {mobileOpen&&<nav id="workspace-mobile-nav" className="workspace-mobile-nav" aria-label="Điều hướng trên di động">{groups.map(group=><div key={group.label}><p>{group.label}</p>{group.routes.map(id=><NavLink key={id} id={id} page={page} onNavigate={onNavigate} compact onDone={()=>setMobileOpen(false)}/>)}</div>)}<button type="button" className="workspace-mobile-logout" onClick={handleLogout} disabled={loggingOut}><LogOut size={17}/> {loggingOut?'Đang đăng xuất…':'Đăng xuất'}</button></nav>}
  <main id="main-content" className="workspace-main">
   {mode==='sample'&&<div className="workspace-sample-banner" role="status"><span><strong>Đang xem dữ liệu mẫu</strong> · Các màn hình tài chính chỉ hiển thị thông tin thực hành, không cho chỉnh sửa bản ghi mẫu. Nếu trống, vào Hồ sơ để tạo bộ dữ liệu mẫu.</span>{sampleLoading&&<span>Đang tải…</span>}{sampleError&&<span role="alert">{sampleError}</span>}<button type="button" onClick={()=>onModeChange('real')}>Về dữ liệu thật</button></div>}
   {page!=='overview'&&<div className="workspace-page-heading"><div><div className="page-trail">{section} <span aria-hidden="true">/</span> {current?.[1]||'Tổng quan'}</div><h1 tabIndex={-1}>{current?.[1]||'Tổng quan'}</h1><p>{descriptions[page]||''}</p></div><button type="button" className="workspace-return" onClick={()=>onNavigate('overview')}><ArrowRight size={15} aria-hidden="true"/> Về tổng quan</button></div>}
   {children}
  </main>
  <footer className="workspace-footer"><span>© FinanceLab · Học qua thực hành</span><span>Thông tin có tính giáo dục, không thay thế tư vấn tài chính.</span><button type="button" onClick={handleLogout} disabled={loggingOut}>{loggingOut?'Đang đăng xuất…':'Đăng xuất'} <LogOut size={14} aria-hidden="true"/></button></footer>
  {logoutError&&createPortal(<div className="app-notice" role="alert"><div><span>{logoutError}</span></div><button type="button" onClick={()=>setLogoutError('')} aria-label="Đóng thông báo lỗi"><X size={17}/></button></div>,document.body)}
  {message&&createPortal(<div className="app-notice" role="status" aria-live="polite"><div><span className="notice-marker" aria-hidden="true"/><span>{message}</span></div><button type="button" onClick={onDismiss} aria-label="Đóng thông báo"><X size={17}/></button></div>,document.body)}
 </div>;
}
