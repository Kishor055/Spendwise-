
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Password recovery is deprecated in simple-login mode
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
        Resetting Neural Path...
      </div>
    </div>
  );
}
