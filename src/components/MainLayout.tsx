import { type FC, type ReactNode } from 'react';
import DashboardSidebar from './DashboardSidebar';

interface MainLayoutProps {
  children: ReactNode;
  headerContent?: ReactNode;
}

const MainLayout: FC<MainLayoutProps> = ({ children, headerContent }) => {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        {headerContent}
        {children}
      </main>
    </div>
  );
};

export default MainLayout;