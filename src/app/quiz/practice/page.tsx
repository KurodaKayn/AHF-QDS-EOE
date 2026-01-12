"use client";

import { Suspense } from "react";
import { PracticeContent } from "@/components/quiz/practice/PracticeContent";

/**
 * 刷题页面
 * 使用 Suspense 包裹以支持 useSearchParams
 */
export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-lg">加载中...</div>
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}
