
import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CopyIcon } from './icons/CopyIcon';
import Spinner from './Spinner';

const ImageToPrompt: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    // State for outputs
    const [englishPrompt, setEnglishPrompt] = useState<string>('');
    const [arabicExplanation, setArabicExplanation] = useState<string>('');
    
    // State for modification
    const [modificationRequest, setModificationRequest] = useState<string>('');
    const [isModifying, setIsModifying] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    
    // Ref for scrolling
    const resultSectionRef = useRef<HTMLDivElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, []);

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('يرجى رفع ملف صورة فقط.');
            return;
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setEnglishPrompt('');
        setArabicExplanation('');
        setModificationRequest('');
        setError(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const fileToGenerativePart = async (file: File) => {
        const base64EncodedDataPromise = new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            inlineData: { data: await base64EncodedDataPromise as string, mimeType: file.type },
        };
    };

    const generatePrompt = async () => {
        if (!selectedFile) return;

        setIsGenerating(true);
        setError(null);
        setEnglishPrompt('');
        setArabicExplanation('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const model = "gemini-2.5-flash";

            const imagePart = await fileToGenerativePart(selectedFile);
            
            const promptText = `
                Analyze the provided image deeply.
                
                Task 1: Generate a highly detailed English prompt suitable for AI image generators (Midjourney/Stable Diffusion). Include details about subject, lighting, camera, style, and atmosphere.
                Task 2: Provide a clear explanation in ARABIC describing the image and the key elements captured in the prompt.

                Return the result in JSON format.
            `;

            const response = await ai.models.generateContent({
                model: model,
                contents: {
                    parts: [imagePart, { text: promptText }]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            englishPrompt: { type: Type.STRING },
                            arabicExplanation: { type: Type.STRING }
                        },
                        required: ["englishPrompt", "arabicExplanation"]
                    }
                }
            });

            const resultText = response.text;
            if (resultText) {
                const jsonResult = JSON.parse(resultText);
                setEnglishPrompt(jsonResult.englishPrompt);
                setArabicExplanation(jsonResult.arabicExplanation);
                
                // Scroll to result after a short delay
                setTimeout(() => {
                    resultSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                throw new Error("لم يتم استلام رد صحيح من النموذج.");
            }

        } catch (err: any) {
            console.error(err);
            setError(`حدث خطأ أثناء تحليل الصورة: ${err.message || 'خطأ غير معروف'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRefinePrompt = async () => {
        if (!englishPrompt || !modificationRequest.trim()) return;

        setIsModifying(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const model = "gemini-2.5-flash";

            const promptText = `
                Current Image Prompt (English):
                "${englishPrompt}"

                User Request for Modification (Arabic):
                "${modificationRequest}"

                Task:
                1. Understand the user's Arabic request to modify the image.
                2. Rewrite the English prompt to incorporate these changes naturally while maintaining the original artistic style and technical details (lighting, camera, etc.) unless the user asked to change them.
                3. Provide an updated Arabic explanation of what changed.

                 Return the result in JSON format.
            `;

            const response = await ai.models.generateContent({
                model: model,
                contents: { parts: [{ text: promptText }] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            newEnglishPrompt: { type: Type.STRING },
                            newArabicExplanation: { type: Type.STRING }
                        },
                        required: ["newEnglishPrompt", "newArabicExplanation"]
                    }
                }
            });

            const resultText = response.text;
            if (resultText) {
                const jsonResult = JSON.parse(resultText);
                setEnglishPrompt(jsonResult.newEnglishPrompt);
                setArabicExplanation(jsonResult.newArabicExplanation);
                setModificationRequest(''); // Clear input
            }

        } catch (err: any) {
            console.error(err);
            setError(`حدث خطأ أثناء تعديل البرومت: ${err.message}`);
        } finally {
            setIsModifying(false);
        }
    };

    const copyToClipboard = async () => {
        if (englishPrompt) {
            try {
                await navigator.clipboard.writeText(englishPrompt);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setEnglishPrompt('');
        setArabicExplanation('');
        setModificationRequest('');
        setError(null);
    };

    return (
        <div className="w-full">
            <header className="mb-6 md:mb-8 text-center md:text-right">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400">محلل الصور الذكي</h1>
                <p className="text-slate-400 mt-2 text-sm sm:text-base">
                    استخرج "Prompt" احترافي لأي صورة، وافهمه بالعربية، ثم عدله كما تشاء.
                </p>
            </header>

            <main className="bg-slate-800/50 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 backdrop-blur-sm w-full p-4 sm:p-6 md:p-10">
                
                {!selectedFile ? (
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => document.getElementById('prompt-upload')?.click()}
                        className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-600 hover:border-cyan-500 hover:bg-slate-700/30 rounded-xl cursor-pointer transition-all duration-300 min-h-[300px] group"
                    >
                        <input
                            id="prompt-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div className="bg-slate-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <UploadIcon className="w-12 h-12 text-slate-400 group-hover:text-cyan-400" />
                        </div>
                        <p className="text-xl font-bold text-slate-200 mb-2">ارفع الصورة هنا</p>
                        <p className="text-slate-400">سحب وإفلات أو اضغط للاختيار</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {/* Top Section: Image Preview & Main Action */}
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-full md:w-1/3 shrink-0">
                                <div className="relative rounded-lg overflow-hidden border border-slate-700 shadow-lg bg-slate-900 group">
                                    <img src={previewUrl!} alt="Preview" className="w-full h-auto object-contain max-h-[350px]" />
                                    <button 
                                        onClick={handleReset}
                                        className="absolute top-2 right-2 bg-slate-900/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all"
                                        title="إلغاء واختيار صورة أخرى"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="w-full md:w-2/3 flex flex-col gap-4">
                                {!englishPrompt && !isGenerating && !error && (
                                    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-900/30 rounded-xl border border-dashed border-slate-700 text-center min-h-[300px]">
                                        <SparklesIcon className="w-16 h-16 text-cyan-400/50 mb-6" />
                                        <h3 className="text-2xl font-bold text-white mb-3">تحليل الصورة</h3>
                                        <p className="text-slate-400 mb-8 max-w-md">سيقوم الذكاء الاصطناعي بتحليل الإضاءة، الألوان، والتكوين لإنشاء وصف دقيق.</p>
                                        <button
                                            onClick={generatePrompt}
                                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-3 transform transition hover:scale-105 text-lg"
                                        >
                                            <SparklesIcon className="w-6 h-6" />
                                            <span>ابدأ التحليل (Generate)</span>
                                        </button>
                                    </div>
                                )}

                                {isGenerating && (
                                    <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-900/30 rounded-xl border border-slate-700 min-h-[300px]">
                                        <Spinner />
                                        <p className="mt-6 text-lg text-cyan-400 animate-pulse">جاري قراءة تفاصيل الصورة...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
                                        <p className="font-bold mb-2">عذراً، حدث خطأ</p>
                                        <p>{error}</p>
                                        <button onClick={generatePrompt} className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition text-white">حاول مرة أخرى</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Results Section */}
                        {englishPrompt && (
                            <div ref={resultSectionRef} className="animate-fade-in space-y-6 border-t border-slate-700/50 pt-8">
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* English Prompt (The Result) */}
                                    <div className="bg-slate-900 rounded-xl border border-cyan-500/30 shadow-xl overflow-hidden flex flex-col">
                                        <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                                            <span className="font-semibold text-cyan-400 flex items-center gap-2">
                                                <SparklesIcon className="w-4 h-4" />
                                                البرومت الإنجليزي (Midjourney)
                                            </span>
                                            <button 
                                                onClick={copyToClipboard}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${copySuccess ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                            >
                                                {copySuccess ? "تم النسخ" : <><CopyIcon className="w-4 h-4" /> نسخ</>}
                                            </button>
                                        </div>
                                        <div className="p-4 relative flex-1">
                                            <textarea 
                                                readOnly 
                                                value={englishPrompt}
                                                className="w-full h-40 bg-transparent text-slate-300 text-sm leading-relaxed outline-none resize-none font-mono selection:bg-cyan-500/30 dir-ltr text-left"
                                            ></textarea>
                                        </div>
                                    </div>

                                    {/* Arabic Explanation */}
                                    <div className="bg-slate-800/30 rounded-xl border border-slate-700 flex flex-col">
                                        <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700">
                                            <span className="font-semibold text-slate-300 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                شرح المحتوى (لفهمك)
                                            </span>
                                        </div>
                                        <div className="p-4 relative flex-1">
                                            <textarea 
                                                readOnly 
                                                value={arabicExplanation}
                                                className="w-full h-40 bg-transparent text-slate-400 text-sm leading-relaxed outline-none resize-none"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Smart Modification Section */}
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <span className="bg-cyan-500/20 p-1.5 rounded-lg text-cyan-400"><SparklesIcon className="w-5 h-5" /></span>
                                        تعديل البرومت بذكاء
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-4">
                                        هل تريد تغيير شيء في الصورة؟ اكتب التعديل بالعربية (مثلاً: "غير وقت الصورة لليل"، "اجعل السيارة حمراء") وسنقوم بتحديث الكود الإنجليزي لك.
                                    </p>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input 
                                            type="text" 
                                            value={modificationRequest}
                                            onChange={(e) => setModificationRequest(e.target.value)}
                                            placeholder="اكتب التعديلات المطلوبة هنا بالعربية..."
                                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                                            onKeyDown={(e) => e.key === 'Enter' && handleRefinePrompt()}
                                        />
                                        <button 
                                            onClick={handleRefinePrompt}
                                            disabled={isModifying || !modificationRequest.trim()}
                                            className={`px-6 py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 min-w-[140px]
                                                ${isModifying || !modificationRequest.trim() 
                                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                                    : 'bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-900/20'}`
                                            }
                                        >
                                            {isModifying ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    <span>تحديث...</span>
                                                </>
                                            ) : (
                                                "تحديث البرومت"
                                            )}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ImageToPrompt;
