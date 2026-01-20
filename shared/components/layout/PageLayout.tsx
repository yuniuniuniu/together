import React from 'react';
import { Header } from './Header';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface PageLayoutHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  backPath?: string;
  rightAction?: React.ReactNode;
  variant?: 'default' | 'transparent';
}

interface PageLayoutContentProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

interface PageLayoutFloatingBarProps {
  children: React.ReactNode;
  className?: string;
}

const PageLayoutHeader: React.FC<PageLayoutHeaderProps> = (props) => {
  return <Header {...props} />;
};

const PageLayoutContent: React.FC<PageLayoutContentProps> = ({
  children,
  className = '',
  noPadding = false,
}) => {
  return (
    <main className={`flex-1 ${noPadding ? '' : 'px-6'} ${className}`}>
      {children}
    </main>
  );
};

const PageLayoutFloatingBar: React.FC<PageLayoutFloatingBarProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 ${className}`}>
      {children}
    </div>
  );
};

export const PageLayout: React.FC<PageLayoutProps> & {
  Header: typeof PageLayoutHeader;
  Content: typeof PageLayoutContent;
  FloatingBar: typeof PageLayoutFloatingBar;
} = ({ children, className = '' }) => {
  return (
    <div className={`flex-1 flex flex-col min-h-screen ${className}`}>
      {children}
    </div>
  );
};

PageLayout.Header = PageLayoutHeader;
PageLayout.Content = PageLayoutContent;
PageLayout.FloatingBar = PageLayoutFloatingBar;
