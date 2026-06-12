import React from 'react';

interface ThreeColumnLayoutProps {
  children: React.ReactNode;
}

export default function ThreeColumnLayout({ children }: ThreeColumnLayoutProps) {
  return (
    <div className="three-column-layout">
      <div className="three-column-side" />
      <div className="three-column-content">
        {children}
      </div>
      <div className="three-column-side" />
    </div>
  );
}
