import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import PhpUpload from './components/PhpUpload';
import DownloadSection from './components/DownloadSection';
import Spinner from './components/Spinner';

type Mode = 'zip' | 'php';

// Define the structure of the zip.js library on the window object for TypeScript
declare global {
    interface Window {
        zip: any;
    }
}

// Component for tab buttons
const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 sm:flex-initial text-center px-4 sm:px-6 py-3 text-base sm:text-lg font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-t-lg ${
            isActive
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800'
                : 'text-slate-400 hover:text-white border-b-2 border-transparent'
        }`}
        role="tab"
        aria-selected={isActive}
    >
        {label}
    </button>
);

const App: React.FC = () => {
    const [mode, setMode] = useState<Mode>('zip');
    const [originalFileName, setOriginalFileName] = useState<string | null>(null);
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

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
                    // For directories, add them to preserve the folder structure.
                    if (entry.directory) {
                        await zipWriter.add(entry.filename, null, { directory: true });
                        continue;
                    }

                    // For files, determine if the name needs to be changed.
                    let newName = entry.filename;
                    const lowerCaseName = entry.filename.toLowerCase();
                    if (lowerCaseName.endsWith('.php') || lowerCaseName.endsWith('.sql')) {
                        newName = entry.filename.replace(/\.(php|sql)$/i, '.txt');
                    }
                    
                    // A more robust way to handle entries: read the data first, then add it.
                    // This avoids potential issues with stream-copying directly from the entry object.
                    const data = await entry.getData(new zip.BlobWriter());
                    
                    await zipWriter.add(newName, new zip.BlobReader(data), {
                        lastModDate: entry.lastModDate || new Date() // Fallback for last modification date
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

        const processableFiles = Array.from(files).filter(f => {
            const lowerName = f.name.toLowerCase();
            return lowerName.endsWith('.php') || lowerName.endsWith('.sql');
        });

        if (processableFiles.length === 0) {
            setError('لم يتم العثور على ملفات PHP أو SQL. الرجاء رفع ملفات بصيغة PHP أو SQL.');
            setIsProcessing(false);
            return;
        }

        setOriginalFileName(processableFiles.length > 1 ? `${processableFiles.length} ملفات` : processableFiles[0].name);

        try {
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

        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'حدث خطأ غير متوقع.';
            setError(`حدث خطأ أثناء معالجة الملفات. (${errorMessage})`);
            setOriginalFileName(null);
        } finally {
            setIsProcessing(false);
        }
    }, []);

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

    const handleReset = () => {
        setOriginalFileName(null);
        setProcessedBlob(null);
        setError(null);
        setIsProcessing(false);
    };

    const handleDownload = () => {
        if (processedBlob && originalFileName) {
            const saveAs = (window as any).saveAs;
            if (!saveAs) {
                setError("مكتبة FileSaver غير محملة. يرجى التحقق من اتصالك بالإنترنت.");
                return;
            }
            const newFileName = mode === 'zip'
                ? originalFileName.replace(/\.zip$/i, '_converted.zip')
                : 'converted_files.zip';
            saveAs(processedBlob, newFileName);
        }
    };

    return (
        <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center p-4 text-white">
            <div className="w-full max-w-2xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-cyan-400">محول امتدادات PHP و SQL إلى TXT</h1>
                    <p className="text-slate-400 mt-4 text-lg">
                        اختر طريقة التحويل: ارفع ملف ZIP أو ملفات PHP/SQL مباشرة.
                    </p>
                </header>

                <main className="bg-slate-800/50 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 backdrop-blur-sm">
                    {isProcessing ? (
                        <div className="p-6 md:p-10 flex flex-col items-center justify-center h-64">
                            <Spinner />
                            <p className="mt-4 text-xl text-slate-300">جاري المعالجة...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 md:p-10 text-center">
                            <p className="text-red-400 text-lg mb-6 whitespace-pre-wrap">{error}</p>
                            <button
                                onClick={handleReset}
                                className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors"
                            >
                                حاول مرة أخرى
                            </button>
                        </div>
                    ) : processedBlob && originalFileName ? (
                         <div className="p-6 md:p-10">
                            <DownloadSection
                                fileName={originalFileName}
                                onDownload={handleDownload}
                                onReset={handleReset}
                            />
                        </div>
                    ) : (
                        <div>
                             <div className="flex border-b border-slate-700" role="tablist" aria-label="Conversion Mode">
                                <TabButton
                                    label="تحويل ملف ZIP"
                                    isActive={mode === 'zip'}
                                    onClick={() => setMode('zip')}
                                />
                                <TabButton
                                    label="تحويل ملفات PHP / SQL"
                                    isActive={mode === 'php'}
                                    onClick={() => setMode('php')}
                                />
                            </div>
                            <div className="p-6 md:p-10">
                                {mode === 'zip' ? (
                                    <FileUpload onFileSelected={handleZipSelected} />
                                ) : (
                                    <PhpUpload onFilesSelected={handleFilesSelected} />
                                )}
                            </div>
                        </div>
                    )}
                </main>
                <footer className="text-center mt-8 text-slate-500">
                    <p>صنع بكل ❤️ للتسهيل على المطورين.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;