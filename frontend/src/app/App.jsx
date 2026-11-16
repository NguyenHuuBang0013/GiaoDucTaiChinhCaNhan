import React,{useCallback,useEffect,useState} from 'react';
import {useFinance} from '../hooks/useFinance';
import {useSampleMode} from '../hooks/useSampleMode';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import EntityPage from '../pages/EntityPage';
import DetailsPage from '../pages/DetailsPage';
import ReportsPage from '../pages/ReportsPage';
import ProfilePage from '../pages/ProfilePage';
import ScenariosPage from '../pages/ScenariosPage';
import LearningPage from '../pages/LearningPage';
import BudgetCoachPage from '../pages/BudgetCoachPage';
import OnboardingPage from '../pages/OnboardingPage';
import PracticePage from '../pages/PracticePage';
import InsightsPage from '../pages/InsightsPage';
import RecurringPage from '../pages/RecurringPage';
import {configs} from '../config/modules';
import {PageMotion,LoadingSkeleton} from '../components/motion/Motion';
// Frontend routes are separate from backend /api/* endpoints.
// / stays the public landing page. Logged-in users land at /dashboard.
const ROUTES={overview:'/dashboard',transactions:'/transactions',categories:'/categories',budgets:'/budgets',goals:'/goals',scenarios:'/scenarios',reports:'/reports',learning:'/learning','budget-coach':'/budget-coach',start:'/start',practice:'/practice',insights:'/insights',recurring:'/recurring',profile:'/profile'};
const PATH_TO_PAGE=Object.fromEntries(Object.entries(ROUTES).map(([key,path])=>[path,key]));
const pageFromPath=()=>PATH_TO_PAGE[window.location.pathname.replace(/\/$/,'')||'/']||'overview';
export default function App(){
 const {me,data,message,setMessage,act,refresh,connectionError}=useFinance();
 const samples=useSampleMode(me?.user_id);
 const sampleMode=samples.mode==='sample';
 const financialData=sampleMode?samples.data:data;
 const [page,setPage]=useState(pageFromPath),[detail,setDetail]=useState(null),[focusLesson,setFocusLesson]=useState(new URLSearchParams(window.location.search).get('lesson')||'');
 const navigate=useCallback((p,options={})=>{
  if(!Object.hasOwn(ROUTES,p))return;
  window.history.pushState(null,'',ROUTES[p]+(options.lesson?'?lesson='+encodeURIComponent(options.lesson):''));
  setFocusLesson(options.lesson||'');
  setPage(p);
  setDetail(null);
  setMessage('');
  window.scrollTo(0,0);
 },[setMessage]);
 useEffect(()=>{
  const handlePopState=()=>{setPage(pageFromPath());setDetail(null);setFocusLesson(new URLSearchParams(window.location.search).get('lesson')||'');setMessage('');};
  window.addEventListener('popstate',handlePopState);
  return ()=>window.removeEventListener('popstate',handlePopState);
 },[setMessage]);
 useEffect(()=>{
  if(me && !PATH_TO_PAGE[window.location.pathname.replace(/\/$/,'')||'/']){
   window.history.replaceState(null,'',ROUTES.overview);
   setPage('overview');
  }
 },[me]);
 useEffect(()=>{if(me){const heading=document.querySelector('#main-content h1');heading?.focus({preventScroll:true});}},[page,me?.user_id]);
 if(me===undefined)return <div className="center">{connectionError?<div><h2>Không thể kết nối</h2><p>{connectionError}</p><button onClick={refresh}>Thử lại</button></div>:<LoadingSkeleton label="Đang tải dữ liệu tài khoản"/>}</div>;
 if(me===null)return <LoginPage/>;
 return <MainLayout me={me} page={page} onNavigate={navigate} message={message} onDismiss={()=>setMessage('')} mode={samples.mode} onModeChange={samples.setMode} sampleLoading={samples.loading} sampleError={samples.error}>
  <PageMotion page={page}>
  {page==='overview'&&<DashboardPage me={me} data={financialData} onNavigate={navigate} sampleMode={sampleMode}/>}
  {configs[page]&&page!=='scenarios'&&<EntityPage key={page} module={page} data={financialData} act={act} readOnly={sampleMode} onDetail={(module,row)=>setDetail({module,row})}/>}
  {page==='scenarios'&&<ScenariosPage data={financialData} act={act} readOnly={sampleMode} samplePreview={samples.preview} onDetail={(module,row)=>setDetail({module,row})}/>}
  {page==='reports'&&<ReportsPage key={samples.mode} act={act} sampleMode={sampleMode} samplePreview={samples.preview}/>}
  {page==='learning'&&<LearningPage onNavigate={navigate} focusSlug={focusLesson}/>}
  {page==='start'&&<OnboardingPage onNavigate={navigate}/>}
  {page==='practice'&&<PracticePage onNavigate={navigate} onSamplesChanged={samples.refreshSample}/>}
  {page==='budget-coach'&&<BudgetCoachPage key={samples.mode} data={financialData} onNavigate={navigate} sampleMode={sampleMode} samplePreview={samples.preview}/>}
  {page==='insights'&&<InsightsPage key={samples.mode} onNavigate={navigate} sampleMode={sampleMode} samplePreview={samples.preview}/>}
  {page==='recurring'&&<RecurringPage key={samples.mode} data={financialData} act={act} sampleMode={sampleMode}/>}
  {page==='profile'&&<ProfilePage me={me} act={act} onSamplesChanged={samples.refreshSample}/>}
  </PageMotion>
  {detail&&!sampleMode&&<DetailsPage module={detail.module} row={detail.row} data={data} act={act} onClose={()=>setDetail(null)}/>}
 </MainLayout>;
}
