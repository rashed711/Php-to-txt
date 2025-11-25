import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface PhpUploadProps {
    onFilesSelected: (files: FileList) => void;
}

const PhpUpload: React.FC<PhpUploadProps> = ({ onFilesSelected }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesSelected(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    }, [onFilesSelected]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(e.target.files);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const dragClass = isDragging ? 'border-cyan-400 bg-slate-700/50' : 'border-slate-600 hover:border-cyan-500';

    return (
        <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center p-6 sm:p-10 border-2 border-dashed ${dragClass} rounded-xl cursor-pointer transition-all duration-300 text-center min-h-[250px] group`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".php,.sql,text/php,application/sql"
                multiple
                onChange={handleFileChange}
                className="hidden"
            />
            <div className="bg-slate-800/80 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <UploadIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-slate-200 mb-2">اسحب وأفلت ملفات PHP أو SQL</p>
            <p className="text-sm sm:text-base text-slate-400">أو <span className="text-cyan-400 font-semibold underline decoration-cyan-400/30 underline-offset-4">تصفح جهازك</span></p>
            <p className="text-xs text-slate-500 mt-3 bg-slate-800/50 px-3 py-1 rounded-full">يمكنك اختيار ملف واحد أو أكثر</p>
        </div>
    );
};

export default PhpUpload;