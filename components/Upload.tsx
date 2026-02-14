import {useCallback, useEffect, useRef, useState} from "react";
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import { PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS } from "../lib/constants";

const Upload = ({ onComplete, className }: UploadProps) => {

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<number | null>(null);

    const { isSignedIn } = useOutletContext<AuthContext>();

    // Validation config
    const allowedTypes = ["image/jpeg", "image/png"];
    const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50 MB

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
        // 1) Block when not signed in
        if (!isSignedIn) return;

        // 2) Clear previous error
        setError(null);

        // 3) Validate type and size BEFORE any reading happens
        const isTypeAllowed = allowedTypes.includes(picked.type);
        const isSizeAllowed = picked.size <= MAX_UPLOAD_SIZE;
        if (!isTypeAllowed || !isSizeAllowed) {
            // Reset UI and surface an error; do NOT read the file
            setFile(null);
            setProgress(0);
            setIsDragging(false);
            const readableSizeMb = (MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(0);
            const errMsg = !isTypeAllowed
                ? `Unsupported file type: ${picked.type || "unknown"}. Allowed: JPG, PNG.`
                : `File is too large. Max size is ${readableSizeMb} MB.`;
            setError(errMsg);
            return;
        }

        // 4) Passed validation — proceed
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
            setError("Failed to read the file. Please try again.");
        };
        reader.readAsDataURL(picked);
    }, [isSignedIn, onComplete, startProgress, allowedTypes]);

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
                        {error && (
                            <p className={'error'} role="alert">
                                {error}
                            </p>
                        )}
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