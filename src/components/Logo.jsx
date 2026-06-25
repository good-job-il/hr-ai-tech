import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}>
      {/* Gradient H Icon */}
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-lg">H</span>
      </div>
      {/* HeadHunter Text */}
      <div className="hidden sm:flex flex-col">
        <span className="font-bold text-gray-900 text-sm leading-tight">HeadHunter</span>
        <span className="text-blue-600 text-[10px] font-semibold">HR-Tech</span>
      </div>
    </Link>
  );
}