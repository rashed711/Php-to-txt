
import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { ZipIcon } from './icons/ZipIcon';

interface DownloadSectionProps {
    fileName: string;
    onDownload: () => void;
    onReset: () => void;
}

const DownloadSection: React.FC<DownloadSectionProps> = ({ fileName, onDownload, onReset }) => {
    return (
        <div className="text-center flex flex-col items-center">
            <ZipIcon className="w-20 h-20 text-cyan-400 mb-4"/>
            <h2 className="text-2xl font-bold text-white mb-2">تمت المعالجة بنجاح!</h2>
            <p className="text-slate-400 mb-6 truncate max-w-full px-4" title={fileName}>
                الملف الأصلي: <span className="font-semibold text-slate-300">{fileName}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button
                    onClick={onDownload}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105"
                >
                    <DownloadIcon className="w-5 h-5" />
                    <span>تحميل الملف المحول</span>
                </button>
                <button
                    onClick={onReset}
                    className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                >
                    تحويل ملف آخر
                </button>
            </div>
        </div>
    );
};

export default DownloadSection;
