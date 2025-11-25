import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { ZipIcon } from './icons/ZipIcon';
import { FileTxtIcon } from './icons/FileTxtIcon';

interface DownloadSectionProps {
    fileName: string;
    onDownload: () => void;
    onReset: () => void;
    isSingleFile?: boolean;
    previewUrl?: string | null;
    originalSize?: number | null;
    newSize?: number | null;
}

const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const DownloadSection: React.FC<DownloadSectionProps> = ({ fileName, onDownload, onReset, isSingleFile, previewUrl, originalSize, newSize }) => {
    
    const getDownloadButtonText = () => {
        if (isSingleFile) {
            return previewUrl ? "تحميل الصورة المحولة" : "تحميل الملف النصي";
        }
        return "تحميل الملف المضغوط";
    };

    return (
        <div className="text-center flex flex-col items-center w-full">
            {previewUrl ? (
                <img src={previewUrl} alt="معاينة الصورة المضغوطة" className="max-w-full max-h-48 sm:max-h-64 object-contain rounded-lg bg-slate-900/50 p-2 mb-4 border border-slate-700 shadow-md" />
            ) : isSingleFile ? (
                 <FileTxtIcon className="w-16 h-16 sm:w-20 sm:h-20 text-cyan-400 mb-4"/>
            ) : (
                <ZipIcon className="w-16 h-16 sm:w-20 sm:h-20 text-cyan-400 mb-4"/>
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">تمت المعالجة بنجاح!</h2>

            {originalSize && newSize && newSize > 0 && (
                <div className="text-xs sm:text-sm bg-slate-700/50 rounded-lg px-4 py-3 mb-5 inline-block text-left border border-slate-600">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        <span className="text-slate-400">الحجم الأصلي:</span>
                        <span className="font-semibold text-white text-left dir-ltr">{formatBytes(originalSize)}</span>
                        
                        <span className="text-slate-400">الحجم الجديد:</span>
                        <span className="font-semibold text-white text-left dir-ltr">{formatBytes(newSize)}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-600 text-center">
                         <span className="font-bold text-cyan-400 block">
                            توفير {Math.round(100 - (newSize / originalSize) * 100)}% من المساحة
                        </span>
                    </div>
                </div>
            )}

            <p className="text-slate-400 mb-8 truncate max-w-full px-2 text-sm sm:text-base dir-ltr" title={fileName}>
                {fileName}
            </p>

            <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center sm:gap-4">
                <button
                    onClick={onDownload}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3.5 px-8 rounded-lg transition-transform transform active:scale-95 sm:hover:scale-105 shadow-lg shadow-cyan-500/20"
                >
                    <DownloadIcon className="w-5 h-5" />
                    <span>{getDownloadButtonText()}</span>
                </button>
                <button
                    onClick={onReset}
                    className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 px-8 rounded-lg transition-colors active:bg-slate-600"
                >
                    معالجة ملف آخر
                </button>
            </div>
        </div>
    );
};

export default DownloadSection;