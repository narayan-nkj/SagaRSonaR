import React, { useState, useCallback, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertTriangle, Download, RefreshCw, Layers } from 'lucide-react';
import { imageProcessingApi, ImageProcessingJobResponse } from '../services/imageProcessingApi';

const ImageProcessing: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<ImageProcessingJobResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setJobId(null);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const { jobId } = await imageProcessingApi.createJob(file) as any;
      setJobId(jobId);
    } catch (err: any) {
      setError(err.message || 'Failed to start processing');
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (jobId && isProcessing) {
      interval = setInterval(async () => {
        try {
          const status = await imageProcessingApi.getJobStatus(jobId);
          setResult(status);
          if (status.status === 'completed' || status.status === 'failed') {
            setIsProcessing(false);
            clearInterval(interval);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to fetch status');
          setIsProcessing(false);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [jobId, isProcessing]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex flex-col mb-4">
        <h1 className="text-2xl font-display text-text-primary tracking-wide">Image Processing</h1>
        <p className="text-sm text-text-muted mt-1">Pre-process, assess, and validate side-scan sonar imagery before anomaly detection.</p>
        <div className="mt-2 text-xs font-mono">
          Status: <span className={result?.status === 'completed' ? 'text-success' : result?.status === 'failed' ? 'text-danger' : isProcessing ? 'text-accent' : 'text-text-muted'}>
            {result?.status ? result.status.toUpperCase() : (file ? 'READY' : 'WAITING FOR FILE')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload & Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg">
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-accent" /> Upload Sonar Image
            </h2>
            <div className="border-2 border-dashed border-glass-border-strong rounded-lg p-6 text-center hover:bg-glass-strong transition-colors">
              <input type="file" id="sonar-upload" className="hidden" accept="image/png, image/jpeg, image/tiff" onChange={handleFileChange} />
              <label htmlFor="sonar-upload" className="cursor-pointer flex flex-col items-center">
                <ImageIcon className="w-8 h-8 text-text-muted mb-2" />
                <span className="text-sm text-text-primary">Click or drag file here</span>
                <span className="text-xs text-text-muted mt-1">Supported: PNG, JPG, TIFF</span>
              </label>
            </div>
            {file && (
              <div className="mt-4 p-3 bg-glass-strong rounded-lg flex justify-between items-center text-xs text-text-muted">
                <span className="truncate max-w-[150px]">{file.name}</span>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
            <div className="mt-4">
              <button 
                onClick={handleProcess} 
                disabled={!file || isProcessing}
                className="w-full bg-accent text-void py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                Process Sonar Image
              </button>
            </div>
            {error && <div className="mt-4 text-xs text-danger flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}
          </div>

          {/* Progress panel */}
          {isProcessing && result && (
            <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-semibold mb-2">Processing Progress</h3>
              <div className="w-full bg-glass-strong rounded-full h-2 mt-4">
                <div className="bg-accent h-2 rounded-full transition-all duration-500" style={{ width: `${result.progress}%` }}></div>
              </div>
              <div className="text-xs text-text-muted mt-2 uppercase text-right">{result.stage} ({result.progress}%)</div>
            </div>
          )}

          {/* Quality Panel */}
          {result?.status === 'completed' && result.qualityAssessment && (
            <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" /> Quality Assessment
              </h3>
              <div className="space-y-3 text-xs text-text-muted">
                <div className="flex justify-between"><span>Overall Score:</span> <span className="text-text-primary font-mono">{result.qualityAssessment.overallScore}/100</span></div>
                <div className="flex justify-between"><span>Category:</span> <span className="text-text-primary font-mono uppercase">{result.qualityAssessment.category}</span></div>
                <div className="flex justify-between"><span>Speckle Noise:</span> <span className="text-text-primary font-mono capitalize">{result.qualityAssessment.speckleNoise}</span></div>
                <div className="flex justify-between"><span>Data Dropout:</span> <span className="text-text-primary font-mono">{result.qualityAssessment.dataDropoutPercentage}%</span></div>
                <div className="flex justify-between"><span>Image Coverage:</span> <span className="text-text-primary font-mono">{result.qualityAssessment.imageCoveragePercentage}%</span></div>
                <div className="flex justify-between"><span>Motion Distortion:</span> <span className="text-text-primary font-mono capitalize">{result.qualityAssessment.motionDistortion}</span></div>
                <div className="flex justify-between"><span>Shadow Visibility:</span> <span className="text-text-primary font-mono capitalize">{result.qualityAssessment.shadowVisibility}</span></div>
                <div className="flex justify-between"><span>Missing Region:</span> <span className="text-text-primary font-mono">{result.qualityAssessment.missingRegionPercentage}%</span></div>
                <div className="flex justify-between"><span>Contrast Score:</span> <span className="text-text-primary font-mono">{result.qualityAssessment.contrastScore}</span></div>
              </div>
              {result.qualityAssessment.warnings?.length > 0 && (
                <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-xs text-danger">
                  <strong>Warnings:</strong> {result.qualityAssessment.warnings.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Viewer */}
        <div className="lg:col-span-2 space-y-6">
          {result?.status === 'completed' ? (
            <>
              {/* Image Viewer */}
              <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg">
                 <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Processed Results</h2>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs text-text-muted mb-2 text-center">Original</h4>
                      <div className="border border-glass-border rounded overflow-hidden aspect-square flex items-center justify-center bg-void/50">
                        {result.originalImageUrl && <img src={result.originalImageUrl} alt="Original Sonar" className="max-w-full max-h-full object-contain" />}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs text-text-muted mb-2 text-center">Cleaned & Enhanced</h4>
                      <div className="border border-glass-border rounded overflow-hidden aspect-square flex items-center justify-center bg-void/50">
                        {result.processedImageUrl && <img src={result.processedImageUrl} alt="Processed Sonar" className="max-w-full max-h-full object-contain" />}
                      </div>
                    </div>
                 </div>
                 
                 <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Quality Mask</h4>
                    <p className="text-xs text-text-muted mb-3">The quality mask identifies areas suitable for analysis and areas that may contain noise, missing data, severe distortion, or unreliable sonar returns. Downstream detection models should use this mask to reduce false detections.</p>
                    <div className="flex gap-4">
                      <div className="flex-1 border border-glass-border rounded overflow-hidden aspect-square flex items-center justify-center bg-void/50">
                        {result.qualityMaskUrl && <img src={result.qualityMaskUrl} alt="Quality Mask" className="max-w-full max-h-full object-contain" />}
                      </div>
                      <div className="w-48 text-xs flex flex-col gap-2">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-sm"></span> Usable ({result.maskStatistics?.usablePercentage.toFixed(1)}%)</div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-500 rounded-sm"></span> Uncertain ({result.maskStatistics?.uncertainPercentage.toFixed(1)}%)</div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Shadow ({result.maskStatistics?.shadowPercentage.toFixed(1)}%)</div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Missing/Sat ({result.maskStatistics?.missingPercentage.toFixed(1)}%)</div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-black border border-glass-border rounded-sm"></span> Ignored ({result.maskStatistics?.ignoredPercentage.toFixed(1)}%)</div>
                      </div>
                    </div>
                 </div>

                 {/* Actions */}
                 <div className="mt-6 flex gap-3 flex-wrap">
                    {result.processedImageUrl && (
                      <a href={result.processedImageUrl} download className="px-3 py-1.5 bg-glass-strong hover:bg-glass-stronger rounded text-xs border border-glass-border flex items-center gap-1"><Download className="w-3 h-3" /> Cleaned Image</a>
                    )}
                    {result.qualityMaskUrl && (
                      <a href={result.qualityMaskUrl} download className="px-3 py-1.5 bg-glass-strong hover:bg-glass-stronger rounded text-xs border border-glass-border flex items-center gap-1"><Download className="w-3 h-3" /> Visual Mask</a>
                    )}
                    {result.inferenceMaskUrl && (
                      <a href={result.inferenceMaskUrl} download className="px-3 py-1.5 bg-glass-strong hover:bg-glass-stronger rounded text-xs border border-glass-border flex items-center gap-1"><Download className="w-3 h-3" /> Inference Mask</a>
                    )}
                 </div>
              </div>

              {/* Shadow/Object analysis */}
              {result.regionAnalysis && result.regionAnalysis.length > 0 && (
                <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg">
                  <h3 className="text-sm font-semibold mb-4">Shadow and Real-Object Analysis</h3>
                  <div className="space-y-3">
                    {result.regionAnalysis.map(region => (
                      <div key={region.id} className="p-3 bg-glass-strong rounded-lg border border-glass-border text-xs">
                        <div className="flex justify-between items-center mb-1">
                           <span className="font-mono text-accent">{region.label}</span>
                           <span className="text-text-muted">Conf: {region.objectConfidence > region.shadowConfidence ? region.objectConfidence : region.shadowConfidence}</span>
                        </div>
                        <p className="text-text-muted mt-1">{region.explanation}</p>
                        {region.uncertainty > 0.2 && (
                          <div className="mt-2 text-warning italic">Classification is uncertain. Additional sonar passes or optical verification may be required.</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg h-full flex flex-col items-center justify-center text-center">
              <Layers className="w-12 h-12 text-glass-border-strong mb-4" />
              <h3 className="text-text-primary text-sm font-medium">Ready for Processing</h3>
              <p className="text-xs text-text-muted max-w-sm mt-2">Upload a sonar image to begin pre-processing. The pipeline will apply noise reduction, enhancement, and quality assessment automatically.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Examples Gallery */}
      <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Previously Processed Sonar Examples</h2>
        <div className="flex items-center justify-center py-10 border-2 border-dashed border-glass-border-strong rounded-lg">
          <p className="text-xs text-text-muted">No previously processed examples available.</p>
        </div>
      </div>
    </div>
  );
};

export default ImageProcessing;
