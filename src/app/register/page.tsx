
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the simple login page as registration is now unified
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
        Redirecting to Portal...
      </div>
    </div>
  );
}
