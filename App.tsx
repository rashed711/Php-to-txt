
import React, { useState } from 'react';
import { HomeIcon } from './components/icons/HomeIcon';
import { ZipIcon } from './components/icons/ZipIcon';
import { CodeIcon } from './components/icons/CodeIcon';
import { PhotoIcon } from './components/icons/PhotoIcon';
import { MenuIcon } from './components/icons/MenuIcon';
import { CloseIcon } from './components/icons/CloseIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import HomePage from './components/HomePage';
import ToolProcessor from './components/ToolProcessor';
import ImageToPrompt from './components/ImageToPrompt';

type Tool = 'home' | 'zip' | 'php' | 'image' | 'prompt';

const NavGroup: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="px-4 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {title}
    </h3>
);

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-right text-base rounded-lg transition-colors duration-200 mb-1 ${
            isActive
                ? 'bg-cyan-500/10 text-cyan-400 font-medium'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
        }`}
    >
        <span className="ml-3">{icon}</span>
        <span>{label}</span>
    </button>
);

const App: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool>('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleToolChange = (tool: Tool) => {
        setActiveTool(tool);
        setIsSidebarOpen(false); // Close sidebar on mobile when item selected
    };

    const renderTool = () => {
        switch (activeTool) {
            case 'home':
                return <HomePage setActiveTool={handleToolChange} />;
            case 'zip':
                return <ToolProcessor key="zip" toolType="zip" />;
            case 'php':
                return <ToolProcessor key="php" toolType="php" />;
            case 'image':
                return <ToolProcessor key="image" toolType="image" />;
            case 'prompt':
                return <ImageToPrompt />;
            default:
                return <HomePage setActiveTool={handleToolChange} />;
        }
    };
    
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-slate-900 text-white font-sans">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">
                        Dev<span className="text-cyan-400">Box</span>
                    </span>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-slate-300 hover:text-white focus:outline-none"
                    aria-label="فتح القائمة"
                >
                    <MenuIcon className="w-6 h-6" />
                </button>
            </header>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`
                fixed inset-y-0 right-0 z-50 w-72 bg-slate-800 border-l border-slate-700 
                transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:w-64 md:block
                ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 md:p-6 md:justify-center">
                        <div className="md:text-center">
                            <h1 className="text-2xl font-bold text-white">
                                Dev<span className="text-cyan-400">Box</span>
                            </h1>
                            <p className="text-xs text-slate-400 hidden md:block mt-1">صندوق أدوات المطور</p>
                        </div>
                        <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden p-2 text-slate-400 hover:text-white"
                        >
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                        <NavItem
                            icon={<HomeIcon className="w-5 h-5" />}
                            label="الرئيسية"
                            isActive={activeTool === 'home'}
                            onClick={() => handleToolChange('home')}
                        />

                        <NavGroup title="الذكاء الاصطناعي" />
                        <NavItem
                            icon={<SparklesIcon className="w-5 h-5" />}
                            label="استخراج وصف الصورة"
                            isActive={activeTool === 'prompt'}
                            onClick={() => handleToolChange('prompt')}
                        />

                        <NavGroup title="أدوات الملفات" />
                        <NavItem
                            icon={<ZipIcon className="w-5 h-5" />}
                            label="تحويل ملف ZIP"
                            isActive={activeTool === 'zip'}
                            onClick={() => handleToolChange('zip')}
                        />
                         <NavItem
                            icon={<CodeIcon className="w-5 h-5" />}
                            label="تحويل PHP / SQL"
                            isActive={activeTool === 'php'}
                            onClick={() => handleToolChange('php')}
                        />

                        <NavGroup title="أدوات الصور" />
                         <NavItem
                            icon={<PhotoIcon className="w-5 h-5" />}
                            label="ضغط الصور"
                            isActive={activeTool === 'image'}
                            onClick={() => handleToolChange('image')}
                        />
                    </nav>

                    <div className="p-4 border-t border-slate-700 md:hidden">
                        <p className="text-xs text-center text-slate-500">
                           جميع الحقوق محفوظة &copy; 2024
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 w-full overflow-x-hidden">
                <div className="h-full p-4 sm:p-6 lg:p-10 overflow-y-auto">
                    <div className="w-full max-w-4xl mx-auto">
                        {renderTool()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
