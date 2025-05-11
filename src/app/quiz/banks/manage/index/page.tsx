'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ManageBankIndexRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 重定向到上级目录
      router.replace('/quiz/banks/manage/');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>重定向中...</p>
    </div>
  );
} 