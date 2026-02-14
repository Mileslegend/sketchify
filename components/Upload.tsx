import {useCallback, useEffect, useRef, useState} from "react";
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import { PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS } from "../lib/constants";

const Upload = ({ onComplete, className }: UploadProps) => {

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<number | null>(null);

    const { isSignedIn } = useOutletContext<AuthContext>();

    // Clear running interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    const startProgress = useCallback((onDone: () => void) => {
        // Reset and start ticking until 100
        setProgress(0);
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        intervalRef.current = window.setInterval(() => {
            setProgress((prev) => {
                const next = Math.min(prev + PROGRESS_STEP, 100);
                if (next === 100) {
                    if (intervalRef.current) {
                        window.clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    // Small delay before completing (redirect)
                    window.setTimeout(onDone, REDIRECT_DELAY_MS);
                }
                return next;
            });
        }, PROGRESS_INTERVAL_MS);
    }, []);

    const processFile = useCallback((picked: File) => {
        if (!isSignedIn) return; // Block when not signed in
        setFile(picked);
        setIsDragging(false);

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = typeof reader.result === "string" ? reader.result : "";
            startProgress(() => {
                if (onComplete) {
                    // onComplete can be sync or async; we don't await intentionally here
                    onComplete(base64);
                }
            });
        };
        reader.onerror = () => {
            // Reset on error
            setFile(null);
            setProgress(0);
            setIsDragging(false);
        };
        reader.readAsDataURL(picked);
    }, [isSignedIn, onComplete, startProgress]);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;
        const f = e.target.files?.[0];
        if (f) processFile(f);
    }, [isSignedIn, processFile]);

    const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isSignedIn) return;
        setIsDragging(true);
    }, [isSignedIn]);

    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isSignedIn) return;
        if (!isDragging) setIsDragging(true);
    }, [isDragging, isSignedIn]);

    const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isSignedIn) return;
        setIsDragging(false);
    }, [isSignedIn]);

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isSignedIn) return;
        setIsDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) processFile(f);
    }, [isSignedIn, processFile]);

    return (
        <div className={`upload ${className ?? ""}`.trim()}>
            { !file ? (
                <div
                    className={`dropzone ${isDragging ?  'is-dragging' : ''}`}
                    onDragEnter={onDragEnter}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    <input
                        type="file"
                        className={'drop-input'}
                        accept=".jpg,.png,.jpeg"
                        onChange={onChange}
                        disabled={!isSignedIn}
                    />
                    <div className={'drop-content'}>
                        <div className="drop-icon">
                            <UploadIcon size={20} />
                        </div>
                        <p>
                            {isSignedIn ? (' Click to upload or just drag and drop') : 'Sign in or Sign up with Puter to Upload'}
                        </p>
                        <p className={'help'}>
                            Maximum file size is 50 MB
                        </p>
                    </div>
                </div>
            ) : (
                <div className={'upload-status'}>
                    <div className="status-content">
                        <div className="status-icon">
                            {
                                progress === 100 ? (
                                    <CheckCircle2 className={'check'} />
                                ) : (
                                    <ImageIcon className={'image'} />
                                )
                            }
                        </div>
                        <h3>{file.name}</h3>
                        <div className={'progress'}>
                            <div className="bar" style={{width: `${progress}%`}} />
                            <p className={'status-text'}>
                                { progress < 100 ? 'Analysing Floor Plan...' : 'Redirecting...'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Upload;