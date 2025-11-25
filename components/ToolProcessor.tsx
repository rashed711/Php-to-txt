import React, { useState, useCallback, useEffect } from 'react';
import FileUpload from './FileUpload';
import PhpUpload from './PhpUpload';
import ImageUpload from './ImageUpload';
import DownloadSection from './DownloadSection';
import Spinner from './Spinner';

type ToolType = 'zip' | 'php' | 'image';
type ImageFormat = 'webp' | 'png' | 'jpg' | 'default';

interface ToolProcessorProps {
    toolType: ToolType;
}

declare global {
    interface Window {
        zip: any;
    }
}

const toolConfig = {
    zip: {
        title: "تحويل ملف ZIP",
        description: "ارفع ملف ZIP يحتوي على ملفات PHP أو SQL، وسيتم تحويل امتداداتها إلى .txt تلقائيًا."
    },
    php: {
        title: "تحويل PHP / SQL",
        description: "اختر ملفًا واحدًا أو أكثر بامتداد .php أو .sql لتحويلها إلى .txt."
    },
    image: {
        title: "ضغط وتحويل الصور",
        description: "ارفع الصور، اختر 'افتراضي' للحفاظ على الصيغة الأصلية، أو اختر صيغة محددة للتحويل."
    }
};

const FormatSelector: React.FC<{ selected: ImageFormat; onSelect: (format: ImageFormat) => void }> = ({ selected, onSelect }) => {
    const formats: {key: ImageFormat, label: string}[] = [
        { key: 'default', label: 'افتراضي' },
        { key: 'webp', label: 'WEBP' },
        { key: 'png', label: 'PNG' },
        { key: 'jpg', label: 'JPG' },
    ];
    return (
        <div className="mb-6 flex flex-col items-center w-full">
            <label className="text-slate-300 mb-3 font-semibold text-sm sm:text-base">اختر صيغة الإخراج:</label>
            <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-700/50 rounded-lg w-full sm:w-auto">
                {formats.map(format => (
                    <button
                        key={format.key}
                        onClick={() => onSelect(format.key)}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-colors duration-200 whitespace-nowrap ${
                            selected === format.key 
                                ? 'bg-cyan-500 text-slate-900 shadow-lg' 
                                : 'text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {format.label}
                    </button>
                ))}
            </div>
        </div>
    );
};


const ToolProcessor: React.FC<ToolProcessorProps> = ({ toolType }) => {
    const [originalFileName, setOriginalFileName] = useState<string | null>(null);
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSingleFile, setIsSingleFile] = useState<boolean>(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [originalSize, setOriginalSize] = useState<number | null>(null);
    const [newSize, setNewSize] = useState<number | null>(null);
    const [imageOutputFormat, setImageOutputFormat] = useState<ImageFormat>('default');
    const [processedFileExtension, setProcessedFileExtension] = useState<string | null>(null);


    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const processZipFile = useCallback(async (file: File) => {
        setIsProcessing(true);
        setError(null);
        setProcessedBlob(null);
        setOriginalFileName(file.name);

        try {
            const zip = window.zip;
            if (!zip) throw new Error("مكتبة zip.js غير محملة. يرجى التحقق من اتصالك بالإنترنت.");

            const blobReader = new zip.BlobReader(file);
            const zipReader = new zip.ZipReader(blobReader);
            const entries = await zipReader.getEntries();
            
            const blobWriter = new zip.BlobWriter("application/zip");
            const zipWriter = new zip.ZipWriter(blobWriter);

            if (entries.length > 0) {
                for (const entry of entries) {
                    if (entry.directory) {
                        await zipWriter.add(entry.filename, null, { directory: true });
                        continue;
                    }

                    let newName = entry.filename;
                    const lowerCaseName = entry.filename.toLowerCase();
                    if (lowerCaseName.endsWith('.php') || lowerCaseName.endsWith('.sql')) {
                        newName = entry.filename.replace(/\.(php|sql)$/i, '.txt');
                    }
                    
                    const data = await entry.getData(new zip.BlobWriter());
                    
                    await zipWriter.add(newName, new zip.BlobReader(data), {
                        lastModDate: entry.lastModDate || new Date()
                    });
                }
            }
            
            await zipReader.close();
            const newZipBlob = await zipWriter.close();
            setProcessedBlob(newZipBlob);

        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'حدث خطأ غير متوقع.';
            const finalErrorMessage = `فشل في معالجة الملف المضغوط. قد يكون الملف تالفًا أو بصيغة غير مدعومة.\n\n(الخطأ التقني: ${errorMessage})`;
            setError(finalErrorMessage);
            setOriginalFileName(null);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const processIndividualFiles = useCallback(async (files: FileList) => {
        setIsProcessing(true);
        setError(null);
        setProcessedBlob(null);
        setIsSingleFile(false); 

        const processableFiles = Array.from(files).filter(f => {
            const lowerName = f.name.toLowerCase();
            return lowerName.endsWith('.php') || lowerName.endsWith('.sql');
        });

        if (processableFiles.length === 0) {
            setError('لم يتم العثور على ملفات PHP أو SQL. الرجاء رفع ملفات بصيغة PHP أو SQL.');
            setIsProcessing(false);
            return;
        }

        try {
            if (processableFiles.length === 1) {
                const file = processableFiles[0];
                setOriginalFileName(file.name);
                const text = await file.text();
                setProcessedBlob(new Blob([text], { type: 'text/plain' }));
                setIsSingleFile(true);
            } else {
                setOriginalFileName(`${processableFiles.length} ملفات`);
                setIsSingleFile(false);

                const zip = window.zip;
                if (!zip) throw new Error("مكتبة zip.js غير محملة.");

                const blobWriter = new zip.BlobWriter("application/zip");
                const zipWriter = new zip.ZipWriter(blobWriter);

                for (const file of processableFiles) {
                    const newName = file.name.replace(/\.(php|sql)$/i, '.txt');
                    await zipWriter.add(newName, new zip.BlobReader(file));
                }
                
                const newZipBlob = await zipWriter.close();
                setProcessedBlob(newZipBlob);
            }
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'حدث خطأ غير متوقع.';
            setError(`حدث خطأ أثناء معالجة الملفات. (${errorMessage})`);
            setOriginalFileName(null);
        } finally {
            setIsProcessing(false);
        }
    }, []);
    
    const getTargetImageFormat = useCallback((file: File, selectedFormat: ImageFormat): 'webp' | 'png' | 'jpg' => {
        if (selectedFormat === 'default') {
            const originalExtension = (file.name.split('.').pop() || '').toLowerCase();
            if (originalExtension === 'png') return 'png';
            if (originalExtension === 'jpg' || originalExtension === 'jpeg') return 'jpg';
            return 'png'; // Fallback for GIF, BMP, etc. to preserve transparency
        }
        return selectedFormat;
    }, []);


    const processImageFiles = useCallback(async (files: File[]) => {
        setIsProcessing(true);
        setError(null);
        setProcessedBlob(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setOriginalSize(null);
        setNewSize(null);
        setIsSingleFile(false);
        setProcessedFileExtension(null);

        try {
            const totalOriginalSize = files.reduce((acc, file) => acc + file.size, 0);
            setOriginalSize(totalOriginalSize);
            
            if (files.length === 1) {
                // --- Single Image Processing ---
                const file = files[0];
                setOriginalFileName(file.name);
                
                const targetFormat = getTargetImageFormat(file, imageOutputFormat);
                
                const image = new Image();
                const imageUrl = URL.createObjectURL(file);
                await new Promise<void>((resolve, reject) => {
                   image.onload = () => { URL.revokeObjectURL(imageUrl); resolve(); };
                   image.onerror = (err) => { URL.revokeObjectURL(imageUrl); reject(new Error(`فشل تحميل الصورة: ${file.name}`)); };
                   image.src = imageUrl;
                });

                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('لا يمكن الحصول على سياق Canvas');
                ctx.drawImage(image, 0, 0);
                
                const mimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`;
                const quality = (mimeType === 'image/jpeg' || mimeType === 'image/webp') ? 0.8 : undefined;

                const processedBlob = await new Promise<Blob | null>((resolve) => {
                    canvas.toBlob(resolve, mimeType, quality);
                });

                if (!processedBlob) throw new Error(`فشل في تحويل الصورة ${file.name}`);
                
                const finalBlob = processedBlob.size >= file.size ? file : processedBlob;
                const finalExtension = processedBlob.size >= file.size ? (file.name.split('.').pop() || targetFormat) : targetFormat;

                setProcessedBlob(finalBlob);
                setNewSize(finalBlob.size);
                setIsSingleFile(true);
                setPreviewUrl(URL.createObjectURL(finalBlob));
                setProcessedFileExtension(finalExtension);

            } else {
                // --- Multiple Image Processing (ZIP) ---
                setOriginalFileName(`${files.length} ${files.length < 11 && files.length > 2 ? 'صور' : 'صورة'}`);
                
                const zip = window.zip;
                if (!zip) throw new Error("مكتبة zip.js غير محملة.");

                const blobWriter = new zip.BlobWriter("application/zip");
                const zipWriter = new zip.ZipWriter(blobWriter);

                for (const file of files) {
                    const targetFormat = getTargetImageFormat(file, imageOutputFormat);

                    const image = new Image();
                    const imageUrl = URL.createObjectURL(file);
                    
                    await new Promise<void>((resolve, reject) => {
                       image.onload = () => { URL.revokeObjectURL(imageUrl); resolve(); };
                       image.onerror = () => { URL.revokeObjectURL(imageUrl); reject(new Error(`فشل تحميل الصورة: ${file.name}`)); };
                       image.src = imageUrl;
                    });

                    const canvas = document.createElement('canvas');
                    canvas.width = image.width;
                    canvas.height = image.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error('لا يمكن الحصول على سياق Canvas');
                    ctx.drawImage(image, 0, 0);
                    
                    const mimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`;
                    const quality = (mimeType === 'image/jpeg' || mimeType === 'image/webp') ? 0.8 : undefined;

                    const processedBlob = await new Promise<Blob | null>((resolve) => {
                        canvas.toBlob(resolve, mimeType, quality);
                    });

                    if (!processedBlob) {
                        console.warn(`فشل في تحويل الصورة ${file.name}, سيتم استخدام الملف الأصلي.`);
                        await zipWriter.add(file.name, new zip.BlobReader(file));
                        continue;
                    }
                    
                    if (processedBlob.size >= file.size) {
                        await zipWriter.add(file.name, new zip.BlobReader(file));
                    } else {
                        const newName = (file.name.substring(0, file.name.lastIndexOf('.')) || file.name) + `.${targetFormat}`;
                        await zipWriter.add(newName, new zip.BlobReader(processedBlob));
                    }
                }

                const newZipBlob = await zipWriter.close();
                if (newZipBlob.size === 0) {
                    throw new Error("لم يتم معالجة أي صور بنجاح.");
                }
                setProcessedBlob(newZipBlob);
                setNewSize(newZipBlob.size);
            }
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'حدث خطأ غير متوقع.';
            setError(`فشل في معالجة الصور. قد يكون أحد الملفات غير صالح أو بصيغة غير مدعومة.\n\n(الخطأ التقني: ${errorMessage})`);
            setOriginalFileName(null);
        } finally {
            setIsProcessing(false);
        }
    }, [previewUrl, imageOutputFormat, getTargetImageFormat]);


    const handleZipSelected = (file: File) => {
        if (file.type !== 'application/zip' && !file.name.toLowerCase().endsWith('.zip')) {
            setError('الرجاء رفع ملف مضغوط بصيغة ZIP فقط.');
            return;
        }
        setError(null);
        processZipFile(file);
    };

    const handleFilesSelected = (files: FileList) => {
        setError(null);
        processIndividualFiles(files);
    };

    const handleImageSelected = (files: FileList) => {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            setError('الرجاء رفع ملفات صور صالحة.');
            return;
        }
        setError(null);
        processImageFiles(imageFiles);
    };

    const handleReset = () => {
        setOriginalFileName(null);
        setProcessedBlob(null);
        setError(null);
        setIsProcessing(false);
        setIsSingleFile(false);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setOriginalSize(null);
        setNewSize(null);
        setProcessedFileExtension(null);
    };

    const handleDownload = () => {
        if (processedBlob && originalFileName) {
            const saveAs = (window as any).saveAs;
            if (!saveAs) {
                setError("مكتبة FileSaver غير محملة. يرجى التحقق من اتصالك بالإنترنت.");
                return;
            }
            
            let newFileName: string;

            if (toolType === 'zip') {
                newFileName = originalFileName.replace(/\.zip$/i, '_converted.zip');
            } else if (toolType === 'php') {
                if (isSingleFile) {
                    newFileName = originalFileName.replace(/\.(php|sql)$/i, '.txt');
                } else {
                    newFileName = 'converted_files.zip';
                }
            } else { // toolType === 'image'
                if (isSingleFile) {
                    const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
                    newFileName = `${baseName}.${processedFileExtension}`;
                } else {
                    newFileName = 'compressed_images.zip';
                }
            }
            saveAs(processedBlob, newFileName);
        }
    };
    
    const currentTool = toolConfig[toolType];

    return (
        <div className="w-full">
            <header className="mb-6 md:mb-8 text-center md:text-right">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400">{currentTool.title}</h1>
                <p className="text-slate-400 mt-2 text-sm sm:text-base">
                   {currentTool.description}
                </p>
            </header>

            <main className="bg-slate-800/50 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 backdrop-blur-sm w-full">
                {isProcessing ? (
                    <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[250px]">
                        <Spinner />
                        <p className="mt-6 text-lg sm:text-xl text-slate-300 animate-pulse">جاري المعالجة...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 sm:p-10 text-center">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 inline-block w-full">
                            <p className="text-red-400 text-base sm:text-lg whitespace-pre-wrap">{error}</p>
                        </div>
                        <div>
                            <button
                                onClick={handleReset}
                                className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-8 rounded-lg transition-colors"
                            >
                                حاول مرة أخرى
                            </button>
                        </div>
                    </div>
                ) : processedBlob && originalFileName ? (
                     <div className="p-4 sm:p-6 md:p-10">
                        <DownloadSection
                            fileName={originalFileName}
                            onDownload={handleDownload}
                            onReset={handleReset}
                            isSingleFile={isSingleFile}
                            previewUrl={previewUrl}
                            originalSize={originalSize}
                            newSize={newSize}
                        />
                    </div>
                ) : (
                    <div className="p-4 sm:p-6 md:p-10">
                        {toolType === 'image' && (
                            <FormatSelector selected={imageOutputFormat} onSelect={setImageOutputFormat} />
                        )}
                        {toolType === 'zip' && <FileUpload onFileSelected={handleZipSelected} />}
                        {toolType === 'php' && <PhpUpload onFilesSelected={handleFilesSelected} />}
                        {toolType === 'image' && <ImageUpload onFilesSelected={handleImageSelected} />}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ToolProcessor;