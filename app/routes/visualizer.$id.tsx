import {useLocation, useNavigate} from "react-router";
import {useRef, useState, useEffect} from "react";
import {Box, Download, RefreshCcw, Share2, X} from "lucide-react";
import Button from "../../components/ui/Button";
import { generate3DView } from "../../lib/ai.action";

const Visualizer = () => {

    const navigate = useNavigate();

    const location = useLocation();
    const { initialImage, initialRender, name } = location.state || {};

    const hasInitialGenerated = useRef(false);

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(initialRender || null);
    const [error, setError] = useState<string | null>(null);

    const handleBack = () => navigate('/');

    const runGeneration = async () => {
        if(!initialImage) return;

        try {
            setError(null); // clear any previous error when starting
            setIsProcessing(true);
            const result = await generate3DView({ sourceImage: initialImage });
            if(result.renderedImage) {
                setCurrentImage(result.renderedImage);
                // update the project in the database with the rendered image (future)
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setError(message);
            console.error('Generation failed: ', error);
        } finally {
            setIsProcessing(false);
        }
    }

    useEffect(() => {
        if(!initialImage || hasInitialGenerated.current) return;
        if(initialRender) {
            setCurrentImage(initialRender);
            hasInitialGenerated.current = true;
            return;
        }
        hasInitialGenerated.current = true;
        runGeneration();
    },[initialImage, initialRender]);

    return (
            <div className={'visualizer'}>
                <nav className={'top-bar'}>
                    <div className={'brand'}>
                        <Box className={'logo'} />
                        <span className="name">Sketchify</span>
                    <Button variant={'ghost'} size={'sm'} onClick={handleBack} className={'exit'} >
                        <X className={'icon'} /> Exit Editor
                    </Button>
                    </div>
                </nav>

                <section className={'content'}>
                    <div className={'panel'}>

                    <div className={'panel-header'}>
                        <div className={'panel-meta'}>
                            <p>Project</p>
                            <h2>{'Untilted Project'}</h2>
                            <p className={'note'}>Created by you</p>
                        </div>
                        <div className={'panel-actions'}>
                            <Button
                            size={'sm'}
                            onClick={() => {}}
                            className={'export'}
                            disabled={!currentImage}
                            >
                                <Download className={'w-4 h-4 mr-2'} /> Export
                            </Button>
                            <Button
                                size={'sm'}
                                onClick={() => {}}
                                className={'share'}

                            >
                                <Share2 className={'w-4 h-4 mr-2'} /> Share
                            </Button>
                        </div>
                    </div>
                        <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
                            { currentImage ? (
                                <img
                                src={currentImage}
                                alt={'Ai render'}
                                className={'render-img'}
                                />
                            ) : (
                                <div className={'place-holder'}>
                                    { initialImage && (
                                        <img
                                        src={initialImage}
                                        alt={'original'}
                                        className={'render-fallback'}
                                        />
                                    )}
                                </div>
                            ) }
                            { isProcessing && (
                                <div className={'render-overlay'}>
                                    <div className={'rendering-card'}>
                                        <RefreshCcw className={'spinner'} />
                                        <span className={'title'}>Rendering...</span>
                                        <span className={'subtitle'}>Generating your 3D visualization</span>
                                    </div>
                                </div>
                            )}

                            { error && !isProcessing && (
                                <div className={'render-overlay'}>
                                    <div className={'rendering-card error'} role="alert">
                                        <span className={'title'}>Generation failed</span>
                                        <span className={'subtitle'}>{error}</span>
                                        <div className={'actions'}>
                                            <Button size={'sm'} onClick={runGeneration} disabled={isProcessing}>
                                                Retry
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

            </div>

    )
}

export default Visualizer;