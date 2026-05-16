import { Suspense } from 'react';
import LogPageInner from './LogPageInner';

export default function LogPage() {
  return (
    <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:'14px',color:'#6B7280'}}>불러오는 중...</div>}>
      <LogPageInner />
    </Suspense>
  );
}
