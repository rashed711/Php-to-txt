import React from 'react';
import { ZipIcon } from './icons/ZipIcon';
import { CodeIcon } from './icons/CodeIcon';
import { PhotoIcon } from './icons/PhotoIcon';

interface HomePageProps {
    setActiveTool: (tool: 'zip' | 'php' | 'image') => void;
}

const ToolCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-slate-800/50 rounded-xl p-5 sm:p-6 border border-slate-700 hover:border-cyan-500 hover:bg-slate-800 transition-all duration-300 cursor-pointer group flex flex-col items-start h-full"
    >
        <div className="flex items-center justify-center w-12 h-12 bg-slate-700/50 rounded-lg mb-4 group-hover:bg-cyan-500/20 transition-colors shrink-0">
            {icon}
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{description}</p>
    </div>
);


const HomePage: React.FC<HomePageProps> = ({ setActiveTool }) => {
    return (
        <div className="animate-fade-in pb-8">
            <header className="text-center mb-8 md:mb-12 pt-4 md:pt-0">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                    مرحباً بك في <span className="text-cyan-400">DevBox</span>
                </h1>
                <p className="text-slate-400 mt-4 text-base sm:text-lg max-w-xl mx-auto px-2">
                    منصتك المتكاملة لمجموعة من الأدوات المصممة خصيصًا لتسريع وتسهيل مهامك اليومية كمطور.
                </p>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                 <ToolCard 
                    icon={<ZipIcon className="w-6 h-6 text-cyan-400"/>}
                    title="تحويل ملف ZIP"
                    description="قم بتحويل امتدادات ملفات PHP و SQL داخل ملف ZIP إلى TXT دفعة واحدة."
                    onClick={() => setActiveTool('zip')}
                />
                 <ToolCard 
                    icon={<CodeIcon className="w-6 h-6 text-cyan-400"/>}
                    title="تحويل PHP / SQL"
                    description="تحويل امتدادات ملفات PHP و SQL الفردية أو المتعددة مباشرة."
                    onClick={() => setActiveTool('php')}
                />
                 <ToolCard 
                    icon={<PhotoIcon className="w-6 h-6 text-cyan-400"/>}
                    title="ضغط الصور"
                    description="ضغط الصور مع الحفاظ على صيغتها الأصلية أو تحويلها إلى WebP, PNG, JPG."
                    onClick={() => setActiveTool('image')}
                />
            </div>

            <footer className="text-center mt-12 text-slate-500 text-sm">
                <p>اختر أداة من القائمة للبدء.</p>
            </footer>
        </div>
    );
};

export default HomePage;