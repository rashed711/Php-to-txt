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
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed ${dragClass} rounded-lg cursor-pointer transition-all duration-300 text-center`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".php,.sql,text/php,application/sql"
                multiple
                onChange={handleFileChange}
                className="hidden"
            />
            <UploadIcon className="w-16 h-16 text-slate-500 mb-4 transition-colors group-hover:text-cyan-400" />
            <p className="text-xl font-bold text-slate-300">اسحب وأفلت ملفات PHP أو SQL هنا</p>
            <p className="text-slate-400 mt-2">أو <span className="text-cyan-400 font-semibold">انقر للاختيار</span> (يمكنك اختيار أكثر من ملف)</p>
        </div>
    );
};

export default PhpUpload;